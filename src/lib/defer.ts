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
