import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

/** Inicia o Lenis sincronizado ao ScrollTrigger. Retorna a função de limpeza. */
export function startSmoothScroll() {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -80 } })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (t: number) => lenis?.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.4 })
  else window.scrollTo({ top: y, behavior: 'smooth' })
}

/** Preferência de movimento reduzido ou conexão fraca: sem scrub. */
export function shouldSkipScrub() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return Boolean(c?.saveData || (c?.effectiveType && /(^|-)2g$/.test(c.effectiveType)))
}

export { gsap, ScrollTrigger }

// depuração (só em desenvolvimento)
if (import.meta.env.DEV) (window as unknown as { ST: typeof ScrollTrigger }).ST = ScrollTrigger
