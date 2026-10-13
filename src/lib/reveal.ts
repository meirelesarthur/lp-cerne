import { gsap, ScrollTrigger } from './scroll'

/**
 * Revela elementos com [data-reveal] ao entrarem na tela (sobe 24px e aparece, em cascata).
 * Sem JS ou com movimento reduzido, tudo fica visível (o estado inicial oculto só existe sob html.reveal-on).
 */
export function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  document.documentElement.classList.add('reveal-on')
  const triggers = ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, overwrite: true }),
  })
  return () => {
    triggers.forEach((t) => t.kill())
    document.documentElement.classList.remove('reveal-on')
  }
}
