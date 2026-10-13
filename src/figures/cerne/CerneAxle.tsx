import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import '../iso/iso.css'
import './cerne.css'
import { mountLive, type ArtData, type Live } from './live'
import { DEVICES, STEPS, nextStep, readoutOf, type Device, type OsState } from './model'

// Proporções fixas de cada composição (iguais às do build) para reservar o espaço antes da arte chegar
const SIZE = { desktop: [640, 430], mobile: [360, 470] } as const
const MOBILE = '(max-width: 719px)'
type Layout = keyof typeof SIZE
type Art = { SVG: string; DATA: ArtData }

const load = (layout: Layout): Promise<Art> =>
  (layout === 'mobile' ? import('./art.mobile') : import('./art.desktop')) as unknown as Promise<Art>

export function CerneAxle() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const live = useRef<Live | null>(null)
  const [layout, setLayout] = useState<Layout>(() => (matchMedia(MOBILE).matches ? 'mobile' : 'desktop'))
  const [art, setArt] = useState<Art | null>(null)
  const [near, setNear] = useState(false)
  const [os, setOs] = useState<OsState>({ os: 0, step: -1 })
  const [readout, setReadout] = useState(readoutOf({ os: 0, step: -1 }))
  const [announce, setAnnounce] = useState('')

  // troca de composição ao cruzar o breakpoint
  useEffect(() => {
    const mq = matchMedia(MOBILE)
    const on = () => setLayout(mq.matches ? 'mobile' : 'desktop')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // a arte (~30 KB gzip) só é baixada quando a seção está a uma tela de distância
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '900px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!near) return
    let alive = true
    load(layout).then((a) => alive && setArt(a))
    return () => {
      alive = false
    }
  }, [near, layout])

  useLayoutEffect(() => {
    const svg = stage.current?.querySelector('svg')
    if (!art || !svg || art.DATA.layout !== layout) return
    const l = mountLive(svg, art.DATA, {
      readout: setReadout,
      state: (s) => {
        setOs(s)
        setAnnounce(`${STEPS[s.step].status}. Agora é a vez do ${DEVICES[STEPS[nextStep(s)].by].who}.`)
      },
    })
    live.current = l
    setOs({ os: 0, step: -1 })
    return () => {
      l.dispose()
      live.current = null
    }
  }, [art, layout])

  const onClick = (ev: React.MouseEvent) => {
    const dev = (ev.target as Element).closest<SVGGElement>('[data-dev]')?.dataset.dev as Device | undefined
    if (dev) live.current?.act(dev)
  }
  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return
    ev.preventDefault()
    const l = live.current
    if (l) l.act(l.turn())
  }

  const next = nextStep(os)
  const [w, h] = SIZE[layout]
  const ready = art && art.DATA.layout === layout

  return (
    <figure ref={root} className="cn-figure iso" data-theme="light" data-layout={layout}>
      <div className="iso-plate cn-plate">
        <div className="iso-plate-corners" aria-hidden="true">
          <span className="iso-plate-corner" data-corner="fig">Fig. 06</span>
          <span className="iso-plate-corner" data-corner="title">Eixo do Cerne</span>
          <span className="iso-plate-corner" data-corner="hint">{layout === 'mobile' ? 'Toque no passo da vez' : 'Clique no aparelho da vez'}</span>
          <span className="iso-plate-corner" data-corner="readout">{readout}</span>
        </div>
        <div
          ref={stage}
          className="cn-stage"
          style={{ aspectRatio: `${w} / ${h}` }}
          tabIndex={0}
          role="group"
          aria-label="Eixo do Cerne: as três edições ligadas a um só cadastro. Enter avança a ordem de serviço com o aparelho da vez."
          onClick={onClick}
          onKeyDown={onKey}
          onPointerEnter={() => live.current?.hold()}
          onPointerLeave={() => live.current?.release()}
          {...(ready ? { dangerouslySetInnerHTML: { __html: art.SVG } } : {})}
        />
        <span className="cn-sr" role="status" aria-live="polite">{announce}</span>
      </div>

      <ol className="cn-steps" aria-label="Ciclo da ordem de serviço">
        {STEPS.map((s, i) => {
          const done = os.step >= 0 && i <= os.step
          return (
            <li key={s.action}>
              <button
                type="button"
                className="cn-step"
                data-next={i === next || undefined}
                data-done={done || undefined}
                aria-current={i === next ? 'step' : undefined}
                onClick={() => live.current?.act(s.by)}
              >
                <b>{i + 1}</b>
                <span>
                  <strong>{s.action}</strong>
                  <small>{DEVICES[s.by].name}{DEVICES[s.by].tag !== 'Disponível' ? ' · em construção' : ''}</small>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <figcaption className="cn-caption">
        Um eixo, três telas: o escritório cria a ordem de serviço no Cerne Web, o campo recebe e aponta no app de Operação e o gestor avalia no app de
        Administração. Cada passo grava no mesmo cadastro, e as três telas leem dele.
      </figcaption>
    </figure>
  )
}
