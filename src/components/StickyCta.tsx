import { useEffect, useState } from 'react'

/** CTA fixo depois do Hero (o header só leva de volta ao topo); some quando o formulário completo está na tela. */
export function StickyCta() {
  const [hide, setHide] = useState(true)
  useEffect(() => {
    const sync = () => {
      const done = document.documentElement.hasAttribute('data-hero-done')
      const f = document.getElementById('contato')?.getBoundingClientRect()
      const onForm = Boolean(f && f.top < window.innerHeight * 0.85 && f.bottom > 0)
      setHide(!done || onForm)
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => window.removeEventListener('scroll', sync)
  }, [])
  return (
    <a className={`sticky-cta btn btn-primary${hide ? ' is-hidden' : ''}`} href="#contato" data-interest="demonstracao" tabIndex={hide ? -1 : 0} aria-hidden={hide || undefined}>
      Agendar demonstração
    </a>
  )
}
