import { asset } from '../lib/assets'
import { onFirstInteraction } from '../lib/defer'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, scrollToY, shouldSkipScrub, startSmoothScroll } from '../lib/scroll'
import { coverBox, finalZoom, prefersHd, supportsAvif, type Box, type Manifest, type Zoom } from '../lib/stage'
import { HeroForm } from './HeroForm'
import { ScrubCanvas, type ScrubHandle } from './ScrubCanvas'

const EMAIL_ID = 'hero-email'
/** Quadros verticais só em tela retrato estreita; janelas deitadas usam o plano 16:9. */
/** Altura do header fixo (logo + CTA). */
const HEADER_H = 84
const MOBILE_MQ = '(max-width: 820px) and (orientation: portrait)'

/** Fases do scroll (fração do pin). */
const P = {
  seqEnd: 0.55, // fim da sequência de quadros (tablet gigante já no lugar)
  zoomEnd: 0.64, // zoom centralizado no tablet
  appEnd: 0.86, // a aplicação rola dentro do tablet
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
  const focus = () => document.getElementById(EMAIL_ID)?.focus({ preventScroll: true })
  if (heroTrigger) {
    scrollToY(heroTrigger.end)
    window.setTimeout(focus, 1500)
  } else {
    document.getElementById(EMAIL_ID)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
          trigger: root.current, start: 'top top', end: '+=420%', pin: pin.current, scrub: 0.5, anticipatePin: 1, refreshPriority: 10,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // header: compõe com a cena durante toda a animação; vidro só ao sair do Hero.
            // logo branco só no close inicial (ombro, fundo escuro); no céu claro, logo colorido
            const html = document.documentElement
            html.toggleAttribute('data-hero-done', self.progress >= 0.999)
            html.toggleAttribute('data-scene-dark', self.progress < 0.035)
            const v = video.current
            if (!v) return
            if (self.progress >= P.appEnd) { if (v.paused) void v.play().catch(() => {}) } else if (!v.paused) v.pause()
          },
        },
      })
      tl.to(state, { frame: m.count - 1, duration: P.seqEnd, onUpdate: () => scrub.current?.setFrame(state.frame) }, 0)
        .to('.hero-hint', { opacity: 0, duration: 0.04 }, 0)
        .to('.hero-progress i', { scaleX: 1, duration: P.appEnd }, 0)
        .to('.hero-progress', { autoAlpha: 0, duration: 0.03 }, P.appEnd)
      if (m.final && geo) {
        const { zoom, zoomApp } = geo
        // o still em alta assume no último quadro e faz o zoom centralizado no tablet
        tl.fromTo('.final-layer', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.012 }, P.seqEnd - 0.012)
          .fromTo('.frame-box', { x: 0, y: 0, scale: 1 }, { x: zoomApp.tx, y: zoomApp.ty, scale: zoomApp.s, duration: P.zoomEnd - P.seqEnd, ease: 'power2.inOut' }, P.seqEnd)
          .to('.tablet-screen', { autoAlpha: 1, duration: 0.03 }, P.seqEnd)
          // a aplicação rola dentro do tablet
          .fromTo('.tablet-app', { yPercent: 0 }, { yPercent: () => -100 * appScrollFraction(), duration: P.appEnd - P.zoomEnd - 0.02, ease: 'power1.inOut' }, P.zoomEnd + 0.01)
          // vídeo do sistema em loop + título e form
          // recua para o enquadramento final (fazenda no rodapé) e o vídeo do sistema entra em loop
          .to('.frame-box', { x: zoom.tx, y: zoom.ty, scale: zoom.s, duration: 0.08, ease: 'power2.inOut' }, P.appEnd)
          .to('.tablet-video', { autoAlpha: 1, duration: 0.04 }, P.appEnd)
          .to('.hero-shade', { opacity: 1, duration: 0.08 }, P.appEnd)
          .fromTo('.hero-copy', { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.09, ease: 'power2.out' }, P.appEnd + 0.02)
          .fromTo('.hero-form-wrap', { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.09, ease: 'power2.out' }, P.appEnd + 0.05)
      }
      heroTrigger = tl.scrollTrigger ?? null
    }, root)
    // o pin entra depois do manifesto: reordena (Hero primeiro) e as seções abaixo recalculam suas posições
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
    return () => { heroTrigger = null; ctx.revert(); stopScroll() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic, m, geo?.vw, geo?.vh, stageReady])

  /** Quanto da imagem alta da aplicação precisa subir para chegar ao fim dela. */
  function appScrollFraction() {
    const img = appImg.current
    if (!img || !img.naturalHeight || !m?.final || !geo) return 0.6
    const t = m.final.tablet
    const sw = t.w * geo.box.width, sh = t.h * geo.box.height
    const ih = sw * (img.naturalHeight / img.naturalWidth)
    return Math.max(0, 1 - sh / ih)
  }

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

        <div className="hero-content">
          <div className="hero-copy">
            <h1>Do campo ao financeiro, <em>num só sistema.</em></h1>
            <p className="lead">Rebanho, lavoura, compras, estoque, fiscal e financeiro da sua fazenda no mesmo cadastro, com custo por lote e por talhão.</p>
            <p className="hero-proof">115 relatórios · 11 painéis · NF-e, MDF-e e LCDPR</p>
          </div>
          <div className="hero-form-wrap">
            <HeroForm emailId={EMAIL_ID} />
          </div>
        </div>

        <div className="hero-hint" aria-hidden="true">Role para conhecer</div>
        <div className="hero-progress" aria-hidden="true"><i /></div>
      </div>
    </section>
  )
}
