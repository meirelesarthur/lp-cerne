import { focusHeroForm } from './Hero'

export function Header() {
  return (
    <header className="header">
      <a href="/" aria-label="Cerne, página inicial">
        <img className="logo-on-glass" src="/logo.svg" alt="Cerne" height={28} />
        <img className="logo-on-scene" src="/logo-white.svg" alt="" aria-hidden="true" height={28} />
      </a>
      <button type="button" className="btn btn-primary" onClick={focusHeroForm}>
        Entrar na lista de espera
      </button>
    </header>
  )
}
