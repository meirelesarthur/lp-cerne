import { useEffect, useState } from 'react'

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

/** true depois da primeira interação (ou de `ms` ociosos): mídia de seções abaixo não disputa banda com o 1º quadro. */
export function useAfterFirstScroll(ms = 8000) {
  const [ok, setOk] = useState(false)
  useEffect(() => (ok ? undefined : onFirstInteraction(() => setOk(true), ms)), [ok, ms])
  return ok
}

/** true quando o elemento chega a `margin` da tela (uma vez): carrega mídia pesada só perto de ser vista. */
export function useNear(ref: React.RefObject<Element | null>, margin = '120% 0px') {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect() } }, { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin, near])
  return near
}
