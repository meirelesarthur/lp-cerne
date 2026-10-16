"""Otimizações de carregamento (só código): LCP, quadros sob demanda, JS dividido, fonte, cabeçalhos."""
import os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, s): open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(s)
def rep(s, a, b, name):
    if a not in s: raise SystemExit(f'NÃO ACHEI ({name}): {a[:70]}')
    return s.replace(a, b, 1)

# ---------- defer.ts: primeira interação ----------
s = rd('src/lib/defer.ts')
s = rep(s, "import { useEffect, useState } from 'react'\n", """import { useEffect, useState } from 'react'

const INTERACTION = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const

/** Chama `cb` uma vez: na primeira interação do usuário ou, no máximo, após `ms`. Devolve a função de limpeza. */
export function onFirstInteraction(cb: () => void, ms = 8000) {
  let done = false
  const go = () => { if (done) return; done = true; off(); cb() }
  const t = window.setTimeout(go, ms)
  const off = () => { window.clearTimeout(t); INTERACTION.forEach((e) => window.removeEventListener(e, go)) }
  INTERACTION.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }))
  return off
}
""", 'defer import')
a = s.index('/** true depois do primeiro scroll'); b = s.index('/** true quando o elemento')
s = s[:a] + """/** true depois da primeira interação (ou de `ms` ociosos): mídia de seções abaixo não disputa banda com o 1º quadro. */
export function useAfterFirstScroll(ms = 8000) {
  const [ok, setOk] = useState(false)
  useEffect(() => (ok ? undefined : onFirstInteraction(() => setOk(true), ms)), [ok, ms])
  return ok
}

""" + s[b:]
wr('src/lib/defer.ts', s)

# ---------- reveal.ts: não registra duas vezes o mesmo elemento ----------
s = rd('src/lib/reveal.ts')
s = rep(s, "  const triggers = ScrollTrigger.batch('[data-reveal]', {",
"""  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-rb])'))
  els.forEach((e) => { e.dataset.rb = '1' })
  const triggers = ScrollTrigger.batch(els, {""", 'reveal batch')
wr('src/lib/reveal.ts', s)

# ---------- ScrubCanvas: quadros sob demanda, perto de onde o usuário está ----------
s = rd('src/components/ScrubCanvas.tsx')
s = rep(s, "import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'\n",
        "import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'\nimport { onFirstInteraction } from '../lib/defer'\n", 'sc import')
s = rep(s, """  useImperativeHandle(ref, () => ({
    setFrame(i) {
      current.current = Math.max(0, Math.min(count - 1, Math.round(i)))
      draw()
    },
  }))
""", """  const pumpRef = useRef<() => void>(() => {})
  useImperativeHandle(ref, () => ({
    setFrame(i) {
      current.current = Math.max(0, Math.min(count - 1, Math.round(i)))
      draw()
      pumpRef.current()
    },
  }))
""", 'sc handle')
a = s.index("    ;(async () => {\n      await load(0)"); b = s.index("    return () => { cancelled = true;")
s = s[:a] + """    // Os quadros só começam a baixar na primeira interação (ou após 10 s parado) e na ordem do que o usuário está vendo:
    // o poster/1º quadro não disputa rede com o resto da página, e quem rola rápido recebe primeiro os quadros à frente.
    const net = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const CONC = net?.saveData ? 2 : 4
    const inflight = new Set<number>()
    let started = false
    const nextMissing = () => {
      const cur = current.current
      for (let d = 0; d < count; d++) {
        const a = cur + d
        if (a < count && !frames.current[a] && !inflight.has(a)) return a
        const b = cur - d
        if (d > 0 && b >= 0 && !frames.current[b] && !inflight.has(b)) return b
      }
      return -1
    }
    const pump = () => {
      if (cancelled || !started) return
      while (inflight.size < CONC) {
        const i = nextMissing()
        if (i < 0) return
        inflight.add(i)
        load(i).then(() => { inflight.delete(i); draw(); pump() })
      }
    }
    pumpRef.current = pump
    load(0)
    const stop = onFirstInteraction(() => { started = true; pump() }, 10000)
""" + s[b:]
s = rep(s, "    return () => { cancelled = true; window.removeEventListener('resize', resize) }",
        "    return () => { cancelled = true; stop(); pumpRef.current = () => {}; window.removeEventListener('resize', resize) }", 'sc cleanup')
wr('src/components/ScrubCanvas.tsx', s)

# ---------- Hero: poster no HTML (LCP), estágio final só depois de interação ----------
s = rd('src/components/Hero.tsx')
s = rep(s, "import { asset } from '../lib/assets'", "import { asset } from '../lib/assets'\nimport { onFirstInteraction } from '../lib/defer'", 'hero import')
s = rep(s, """    if (stageReady) return
    const go = () => setStageReady(true)
    const t = window.setTimeout(go, 3500)
    window.addEventListener('scroll', go, { once: true, passive: true })
    return () => { window.clearTimeout(t); window.removeEventListener('scroll', go) }
  }, [stageReady])""", """    if (stageReady) return
    return onFirstInteraction(() => setStageReady(true), 9000)
  }, [stageReady])""", 'hero stage')
s = rep(s, """        {!isStatic && m && <ScrubCanvas""", """        {/* o poster está no HTML desde o início (descoberto pelo preload, prioridade alta): é ele o LCP, sem esperar manifesto nem JS */}
        {!isStatic && <img className="poster" src={asset(`/frames/hero/${mobile ? 'mobile' : 'desktop'}/poster-first.webp`)} alt="" fetchPriority="high" decoding="async" />}
        {!isStatic && m && <ScrubCanvas""", 'hero poster')
wr('src/components/Hero.tsx', s)

s = rd('index.html')
s = s.replace('<link rel="preload" as="image" href="%VITE_ASSET_BASE%/frames/hero/desktop/poster-first.webp"', '<link rel="preload" as="image" fetchpriority="high" href="%VITE_ASSET_BASE%/frames/hero/desktop/poster-first.webp"')
s = s.replace('<link rel="preload" as="image" href="%VITE_ASSET_BASE%/frames/hero/mobile/poster-first.webp"', '<link rel="preload" as="image" fetchpriority="high" href="%VITE_ASSET_BASE%/frames/hero/mobile/poster-first.webp"')
wr('index.html', s)

# ---------- Sistema: fundo só perto da tela ----------
s = rd('src/components/Sections.tsx')
s = rep(s, "export function SystemSection() {", "export function SystemSection() {", 'system anchor')
# FazendaSection: o <section className="sec sec-light farm"> mora dentro de SystemSection; usa useNear com ref própria
s = rep(s, '<section className="sec sec-light farm" id="sistema" aria-labelledby="sistema-title" style={{ \'--farm-bg\': `url(${asset(\'/frames/sistema-bg.webp\')})`, \'--farm-bg-m\': `url(${asset(\'/frames/sistema-bg-mobile.webp\')})` } as React.CSSProperties}>',
        '<section ref={farmRef} className="sec sec-light farm" id="sistema" aria-labelledby="sistema-title" style={(farmNear ? { \'--farm-bg\': `url(${asset(\'/frames/sistema-bg.webp\')})`, \'--farm-bg-m\': `url(${asset(\'/frames/sistema-bg-mobile.webp\')})` } : undefined) as React.CSSProperties}>', 'farm style')
s = rep(s, "export function SystemSection() {\n  const root = useRef<HTMLElement>(null)", "export function SystemSection() {\n  const root = useRef<HTMLElement>(null)\n  const farmRef = useRef<HTMLElement>(null)\n  const farmNear = useNear(farmRef, '150% 0px')", 'farm ref')
wr('src/components/Sections.tsx', s)
c = rd('src/styles/sections.css')
c = c.replace("var(--farm-bg, url('/frames/sistema-bg.webp')) center / cover no-repeat", "var(--farm-bg, none) center / cover no-repeat").replace("var(--farm-bg-m, url('/frames/sistema-bg-mobile.webp')) center / cover no-repeat", "var(--farm-bg-m, none) center / cover no-repeat")
wr('src/styles/sections.css', c)

# ---------- Below.tsx: tudo abaixo do Hero num bloco separado, carregado na 1ª interação ----------
wr('src/components/Below.tsx', """import { useEffect } from 'react'
import {
  ContactSection, EditionsSection, FaqSection, Footer, ProblemSection,
  ProfilesSection, SystemSection, TrailerSection, TrustSection, TwinSection,
} from './Sections'
import { initHeaderTone, initReveal } from '../lib/reveal'
import { ScrollTrigger } from '../lib/scroll'

/** Tudo abaixo do Hero (e do Escopo). Fica em um chunk à parte, baixado e montado na primeira interação. */
export default function Below() {
  useEffect(() => {
    const a = initReveal(), b = initHeaderTone()
    ScrollTrigger.sort()
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => { cancelAnimationFrame(id); a(); b() }
  }, [])
  return (
    <>
      <ProblemSection />
      <TrailerSection />
      <SystemSection />
      <EditionsSection />
      <ProfilesSection />
      <TwinSection />
      <TrustSection />
      <ContactSection />
      <FaqSection />
    </>
  )
}
export { Footer }
""")
wr('src/App.tsx', """import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { GroundSection } from './components/GroundSection'
import { Header } from './components/Header'
import { Hero, type HeroGeometry } from './components/Hero'
import { onFirstInteraction } from './lib/defer'
import { initHeaderTone, initReveal } from './lib/reveal'
import './styles/sections.css'

const Below = lazy(() => import('./components/Below'))
const Footer = lazy(() => import('./components/Below').then((m) => ({ default: m.Footer })))

export default function App() {
  const [geo, setGeo] = useState<HeroGeometry | null>(null)
  const [below, setBelow] = useState(false)
  const onGeometry = useCallback((g: HeroGeometry) => setGeo(g), [])
  useEffect(() => initReveal(), [])
  useEffect(() => initHeaderTone(), [])
  // o restante da página (JS e mídia) só entra na primeira interação ou, no máximo, 6 s depois
  useEffect(() => onFirstInteraction(() => setBelow(true), 6000), [])
  return (
    <>
      <Header />
      <main>
        <Hero onGeometry={onGeometry} />
        <GroundSection geo={geo} />
        {below && (
          <Suspense fallback={null}>
            <Below />
          </Suspense>
        )}
      </main>
      {below && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  )
}
""")

# ---------- vite: preload da fonte ----------
s = rd('vite.config.ts')
s = rep(s, "    // com os arquivos pesados no R2,", """    // preload da fonte principal (latin variável): o texto do Hero não espera o CSS achar o arquivo
    { name: 'preload-font', transformIndexHtml: { order: 'post' as const, handler(_html: string, ctx: { bundle?: Record<string, unknown> }) {
      const f = ctx.bundle && Object.keys(ctx.bundle).find((k) => /outfit-latin-wght-normal.*\\.woff2$/.test(k))
      return f ? [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f}`, crossorigin: '' }, injectTo: 'head-prepend' as const }] : undefined
    } } },
    // com os arquivos pesados no R2,""", 'vite font')
wr('vite.config.ts', s)

# ---------- cabeçalhos de cache do Worker ----------
wr('public/_headers', """/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.svg
  Cache-Control: public, max-age=86400
""")
print('ok')
