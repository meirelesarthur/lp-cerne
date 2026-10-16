import { gsap, ScrollTrigger } from './scroll'

/**
 * Revela elementos com [data-reveal] ao entrarem na tela (sobe 24px e aparece, em cascata).
 * Sem JS ou com movimento reduzido, tudo fica visível (o estado inicial oculto só existe sob html.reveal-on).
 */
export function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  document.documentElement.classList.add('reveal-on')
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-rb])'))
  els.forEach((e) => { e.dataset.rb = '1' })
  const triggers = ScrollTrigger.batch(els, {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, overwrite: true }),
  })
  return () => {
    triggers.forEach((t) => t.kill())
    document.documentElement.classList.remove('reveal-on')
  }
}

/**
 * Header escuro sobre seções escuras: cada elemento com [data-header-dark] liga html[data-header-dark]
 * enquanto estiver sob o header. Usa o pin-spacer quando a seção é fixada no scroll.
 */
export function initHeaderTone(headerH = 76) {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-header-dark]'))
  const active = new Set<HTMLElement>()
  const sync = () => document.documentElement.toggleAttribute('data-header-dark', active.size > 0)
  const triggers = els.map((el) => {
    const target = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el
    return ScrollTrigger.create({
      trigger: target, start: `top ${headerH}px`, end: `bottom ${headerH}px`,
      onToggle: (self) => { if (self.isActive) active.add(el); else active.delete(el); sync() },
    })
  })
  return () => { triggers.forEach((t) => t.kill()); document.documentElement.removeAttribute('data-header-dark') }
}
