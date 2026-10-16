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
  const farm = useRef<Farm | null>(null)
  const [mobile, setMobile] = useState(() => matchMedia(MOBILE).matches)
  const [art, setArt] = useState<Art | null>(null)
  const [zone, setZone] = useState<Zone | null>(null)
  const [readout, setReadout] = useState('')

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
    const f = mountFarm(svg, art.DATA, { readout: setReadout })
    farm.current = f
    return () => {
      f.dispose()
      farm.current = null
    }
  }, [art])

  // foco no setor: no celular a câmera voa até ele; no desktop os outros setores recuam
  useEffect(() => {
    farm.current?.focus(zone, mobile)
  }, [zone, mobile, art])

  const zoneAt = (t: EventTarget) => ((t as Element).closest?.('[data-hit]') as SVGElement | null)?.dataset.hit as Zone | undefined
  const pick = (z: Zone | null) => {
    farm.current?.hover(null)
    setZone((cur) => (cur === z ? null : z))
  }
  return (
    <figure ref={root} className="fz-figure iso fz-full" data-theme="light" data-open={zone ? 'true' : undefined} data-side={zone === 'confinamento' || zone === 'sede' ? 'left' : 'right'}>
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
        {art && !(mobile && zone) && (
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
        <p className="fz-hint" aria-live="polite">{readout || (mobile ? 'Toque num setor para ver o que o Cerne faz ali' : 'Clique num setor para ver o que o Cerne faz ali')}</p>
      </div>

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
