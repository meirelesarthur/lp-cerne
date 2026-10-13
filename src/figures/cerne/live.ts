// Parte viva da figura: um só laço de quadros, escreve atributos direto no SVG (sem re-render do React).
import { DEVICES, STEPS, advance, nextStep, readoutOf, statusOf, type Device, type OsState } from './model'

type Flat = [number, number]
export interface ArtData {
  layout: 'desktop' | 'mobile'
  width: number
  height: number
  P: { origin: readonly number[]; scale: number; azimuth: number; elevation: number }
  dialTop: number
  pointerR: number
  stepAngles: readonly number[]
  cables: Record<Device, readonly (readonly number[])[]>
  press: readonly number[]
}

export interface LiveCallbacks {
  readout: (text: string) => void
  state: (s: OsState) => void
}

const DEVS: Device[] = ['web', 'adm', 'op']
const PULSE_IN = 0.55
const PULSE_OUT = 0.6
const TOUR_EVERY = 2.6
const TOUR_RESUME = 7000

export function mountLive(svg: SVGSVGElement, data: ArtData, cb: LiveCallbacks) {
  const still = matchMedia('(prefers-reduced-motion: reduce)')
  const { P } = data
  // mesma projeção do kit (iso-kit: UNIT = √1.6)
  const a = (P.azimuth * Math.PI) / 180
  const e = (P.elevation * Math.PI) / 180
  const kk = P.scale * Math.sqrt(1.6)
  const iso = (x: number, y: number, z: number): Flat => [
    P.origin[0] + (x * Math.sin(a) - y * Math.cos(a)) * kk,
    P.origin[1] + ((x * Math.cos(a) + y * Math.sin(a)) * Math.sin(e) - z * Math.cos(e)) * kk,
  ]

  const q = <T extends Element>(sel: string) => svg.querySelector<T>(sel)
  const pointer = q<SVGPathElement>('[data-part="pointer"]')!
  const marks = [...svg.querySelectorAll<SVGCircleElement>('[data-mark]')]
  const devEl = Object.fromEntries(DEVS.map((d) => [d, q<SVGGElement>(`[data-dev="${d}"]`)!])) as Record<Device, SVGGElement>
  const pulseEl = Object.fromEntries(DEVS.map((d) => [d, q<SVGCircleElement>(`[data-pulse="${d}"]`)!])) as Record<Device, SVGCircleElement>
  const cableEl = Object.fromEntries(DEVS.map((d) => [d, q<SVGGElement>(`[data-cable="${d}"]`)!])) as Record<Device, SVGGElement>
  const pipEl = Object.fromEntries(DEVS.map((d) => [d, [...svg.querySelectorAll<SVGRectElement>(`[data-part="pips-${d}"] rect`)]])) as Record<Device, SVGRectElement[]>
  const statusEl = Object.fromEntries(DEVS.map((d) => [d, q<SVGTextElement>(`[data-part="status-${d}"]`)!])) as Record<Device, SVGTextElement>
  const flashEl = Object.fromEntries(DEVS.map((d) => [d, q<SVGPathElement>(`[data-part="flash-${d}"]`)!])) as Record<Device, SVGPathElement>

  // cabos em coordenadas de tela, do colar do eixo até o aparelho
  const paths = Object.fromEntries(
    DEVS.map((d) => {
      const pts = data.cables[d].map(([x, y]) => [x, y] as Flat)
      const len = [0]
      for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
      return [d, { pts, len, total: len[len.length - 1] }]
    }),
  ) as Record<Device, { pts: Flat[]; len: number[]; total: number }>
  const along = (d: Device, t: number): Flat => {
    const { pts, len, total } = paths[d]
    const at = Math.max(0, Math.min(1, t)) * total
    let i = 1
    while (i < pts.length - 1 && len[i] < at) i++
    const span = len[i] - len[i - 1] || 1
    const f = (at - len[i - 1]) / span
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]
  }

  let state: OsState = { os: 0, step: -1 }
  const shown: Record<Device, OsState> = { web: state, adm: state, op: state }
  let angle = data.stepAngles[nextStep(state)]
  let target = angle
  let clock = 0
  let busy = false
  let visible = false
  let frame = 0
  let last = 0
  let touring = !still.matches
  let tourAt = 1.4
  let resumeTimer = 0
  let readoutTimer = 0
  const pulses: { dev: Device; dir: 'in' | 'out'; t0: number; dur: number; done: () => void }[] = []
  const flashes: Record<Device, number> = { web: -9, adm: -9, op: -9 }
  const presses: Record<Device, number> = { web: -9, adm: -9, op: -9 }

  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

  function paintScreen(d: Device) {
    const s = shown[d]
    statusEl[d].textContent = statusOf(s)
    pipEl[d].forEach((r, i) => r.toggleAttribute('data-on', s.step >= 0 && i <= s.step))
  }
  function paintMarks() {
    const next = nextStep(state)
    marks.forEach((m, i) => {
      m.toggleAttribute('data-done', state.step >= 0 && i <= state.step)
      m.toggleAttribute('data-next', i === next)
    })
    const turn = STEPS[next].by
    DEVS.forEach((d) => devEl[d].toggleAttribute('data-turn', d === turn && !busy))
  }
  function paintPointer() {
    const [x0, y0] = iso(-Math.cos(angle) * 5, -Math.sin(angle) * 5, data.dialTop)
    const [x1, y1] = iso(Math.cos(angle) * data.pointerR, Math.sin(angle) * data.pointerR, data.dialTop)
    pointer.setAttribute('d', `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`)
  }
  function say(text: string, hold = 0) {
    cb.readout(text)
    clearTimeout(readoutTimer)
    if (hold) readoutTimer = window.setTimeout(() => cb.readout(readoutOf(state)), hold)
  }

  function commit() {
    state = advance(state)
    target = data.stepAngles[nextStep(state)]
    // o ponteiro gira sempre no sentido mais curto
    while (target - angle > Math.PI) target -= Math.PI * 2
    while (target - angle < -Math.PI) target += Math.PI * 2
    paintMarks()
    cb.state(state)
    say(readoutOf(state))
  }

  /** Um aparelho age. Devolve false quando não é a vez dele. */
  function act(dev: Device, fromTour = false): boolean {
    if (!fromTour) takeOver()
    if (busy) return false
    const next = STEPS[nextStep(state)]
    if (next.by !== dev) {
      presses[dev] = clock
      devEl[dev].setAttribute('data-wrong', '')
      window.setTimeout(() => devEl[dev].removeAttribute('data-wrong'), 700)
      say(`agora é a vez do ${DEVICES[next.by].who}`, 1800)
      run()
      return false
    }
    presses[dev] = clock
    flashes[dev] = clock
    if (still.matches) {
      commit()
      DEVS.forEach((d) => {
        shown[d] = state
        paintScreen(d)
      })
      angle = target
      paintPointer()
      return true
    }
    busy = true
    paintMarks()
    // ida: do aparelho até o eixo; volta: do eixo para os três aparelhos ao mesmo tempo
    pulses.push({
      dev, dir: 'in', t0: clock, dur: PULSE_IN,
      done: () => {
        commit()
        let left = DEVS.length
        for (const d of DEVS) {
          pulses.push({
            dev: d, dir: 'out', t0: clock, dur: PULSE_OUT,
            done: () => {
              shown[d] = state
              paintScreen(d)
              flashes[d] = clock
              if (--left === 0) {
                busy = false
                paintMarks()
              }
            },
          })
        }
      },
    })
    run()
    return true
  }

  function takeOver() {
    touring = false
    clearTimeout(resumeTimer)
    resumeTimer = window.setTimeout(() => {
      if (still.matches) return
      touring = true
      tourAt = clock + 0.6
      run()
    }, TOUR_RESUME)
  }
  function hold() {
    touring = false
    clearTimeout(resumeTimer)
  }

  function tick(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60
    last = now
    clock += dt
    if (touring && !busy && clock >= tourAt) {
      act(STEPS[nextStep(state)].by, true)
      tourAt = clock + TOUR_EVERY
    }
    // ponteiro: segue o alvo com suavização exponencial
    angle += (target - angle) * (1 - Math.exp(-dt / 0.22))
    if (Math.abs(target - angle) < 0.002) angle = target
    paintPointer()
    // pulsos nos cabos
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]
      const t = (clock - p.t0) / p.dur
      if (t >= 1) {
        pulses.splice(i, 1)
        p.done()
      }
    }
    for (const d of DEVS) {
      const p = pulses.find((x) => x.dev === d)
      const el = pulseEl[d]
      if (!p) {
        if (el.style.opacity !== '0') el.style.opacity = '0'
        cableEl[d].removeAttribute('data-live')
        continue
      }
      const t = ease(Math.min(1, (clock - p.t0) / p.dur))
      const [x, y] = along(d, p.dir === 'out' ? t : 1 - t)
      el.setAttribute('cx', x.toFixed(1))
      el.setAttribute('cy', y.toFixed(1))
      el.style.opacity = '1'
      cableEl[d].setAttribute('data-live', '')
    }
    // brilho da tela e leve afundar do aparelho ao agir
    let animating = false
    for (const d of DEVS) {
      const age = clock - flashes[d]
      const f = age < 0 ? 0 : age < 0.08 ? age / 0.08 : Math.exp(-(age - 0.08) / 0.18)
      flashEl[d].style.opacity = (0.32 * f).toFixed(3)
      const pa = clock - presses[d]
      const pr = pa < 0 ? 0 : pa < 0.07 ? pa / 0.07 : Math.max(0, 1 - (pa - 0.07) / 0.22)
      devEl[d].setAttribute('transform', pr > 0.001 ? `translate(${(data.press[0] * pr).toFixed(2)} ${(data.press[1] * pr).toFixed(2)})` : '')
      if (f > 0.004 || pr > 0.001) animating = true
    }
    const settled = !touring && !busy && !pulses.length && angle === target && !animating
    frame = visible && !settled ? requestAnimationFrame(tick) : 0
  }
  function run() {
    if (!frame && visible) {
      last = 0
      frame = requestAnimationFrame(tick)
    }
  }

  // estado inicial
  DEVS.forEach(paintScreen)
  paintMarks()
  paintPointer()
  cb.readout(readoutOf(state))

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting
      if (visible) run()
    },
    { rootMargin: '120px 0px' },
  )
  io.observe(svg)
  const onMotion = () => {
    if (still.matches) hold()
  }
  still.addEventListener('change', onMotion)

  return {
    act,
    /** pausa o tour enquanto o leitor está sobre a figura */
    hold,
    release: takeOver,
    turn: () => STEPS[nextStep(state)].by,
    dispose() {
      io.disconnect()
      still.removeEventListener('change', onMotion)
      cancelAnimationFrame(frame)
      clearTimeout(resumeTimer)
      clearTimeout(readoutTimer)
    },
  }
}
export type Live = ReturnType<typeof mountLive>
