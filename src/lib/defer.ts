import { useEffect, useState } from 'react'

/** true depois do primeiro scroll (ou de `ms` ociosos): mídia de seções abaixo não disputa banda com o 1º quadro. */
export function useAfterFirstScroll(ms = 3500) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    if (ok) return
    const go = () => setOk(true)
    const t = window.setTimeout(go, ms)
    window.addEventListener('scroll', go, { once: true, passive: true })
    return () => { window.clearTimeout(t); window.removeEventListener('scroll', go) }
  }, [ok, ms])
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
