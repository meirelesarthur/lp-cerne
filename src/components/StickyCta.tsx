import { useEffect, useState } from 'react'
import { Chat01Icon, Icon } from '../lib/icons'

/** CTA fixo depois do Hero (o header só leva de volta ao topo); some quando o Hero, o formulário completo ou a maquete da fazenda estão na tela. */
export function StickyCta() {
  const [hide, setHide] = useState(true)
  useEffect(() => {
    const sync = () => {
      const done = document.documentElement.hasAttribute('data-hero-done')
      const f = document.getElementById('contato')?.getBoundingClientRect()
      const onForm = Boolean(f && f.top < window.innerHeight * 0.85 && f.bottom > 0)
      // some também sobre a maquete da fazenda: ali o cartão do setor usa o canto inferior
      const m = document.getElementById('sistema')?.getBoundingClientRect()
      const onFarm = Boolean(m && m.top < window.innerHeight * 0.5 && m.bottom > window.innerHeight * 0.5)
      // e enquanto o Hero está na tela: o cartão do formulário do Hero usa o mesmo canto inferior
      const h = document.querySelector('.hero-pin')?.getBoundingClientRect()
      const onHero = Boolean(h && h.bottom > window.innerHeight * 0.6)
      setHide(!done || onForm || onFarm || onHero)
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => window.removeEventListener('scroll', sync)
  }, [])
  return (
    <a className={`sticky-cta btn btn-primary${hide ? ' is-hidden' : ''}`} href="#contato" tabIndex={hide ? -1 : 0} aria-hidden={hide || undefined}>
      <Icon icon={Chat01Icon} size={20} strokeWidth={1.8} />
      Entre em contato
    </a>
  )
}
