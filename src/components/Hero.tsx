import { asset } from '../lib/assets'
import { onFirstInteraction } from '../lib/defer'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, scrollToY, shouldSkipScrub, startSmoothScroll } from '../lib/scroll'
import { coverBox, finalZoom, prefersHd, supportsAvif, type Box, type Manifest, type Zoom } from '../lib/stage'
import { ArrowDown01Icon, Icon, Mouse01Icon } from '../lib/icons'
import { HERO } from '../content/heroCopy'
import { LeadForm } from './LeadForm'
import { ScrubCanvas, type ScrubHandle } from './ScrubCanvas'

const FIRST_FIELD_ID = 'hero-name'
/** Quadros verticais só em tela retrato estreita; janelas deitadas usam o plano 16:9. */
/** Altura do header fixo (logo + CTA). */
const HEADER_H = 84
const MOBILE_MQ = '(max-width: 820px) and (orientation: portrait)'

/** Fases do scroll (fração do pin). */
const P = {
  seqEnd: 0.66, // fim da sequência de quadros (tablet gigante já no lugar)
  zoomEnd: 0.8, // enquadramento final (título à esquerda, form à direita) e vídeo do sistema em loop
} as const

const FALLBACK: Manifest = { count: 120, width: 1280, height: 720 }

/** Geometria do estado final, compartilhada com a 2ª seção (emenda da plantação). */
/** Os caminhos do manifesto são absolutos no site (/frames/...): aponta-os para a base dos arquivos pesados. */
function absolutize(m: Manifest): Manifest {
  // as imagens do estágio final têm versão AVIF (~metade do peso); quem não suporta fica no WebP
  const fmt = (p: string) => asset(supportsAvif() ? p.replace(/\.webp$/, '.avif') : p)
  return {
    ...m,
    poster: m.poster && asset(m.poster),
    final: m.final && { ...m.final, src: fmt(m.final.src), fg: fmt(m.final.fg) },
    ground: m.ground && { ...m.ground, src: fmt(m.ground.src) },
  }
}

export interface HeroGeometry { box: Box; zoom: Zoom; vw: number; vh: number; manifest: Manifest; ready: boolean }

/** Zoom para rolar a aplicação (perto) e zoom do estado final (título à esquerda, form à direita). */
const ZOOMS = {
  desktop: { app: { fill: 0.6, cy: 0.45 }, end: { fill: 0.42, cy: 0.45 } },
  mobile: { app: { fill: 0.96, cy: 0.47 }, end: { fill: 0.9, cy: 0.49 } },
} as const

let heroTrigger: ScrollTrigger | null = null

/** CTA do header: leva ao estado final do Hero e foca o e-mail. */
export function focusHeroForm() {
  const focus = () => document.getElementById(FIRST_FIELD_ID)?.focus({ preventScroll: true })
  if (heroTrigger) {
    scrollToY(heroTrigger.end)
    window.setTimeout(focus, 1500)
  } else {
    document.getElementById(FIRST_FIELD_ID)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(focus, 400)
  }
}

export function Hero({ onGeometry }: { onGeometry?: (g: HeroGeometry) => void }) {
  const root = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const frameBox = useRef<HTMLDivElement>(null)
  const appImg = useRef<HTMLImageElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const scrub = useRef<ScrubHandle>(null)
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_MQ).matches)
  const [isStatic] = useState(shouldSkipScrub)
  const [manifest, setManifest] = useState<{ variant: string; data: Manifest } | null>(null)
  // assets da cena final só depois do primeiro scroll (ou ociosidade): não disputam banda com o 1º quadro
  const [stageReady, setStageReady] = useState(false)
  const [geo, setGeo] = useState<{ box: Box; zoom: Zoom; zoomApp: Zoom; vw: number; vh: number } | null>(null)

  const [hd] = useState(() => prefersHd())
  // celular: quadros HD (AVIF 1080 px) quando a tela tem pixels de sobra (≥ 700 px reais) e a rede aguenta
  const [hdMobile] = useState(() => prefersHd(700))
  const variant = mobile ? (hdMobile ? 'mobile-hd' : 'mobile') : hd ? 'desktop-hd' : 'desktop'
  const dir = asset(`/frames/hero/${variant}`)
  const m = manifest?.variant === variant ? manifest.data : null

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // modo estático (movimento reduzido, economia de dados): não há timeline que marque o fim do Hero, então o atributo que
  // liga o vidro do cabeçalho e o CTA fixo é ligado aqui, quando o Hero já saiu da tela
  useEffect(() => {
    if (!isStatic) return
    const html = document.documentElement
    const sync = () => {
      const r = root.current?.getBoundingClientRect()
      html.toggleAttribute('data-hero-done', Boolean(r && r.bottom < HEADER_H))
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => { window.removeEventListener('scroll', sync); window.removeEventListener('resize', sync); html.removeAttribute('data-hero-done') }
  }, [isStatic])

  useEffect(() => {
    if (stageReady) return
    return onFirstInteraction(() => setStageReady(true), 9000)
  }, [stageReady])

  useEffect(() => {
    let alive = true
    fetch(`${dir}/manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : FALLBACK))
      .catch(() => FALLBACK)
      .then((data) => alive && setManifest({ variant, data: absolutize(data) }))
    return () => { alive = false }
  }, [dir, variant])

  // a foto do chão (continuação do Hero) começa a baixar em baixa prioridade logo depois da carga, para já estar no cache quando
  // a rolagem chegar ao fim do Hero; sem isso, em rede lenta o fim do Hero mostrava um vão em branco até a imagem chegar
  useEffect(() => {
    const src = m?.ground?.src
    if (!src || isStatic) return
    const t = window.setTimeout(() => {
      const img = new Image()
      img.fetchPriority = 'low'
      img.decoding = 'async'
      img.src = src
    }, 2500)
    return () => window.clearTimeout(t)
  }, [m, isStatic])

  // geometria do quadro (cover) e do zoom final, refeita a cada resize
  useLayoutEffect(() => {
    if (!m?.final || !pin.current) return
    const el = pin.current
    const calc = () => {
      const vw = el.clientWidth, vh = el.clientHeight
      const box = coverBox(vw, vh, m.width, m.height)
      const z = ZOOMS[mobile ? 'mobile' : 'desktop']
      // o tablet nunca fica sob o header: limita o zoom pela altura útil e centraliza abaixo dele
      const t = m.final!.tablet
      const aspect = (t.w * box.width) / (t.h * box.height)
      const avail = vh - HEADER_H - 28
      const appFill = Math.min(z.app.fill, (avail * aspect) / vw)
      const appCy = mobile ? z.app.cy : (HEADER_H + avail / 2 + 4) / vh
      const zoomApp = finalZoom(vw, vh, box, t, appFill, appCy)
      const zoom = finalZoom(vw, vh, box, m.final!.tablet, z.end.fill, z.end.cy)
      setGeo({ box, zoom, zoomApp, vw, vh })
      onGeometry?.({ box, zoom, vw, vh, manifest: m, ready: stageReady || isStatic })
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [m, mobile, onGeometry, stageReady, isStatic])

  useLayoutEffect(() => {
    if (isStatic || !m) return
    document.documentElement.toggleAttribute('data-scene-dark', (window.scrollY || 0) < 40)
    const stopScroll = startSmoothScroll()
    const ctx = gsap.context(() => {
      const state = { frame: 0 }
      gsap.set('.frame-box', { transformOrigin: '0 0' })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: '+=320%', pin: pin.current, scrub: 0.5, anticipatePin: 1, refreshPriority: 10,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // header: compõe com a cena durante toda a animação; vidro só ao sair do Hero.
            // logo branco só no close inicial (ombro, fundo escuro); no céu claro, logo colorido
            const html = document.documentElement
            html.toggleAttribute('data-hero-done', self.progress >= 0.999)
            html.toggleAttribute('data-scene-dark', self.progress < 0.035)
            const v = video.current
            if (!v) return
            if (self.progress >= P.seqEnd + 0.06) { if (v.paused) void v.play().catch(() => {}) } else if (!v.paused) v.pause()
          },
        },
      })
      tl.to(state, { frame: m.count - 1, duration: P.seqEnd, onUpdate: () => scrub.current?.setFrame(state.frame) }, 0)
        .to('.hero-hint, .hero-mouse', { opacity: 0, duration: 0.04 }, 0)
        .to('.hero-intro', { autoAlpha: 0, y: -28, ease: 'power2.in', duration: 0.06 }, 0)
        .to('.hero-progress i', { scaleX: 1, duration: P.zoomEnd }, 0)
        .to('.hero-progress', { autoAlpha: 0, duration: 0.03 }, P.zoomEnd)
      if (m.final && geo) {
        const { zoom } = geo
        // o still em alta assume no último quadro e já faz o zoom direto para o enquadramento final (sem rolar a aplicação
        // dentro do tablet); o vídeo do sistema entra em loop atrás do título e do form
        tl.fromTo('.final-layer', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.012 }, P.seqEnd - 0.012)
          .fromTo('.frame-box', { x: 0, y: 0, scale: 1 }, { x: zoom.tx, y: zoom.ty, scale: zoom.s, duration: P.zoomEnd - P.seqEnd, ease: 'power2.inOut' }, P.seqEnd)
          .to('.tablet-screen', { autoAlpha: 1, duration: 0.03 }, P.seqEnd)
          .to('.tablet-video', { autoAlpha: 1, duration: 0.05 }, P.seqEnd + 0.06)
          .to('.hero-shade', { opacity: 1, duration: 0.08 }, P.zoomEnd - 0.06)
          // autoAlpha: fora da fase o bloco fica com visibility:hidden (não recebe foco nem é lido)
          .fromTo('.hero-copy', { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.09, ease: 'power2.out' }, P.zoomEnd - 0.04)
          .fromTo('.hero-form-wrap', { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.09, ease: 'power2.out' }, P.zoomEnd - 0.01)
          // segura o enquadramento final no resto do scroll
          .set({}, {}, 1)
      }
      heroTrigger = tl.scrollTrigger ?? null
    }, root)
    // o pin entra depois do manifesto: reordena (Hero primeiro) e as seções abaixo recalculam suas posições
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
    return () => { heroTrigger = null; ctx.revert(); stopScroll() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic, m, geo?.vw, geo?.vh, stageReady])

  const t = m?.final?.tablet
  const staticZoom = isStatic && geo ? `translate(${geo.zoom.tx}px, ${geo.zoom.ty}px) scale(${geo.zoom.s})` : undefined

  return (
    <section ref={root} className={`hero${isStatic ? ' static' : ''}`} aria-label="Cerne: ERP para o agro">
      <div ref={pin} className="hero-pin">
        {/* o poster está no HTML desde o início (descoberto pelo preload, prioridade alta): é ele o LCP, sem esperar manifesto nem JS */}
        {!isStatic && <img className="poster" src={asset(`/frames/hero/${mobile ? 'mobile' : 'desktop'}/poster-first.webp`)} alt="" fetchPriority="high" decoding="async" />}
        {!isStatic && m && <ScrubCanvas key={variant} ref={scrub} dir={dir} count={m.count} ext={m.ext ?? 'webp'} poster={m.poster} />}

        {m?.final && geo && t && (stageReady || isStatic) && (
          <div className="final-layer" style={isStatic ? { visibility: 'visible', opacity: 1 } : undefined}>
            <div
              ref={frameBox}
              className="frame-box"
              style={{ left: geo.box.left, top: geo.box.top, width: geo.box.width, height: geo.box.height, transform: staticZoom }}
            >
              <img className="final-still" src={m.final.src} alt="" decoding="async" />
              <div className="tablet-screen" style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, width: `${t.w * 100}%`, height: `${t.h * 100}%` }}>
                <img ref={appImg} className="tablet-app" src={asset('/app/visao-geral-full.webp')} alt="" decoding="async" />
                <video ref={video} className="tablet-video" muted loop playsInline preload="none" poster={asset('/video/system-loop-poster.webp')} aria-hidden="true">
                  <source src={asset('/video/system-loop.webm')} type="video/webm" />
                  <source src={asset('/video/system-loop.mp4')} type="video/mp4" />
                </video>
              </div>
              <img className="final-fg" src={m.final.fg} alt="" decoding="async" />
            </div>
          </div>
        )}
        <div className="hero-shade" />

        {/* primeira tela: proposta de valor e CTA já no quadro 0; some nos primeiros pixels de rolagem, e o título final assume */}
        {!isStatic && (
          <div className="hero-intro">
            <div className="hero-intro-copy">
              <span className="hero-eyebrow">{HERO.eyebrow}</span>
              <h1>{HERO.h1Pre} <em>{HERO.h1Em}</em></h1>
              <p className="lead">{HERO.lead}</p>
              <button type="button" className="btn btn-primary" onClick={focusHeroForm}>{HERO.cta}</button>
              <p className="hero-intro-proof">{HERO.proof}</p>
            </div>
          </div>
        )}

        <div className="hero-content">
          <div className="hero-copy">
            {isStatic ? <h1>Sua fazenda, do campo ao financeiro, <em>num só sistema.</em></h1> : <p className="h1" aria-hidden="true">Sua fazenda, do campo ao financeiro, <em>num só sistema.</em></p>}
            <p className="lead">Rebanho, lavoura, estoque, fiscal e financeiro no mesmo lugar. Veja o custo e a margem de cada lote sem esperar o fechamento do mês.</p>
            <p className="hero-proof">115 relatórios · 10 painéis · NF-e, MDF-e e LCDPR</p>
          </div>
          <div className="hero-form-wrap">
            <LeadForm variant="hero" focusId={FIRST_FIELD_ID} />
          </div>
        </div>

        <div className="hero-mouse" aria-hidden="true">
          <Icon icon={Mouse01Icon} size={32} strokeWidth={1.5} />
          <span className="hero-chevs"><Icon icon={ArrowDown01Icon} size={22} strokeWidth={2.4} /><Icon icon={ArrowDown01Icon} size={22} strokeWidth={2.4} /></span>
        </div>
        <div className="hero-hint" aria-hidden="true">Role para conhecer<Icon icon={ArrowDown01Icon} size={18} strokeWidth={2.2} /></div>
        <div className="hero-progress" aria-hidden="true"><i /></div>
      </div>
    </section>
  )
}
