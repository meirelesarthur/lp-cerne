// Parte viva da maquete: um só laço de quadros que move o caminhão de trato e o trator,
// enche o cocho, planta as faixas do talhão e manda cada operação como um pulso até o painel da sede.
import type { Zone } from './model'

type Flat = [number, number]
type Tile = 'lavoura' | 'confinamento' | 'estoque' | 'financeiro'
export interface FarmData {
  width: number
  height: number
  P: { origin: readonly number[]; scale: number; azimuth: number; elevation: number }
  ux: readonly number[]
  uy: readonly number[]
  uz: readonly number[]
  t2: { x0: number; x1: number; y0: number; lane: number; lanes: number }
  truck: { y: number; load: number; start: number; pens: readonly number[]; home: number }
  cocho: { y0: number; y1: number; z: number }
  tiles: Record<Tile, readonly number[]>
  zones: Record<Zone, readonly number[]>
  labels: Record<Zone, readonly number[]>
}
export interface FarmCallbacks {
  readout: (text: string) => void
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function mountFarm(svg: SVGSVGElement, data: FarmData, cb: FarmCallbacks) {
  const still = matchMedia('(prefers-reduced-motion: reduce)')
  const { P } = data
  const a = (P.azimuth * Math.PI) / 180
  const e = (P.elevation * Math.PI) / 180
  const kk = P.scale * Math.sqrt(1.6) // mesma projeção do kit (UNIT = √1.6)
  const iso = (x: number, y: number, z = 0): Flat => [
    P.origin[0] + (x * Math.sin(a) - y * Math.cos(a)) * kk,
    P.origin[1] + ((x * Math.cos(a) + y * Math.sin(a)) * Math.sin(e) - z * Math.cos(e)) * kk,
  ]
  const quad = (x0: number, x1: number, y0: number, y1: number, z: number) =>
    [iso(x0, y0, z), iso(x1, y0, z), iso(x1, y1, z), iso(x0, y1, z)].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')
  const move = (x: number, y: number) => `translate(${(data.ux[0] * x + data.uy[0] * y).toFixed(2)} ${(data.ux[1] * x + data.uy[1] * y).toFixed(2)})`

  const q = <T extends Element>(sel: string) => svg.querySelector<T>(sel)!
  const truckEl = q<SVGGElement>('[data-veh="truck"]')
  const tractorEl = q<SVGGElement>('[data-veh="tractor"]')
  const dirs = (el: SVGGElement) => Object.fromEntries([...el.querySelectorAll<SVGGElement>(':scope > [data-dir]')].map((g) => [g.dataset.dir!, g]))
  const truckDir = dirs(truckEl)
  const tractorDir = dirs(tractorEl)
  const strips = [...svg.querySelectorAll<SVGPathElement>('.fz-strip')]
  const stripsG = q<SVGGElement>('.fz-strips')
  const feeds = [...svg.querySelectorAll<SVGPathElement>('.fz-feed')]
  const pulseEls = [...svg.querySelectorAll<SVGGElement>('.fz-pulse')]
  const counts = Object.fromEntries([...svg.querySelectorAll<SVGTextElement>('[data-count]')].map((t) => [t.dataset.count!, t])) as Record<Tile, SVGTextElement>
  const flashes = Object.fromEntries([...svg.querySelectorAll<SVGPathElement>('[data-flash]')].map((t) => [t.dataset.flash!, t])) as Record<Tile, SVGPathElement>
  const figure = svg.closest('.fz-figure') as HTMLElement | null

  // ───── estado ─────
  const { t2, truck, cocho } = data
  const pens = truck.pens
  const tally: Record<Tile, number> = { lavoura: 0, confinamento: 0, estoque: 0, financeiro: 0 }
  const flashAt: Record<Tile, number> = { lavoura: -9, confinamento: -9, estoque: -9, financeiro: -9 }
  const feed = [0, 0, 0]
  let clock = 0
  let visible = false
  let frame = 0
  let last = 0

  // caminhão: carrega na moega, vai até os currais, trata curral a curral e volta
  type TruckPhase = 'load' | 'go' | 'feed' | 'back'
  let tPhase: TruckPhase = 'load'
  let tAt = 0
  let tx = truck.load
  let penDone = -1

  // trator: faixa a faixa, indo e voltando; ao fim do talhão, recomeça
  let lane = 0
  let lx = t2.x0 + 8
  let tractorTurn = 0 // 0 = na faixa, >0 = virando para a próxima
  let reset = 0 // fade de fim de safra
  const planted: [number, number][] = Array.from({ length: t2.lanes }, () => [0, 0])
  const laneY = (i: number) => t2.y0 + (i + 0.5) * t2.lane
  const goingRight = (i: number) => i % 2 === 0
  const X0 = t2.x0 + 8
  const X1 = t2.x1 - 8

  // pulsos: do ponto da operação até o bloco do painel
  interface Pulse { el: SVGGElement; from: Flat; to: Flat; t0: number; dur: number; tile: Tile; done: boolean }
  const pulses: Pulse[] = []
  function emit(x: number, y: number, z: number, tile: Tile, text: string) {
    cb.readout(text)
    if (still.matches) {
      bump(tile)
      return
    }
    const el = pulseEls.find((p) => !pulses.some((q) => q.el === p))
    if (!el) return bump(tile)
    pulses.push({ el, from: iso(x, y, z), to: data.tiles[tile] as Flat, t0: clock, dur: 1.25, tile, done: false })
  }
  function bump(tile: Tile) {
    tally[tile]++
    counts[tile].textContent = String(tally[tile])
    flashAt[tile] = clock
    // cada operação também vira um lançamento de custo
    tally.financeiro++
    counts.financeiro.textContent = String(tally.financeiro)
    flashAt.financeiro = clock + 0.18
  }

  function drawTruck() {
    const facing = tPhase === 'back' ? '-x' : '+x'
    for (const [d, g] of Object.entries(truckDir)) g.style.display = d === facing ? '' : 'none'
    truckEl.setAttribute('transform', move(tx, truck.y))
  }
  function drawTractor() {
    const y = laneY(lane) + (tractorTurn > 0 ? ease(tractorTurn) * t2.lane : 0)
    const facing = tractorTurn > 0 ? '+y' : goingRight(lane) ? '+x' : '-x'
    for (const [d, g] of Object.entries(tractorDir)) g.style.display = d === facing ? '' : 'none'
    tractorEl.setAttribute('transform', move(lx, y))
  }
  function drawStrip(i: number) {
    const [s0, s1] = planted[i]
    strips[i].setAttribute('d', s1 > s0 + 0.5 ? `M${quad(s0, s1, t2.y0 + i * t2.lane + 0.6, t2.y0 + (i + 1) * t2.lane - 0.6, 0.2)}Z` : '')
  }
  function drawFeed(i: number) {
    const x0 = pens[i] + 1.6
    const w = pens[i + 1] - pens[i] - 3.2
    const lv = clamp(feed[i], 0, 1)
    feeds[i].setAttribute('d', lv > 0.01 ? `M${quad(x0, x0 + w * lv, cocho.y0, cocho.y1, cocho.z)}Z` : '')
  }

  function stepTruck(dt: number) {
    tAt += dt
    if (tPhase === 'load') {
      if (tAt > 2.2) {
        emit(truck.load, truck.y, 14, 'estoque', 'Estoque · saída de ração para o trato')
        tPhase = 'go'
        tAt = 0
      }
    } else if (tPhase === 'go') {
      tx = Math.min(truck.start, tx + 48 * dt)
      if (tx >= truck.start) {
        tPhase = 'feed'
        penDone = -1
      }
    } else if (tPhase === 'feed') {
      tx = Math.min(pens[3] - 4, tx + 19 * dt)
      const chute = tx - 2
      for (let i = 0; i < 3; i++) {
        if (chute > pens[i] && i > penDone) feed[i] = Math.max(feed[i], (chute - pens[i]) / (pens[i + 1] - pens[i]))
        if (chute >= pens[i + 1] - 4 && i > penDone) {
          penDone = i
          feed[i] = 1
          emit((pens[i] + pens[i + 1]) / 2, cocho.y0, 6, 'confinamento', `Confinamento · trato registrado no curral ${i + 1}`)
        }
      }
      if (tx >= pens[3] - 4) {
        tPhase = 'back'
        tAt = 0
      }
    } else {
      tx = Math.max(truck.load, tx - 62 * dt)
      if (tx <= truck.load) {
        tPhase = 'load'
        tAt = 0
      }
    }
    // o gado come: o cocho esvazia devagar depois do trato
    for (let i = 0; i < 3; i++) if (i <= penDone || tPhase !== 'feed') feed[i] = Math.max(0, feed[i] - dt / 22)
  }

  function stepTractor(dt: number) {
    if (reset > 0) {
      reset += dt
      const f = clamp(1 - (reset - 0.2) / 1.2, 0, 1)
      stripsG.style.opacity = String(f)
      tractorEl.style.opacity = String(f)
      if (reset > 1.6) {
        reset = 0
        lane = 0
        lx = X0
        planted.forEach((p, i) => {
          p[0] = p[1] = 0
          drawStrip(i)
        })
        stripsG.style.opacity = ''
        tractorEl.style.opacity = ''
        cb.readout('Lavoura · nova safra: o talhão volta para o preparo')
      }
      return
    }
    if (tractorTurn > 0) {
      tractorTurn += dt / 0.9
      if (tractorTurn >= 1) {
        tractorTurn = 0
        lane++
      }
      return
    }
    const right = goingRight(lane)
    lx = clamp(lx + (right ? 1 : -1) * 26 * dt, X0, X1)
    // a plantadeira fica ~13 unidades atrás do trator
    const seed = right ? lx - 13 : lx + 13
    planted[lane] = right ? [t2.x0 + 1, clamp(seed, t2.x0, t2.x1)] : [clamp(seed, t2.x0, t2.x1), t2.x1 - 1]
    drawStrip(lane)
    if ((right && lx >= X1) || (!right && lx <= X0)) {
      planted[lane] = [t2.x0 + 1, t2.x1 - 1]
      drawStrip(lane)
      emit(lx, laneY(lane), 10, 'lavoura', `Lavoura · plantio apontado na faixa ${lane + 1} do talhão 2`)
      if (lane >= t2.lanes - 1) reset = 0.0001
      else tractorTurn = 0.0001
    }
  }

  function stepPulses() {
    for (const p of pulses) {
      const t = (clock - p.t0) / p.dur
      if (t >= 1) {
        p.done = true
        p.el.style.opacity = '0'
        bump(p.tile)
        continue
      }
      const k = ease(t)
      const mid: Flat = [(p.from[0] + p.to[0]) / 2, Math.min(p.from[1], p.to[1]) - 70]
      const x = (1 - k) ** 2 * p.from[0] + 2 * (1 - k) * k * mid[0] + k * k * p.to[0]
      const y = (1 - k) ** 2 * p.from[1] + 2 * (1 - k) * k * mid[1] + k * k * p.to[1]
      p.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
      p.el.style.opacity = String(Math.min(1, t * 6, (1 - t) * 8))
    }
    for (let i = pulses.length - 1; i >= 0; i--) if (pulses[i].done) pulses.splice(i, 1)
    for (const t of Object.keys(flashAt) as Tile[]) {
      const age = clock - flashAt[t]
      const f = age < 0 ? 0 : age < 0.1 ? age / 0.1 : Math.exp(-(age - 0.1) / 0.35)
      flashes[t].style.opacity = (0.28 * f).toFixed(3)
    }
  }

  function tick(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60
    last = now
    clock += dt
    stepTruck(dt)
    stepTractor(dt)
    stepPulses()
    drawTruck()
    drawTractor()
    for (let i = 0; i < 3; i++) drawFeed(i)
    frame = visible && !still.matches ? requestAnimationFrame(tick) : 0
  }
  function run() {
    if (!frame && visible && !still.matches) {
      last = 0
      frame = requestAnimationFrame(tick)
    }
  }

  // Sem movimento: uma cena parada e coerente (meio talhão plantado, cocho tratado, painel com números)
  function stillScene() {
    lane = 8
    lx = X1
    for (let i = 0; i < 8; i++) {
      planted[i] = [t2.x0 + 1, t2.x1 - 1]
      drawStrip(i)
    }
    feed.fill(0.7)
    tPhase = 'load'
    tx = truck.load
    Object.assign(tally, { lavoura: 8, confinamento: 3, estoque: 1, financeiro: 12 })
    for (const t of Object.keys(tally) as Tile[]) counts[t].textContent = String(tally[t])
    drawTruck()
    drawTractor()
    for (let i = 0; i < 3; i++) drawFeed(i)
  }

  if (still.matches) stillScene()
  else {
    drawTruck()
    drawTractor()
  }
  cb.readout('Cada operação no campo chega ao painel da sede')

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting
      figure?.toggleAttribute('data-paused', !visible)
      if (visible) run()
    },
    { rootMargin: '120px 0px' },
  )
  io.observe(svg)
  const onMotion = () => (still.matches ? stillScene() : run())
  still.addEventListener('change', onMotion)

  // ───── câmera (mobile): o viewBox voa até o setor escolhido ─────
  const full = [0, 0, data.width, data.height]
  let view = [...full]
  let viewAnim = 0
  function viewOf(zone: Zone | null) {
    if (!zone) return full
    const [x, y, w, h] = data.zones[zone]
    const pad = 14
    const ratio = data.width / data.height
    let vw = w + pad * 2
    let vh = h + pad * 2
    if (vw / vh > ratio) vh = vw / ratio
    else vw = vh * ratio
    return [x + w / 2 - vw / 2, y + h / 2 - vh / 2, vw, vh]
  }
  function fly(zone: Zone | null) {
    const from = [...view]
    const to = viewOf(zone)
    cancelAnimationFrame(viewAnim)
    if (still.matches) {
      view = to
      svg.setAttribute('viewBox', view.map((n) => n.toFixed(1)).join(' '))
      return
    }
    const t0 = performance.now()
    const stepView = (now: number) => {
      const t = Math.min(1, (now - t0) / 750)
      const k = ease(t)
      view = from.map((v, i) => v + (to[i] - v) * k)
      svg.setAttribute('viewBox', view.map((n) => n.toFixed(1)).join(' '))
      if (t < 1) viewAnim = requestAnimationFrame(stepView)
    }
    viewAnim = requestAnimationFrame(stepView)
  }

  return {
    focus(zone: Zone | null, zoom: boolean) {
      if (zone) svg.dataset.focus = zone
      else delete svg.dataset.focus
      fly(zoom ? zone : null)
    },
    hover(zone: Zone | null) {
      if (zone) svg.dataset.hover = zone
      else delete svg.dataset.hover
    },
    dispose() {
      io.disconnect()
      still.removeEventListener('change', onMotion)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(viewAnim)
    },
  }
}
export type Farm = ReturnType<typeof mountFarm>
