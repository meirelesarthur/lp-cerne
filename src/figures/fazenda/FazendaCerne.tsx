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
      if (t?.closest('.fz-canvas, .fz-card, .fz-hint, .fz-pick')) return
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
    <figure ref={root} className="fz-figure iso fz-full" data-theme="light" data-open={zone ? 'true' : undefined} data-zone={zone ?? undefined} data-side={zone === 'confinamento' || zone === 'sede' || zone === 'estoque' ? 'left' : 'right'}>
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
      {/* sem a pill de instrução; só com movimento reduzido (sem letreiro) a última operação continua como aviso */}
      {still && readout && <p className="fz-hint" aria-live="polite">{readout}</p>}

      <div className="fz-slot">
      {!zone && (
        <div className="fz-pick">
          <p>Escolha um setor</p>
          <div>
            {ZONE_ORDER.map((z) => (
              <button key={z} type="button" onClick={() => pick(z)}>{ZONES[z].name}</button>
            ))}
          </div>
        </div>
      )}
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
      </div>
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
// A quina da frente da maquete tem duas faces de canto (chanfro), então a fita corre por 4 faces: parede esquerda,
// duas faces curtas de canto e parede direita. Cada face é uma faixa inclinada na própria direção; o texto percorre as
// quatro como uma linha só (o eixo x é contínuo: a inclinação não muda a largura do texto) e o conjunto acompanha a curva.
// x, w, y no viewBox 760×430 (y = topo da faixa no início da face), k = inclinação (dy/dx)
const SEGS = [
  { x: 15, w: 402, y: 186, k: 0.5 }, // parede esquerda, descendo 2:1
  { x: 417, w: 28, y: 387, k: 0.2 }, // chanfro esquerdo
  { x: 445, w: 28, y: 392.6, k: -0.2 }, // chanfro direito
  { x: 473, w: 272, y: 387, k: -0.5 }, // parede direita, subindo 2:1
]
const X0 = SEGS[0].x
const XN = SEGS[SEGS.length - 1].x + SEGS[SEGS.length - 1].w

function WallTicker({ feed }: { feed: React.MutableRefObject<((text: string) => void) | null> }) {
  const wall = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const W = wall.current
    if (!W) return
    const tracks = Array.from(W.querySelectorAll<HTMLElement>('.fz-tk-track'))
    const fig = W.closest('figure')
    const queue: string[] = []
    const items: { els: HTMLElement[]; x: number }[] = []
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
        const unit = W.clientWidth / 760 // px por unidade do viewBox
        const total = (XN - X0) * unit
        const tail = items[items.length - 1]
        if (queue.length && (!tail || tail.x >= GAP)) {
          const [zone, ...rest] = queue.shift()!.split(' · ')
          const first = make(zone, rest.join(' · '))
          const els = tracks.map((t, i) => { const e = i === 0 ? first : (first.cloneNode(true) as HTMLElement); t.appendChild(e); return e })
          items.push({ els, x: -first.offsetWidth })
        }
        for (const it of items) {
          it.x += (430 / 730) * total * SPEED * dt // mesma velocidade de antes (fração da parede esquerda por segundo)
          it.els.forEach((e, i) => { e.style.transform = `translate3d(${(it.x - (SEGS[i].x - X0) * unit).toFixed(1)}px,0,0)` })
        }
        while (items.length && items[0].x > total) {
          items.shift()!.els.forEach((e) => e.remove())
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      feed.current = null
      items.forEach((it) => it.els.forEach((e) => e.remove()))
    }
  }, [feed])
  return (
    <div ref={wall} className="fz-wall" style={{ aspectRatio: RATIO }} aria-hidden="true">
      {SEGS.map((g, i) => (
        <div
          key={i}
          className={`fz-tk${i === 0 ? ' fz-tk-first' : ''}${i === SEGS.length - 1 ? ' fz-tk-last' : ''}`}
          style={{ left: `${(g.x / 760) * 100}%`, width: `${(g.w / 760) * 100}%`, top: `${(g.y / 430) * 100}%`, transform: `skewY(${(Math.atan(g.k) * 180 / Math.PI).toFixed(3)}deg)` }}
        >
          <div className="fz-tk-track" />
          {i === 0 && <span className="fz-tk-live">Ao vivo</span>}
        </div>
      ))}
    </div>
  )
}
