import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import '../iso/iso.css'
import './materials.css'
import './fazenda.css'
import './panel.css'
import { mountFarm, type Farm, type FarmData } from './live'
import { ZONES, ZONE_ORDER, type Zone } from './model'

const MOBILE = '(max-width: 719px)'
// proporção fixa da arte (igual ao build) para reservar o espaço antes de ela chegar
const RATIO = '760 / 430'
type Art = { SVG: string; DATA: FarmData }

export function FazendaCerne() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const farm = useRef<Farm | null>(null)
  const [mobile, setMobile] = useState(() => matchMedia(MOBILE).matches)
  // com movimento reduzido não há letreiro: a última operação continua no aviso abaixo da maquete
  const [still] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [art, setArt] = useState<Art | null>(null)
  const [zone, setZone] = useState<Zone | null>(null)
  const [readout, setReadout] = useState('')
  const feed = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    const mq = matchMedia(MOBILE)
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // a arte (~70 KB gzip) só é baixada quando a seção está a ~1 tela de distância
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        ;(import('./art') as unknown as Promise<Art>).then(setArt)
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useLayoutEffect(() => {
    const svg = stage.current?.querySelector('svg')
    if (!art || !svg) return
    const f = mountFarm(svg, art.DATA, { readout: (t) => { setReadout(t); feed.current?.(t) } })
    farm.current = f
    return () => {
      f.dispose()
      farm.current = null
    }
  }, [art])

  // foco no setor: no celular a câmera voa até ele; no desktop os outros setores recuam
  useEffect(() => {
    farm.current?.focus(zone, false)
  }, [zone, mobile, art])

  // celular: a maquete é mais larga que a tela e se arrasta como um mapa; começa no centro e, ao escolher um setor, centraliza nele
  useEffect(() => {
    const el = scroller.current
    if (!el || !mobile || !art) return
    const z = zone ? art.DATA.zones[zone] : null
    const frac = z ? (z[0] + z[2] / 2) / art.DATA.width : 0.5
    const left = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, frac * el.scrollWidth - el.clientWidth / 2))
    el.scrollTo({ left, behavior: zone ? 'smooth' : 'auto' })
  }, [zone, mobile, art])

  // clicar/tocar fora da maquete e do cartão volta ao estado inicial (nenhum setor)
  useEffect(() => {
    if (!zone) return
    const off = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (t?.closest('.fz-canvas, .fz-card, .fz-hint')) return
      setZone(null)
    }
    document.addEventListener('pointerdown', off)
    return () => document.removeEventListener('pointerdown', off)
  }, [zone])

  const zoneAt = (t: EventTarget) => ((t as Element).closest?.('[data-hit]') as SVGElement | null)?.dataset.hit as Zone | undefined
  const pick = (z: Zone | null) => {
    farm.current?.hover(null)
    setZone((cur) => (cur === z ? null : z))
  }
  return (
    <figure ref={root} className="fz-figure iso fz-full" data-theme="light" data-open={zone ? 'true' : undefined} data-side={zone === 'confinamento' || zone === 'sede' ? 'left' : 'right'}>
      <div ref={scroller} className="fz-scroll">
      <div className="fz-canvas">
        <div
          ref={stage}
          className="fz-stage"
          style={{ aspectRatio: RATIO }}
          onClick={(e) => {
            const z = zoneAt(e.target)
            if (z) pick(z)
          }}
          onPointerMove={(e) => farm.current?.hover(zoneAt(e.target) ?? null)}
          onPointerLeave={() => farm.current?.hover(null)}
          {...(art ? { dangerouslySetInnerHTML: { __html: art.SVG } } : {})}
        />
        {art && (
          <div className="fz-labels" style={{ aspectRatio: RATIO }}>
            {ZONE_ORDER.map((z) => (
              <button
                key={z}
                type="button"
                className="fz-label"
                data-on={zone === z || undefined}
                style={{ left: `${art.DATA.labels[z][0]}%`, top: `${art.DATA.labels[z][1]}%` }}
                onClick={() => pick(z)}
                onPointerEnter={() => farm.current?.hover(z)}
                onPointerLeave={() => farm.current?.hover(null)}
              >
                {ZONES[z].name}
              </button>
            ))}
          </div>
        )}
        {art && !still && <WallTicker feed={feed} />}
      </div>
      </div>
      <p className="fz-hint" aria-live="polite">{(still && readout) || (mobile ? 'Arraste para os lados e toque num setor' : 'Clique num setor para ver o que o Cerne faz ali')}</p>

      {zone && (
        <aside className="fz-card" aria-live="polite" role="region" aria-label={ZONES[zone].title}>
          <div className="fz-card-body" key={zone}>
            <div className="fz-card-top">
              <span className="fz-kicker">{ZONES[zone].name}</span>
              <button type="button" className="fz-close" onClick={() => setZone(null)} aria-label="Fechar">×</button>
            </div>
            <h3>{ZONES[zone].title}</h3>
            <p>{ZONES[zone].text}</p>
            <ul className="fz-chips">
              {ZONES[zone].chips.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="fz-where">{ZONES[zone].where}</p>
            <div className="fz-nav" role="group" aria-label="Outros setores">
              {ZONE_ORDER.filter((z) => z !== zone).map((z) => (
                <button key={z} type="button" onClick={() => pick(z)}>{ZONES[z].name}</button>
              ))}
            </div>
          </div>
        </aside>
      )}
    </figure>
  )
}

// setor de cada operação → cor do ponto no letreiro
const TILE: Record<string, string> = { 'Plantação': 'lavoura', Estoque: 'estoque', Confinamento: 'confinamento' }
const SPEED = 0.06 // fração da parede da esquerda percorrida por segundo
const GAP = 28 // px entre uma operação e a seguinte

/**
 * Letreiro "ao vivo" pintado nas duas paredes de terra da frente da maquete, como uma fita só: cada operação emitida
 * pela parte viva entra pelo canto do estoque, desce a parede da esquerda, dobra a quina da sede e sobe a da direita
 * até a ponta do confinamento. Cada operação existe nas duas paredes; a da direita é a mesma deslocada pela largura
 * da esquerda, e cada parede recorta a sua parte, então o texto dobra a quina sem emenda.
 * Fila curta: se chegar mais rápido do que passa, as mais antigas caem.
 */
function WallTicker({ feed }: { feed: React.MutableRefObject<((text: string) => void) | null> }) {
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const L = left.current
    const R = right.current
    if (!L || !R) return
    const fig = L.closest('figure')
    const queue: string[] = []
    const items: { a: HTMLElement; b: HTMLElement; x: number }[] = []
    feed.current = (text) => {
      if (!text.includes(' · ')) return
      queue.push(text)
      if (queue.length > 3) queue.shift()
    }
    const make = (zone: string, rest: string) => {
      const it = document.createElement('span')
      it.className = 'fz-tk-item'
      it.dataset.tile = TILE[zone] ?? 'sede'
      it.innerHTML = '<i></i><b></b><span></span>'
      it.children[1].textContent = zone
      it.children[2].textContent = rest
      return it
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!fig?.hasAttribute('data-paused')) {
        const WL = L.clientWidth
        const WR = R.clientWidth
        const tail = items[items.length - 1]
        if (queue.length && (!tail || tail.x >= GAP)) {
          const [zone, ...rest] = queue.shift()!.split(' · ')
          const a = make(zone, rest.join(' · '))
          const b = a.cloneNode(true) as HTMLElement
          L.appendChild(a)
          R.appendChild(b)
          items.push({ a, b, x: -a.offsetWidth })
        }
        for (const it of items) {
          it.x += WL * SPEED * dt
          it.a.style.transform = `translate3d(${it.x.toFixed(1)}px,0,0)`
          it.b.style.transform = `translate3d(${(it.x - WL).toFixed(1)}px,0,0)`
        }
        while (items.length && items[0].x > WL + WR) {
          const it = items.shift()!
          it.a.remove()
          it.b.remove()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      feed.current = null
      items.forEach((it) => { it.a.remove(); it.b.remove() })
    }
  }, [feed])
  return (
    <div className="fz-wall" style={{ aspectRatio: RATIO }} aria-hidden="true">
      <div className="fz-tk fz-tk-l">
        <div ref={left} className="fz-tk-track" />
        <span className="fz-tk-live">Ao vivo</span>
      </div>
      <div className="fz-tk fz-tk-r">
        <div ref={right} className="fz-tk-track" />
      </div>
    </div>
  )
}
