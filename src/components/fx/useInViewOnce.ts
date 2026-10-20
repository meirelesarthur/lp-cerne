import { useEffect, useRef, useState } from 'react'
import { shouldSkipScrub } from '../../lib/scroll'

/**
 * Efeitos de entrada (uma vez): `armed` esconde o estado inicial só depois de o JS montar (sem JS, o texto fica
 * visível) e `shown` dispara quando o elemento aparece. Movimento reduzido ou conexão fraca: nunca arma, vai direto ao final.
 */
export function useInViewOnce<T extends Element>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null)
  const [armed] = useState(() => !shouldSkipScrub())
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !armed || shown) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [armed, shown, margin])

  return { ref, className: `${armed ? 'fx-armed' : ''}${shown ? ' is-in' : ''}` }
}
