import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/app.css'
import './styles/fx.css'
import App from './App.tsx'
import PrivacyApp from './PrivacyApp.tsx'

// /privacidade é uma página da própria SPA (mesma barra e rodapé da home); qualquer outro caminho abre a landing
const isPrivacy = /^\/privacidade\/?$/.test(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPrivacy ? <PrivacyApp /> : <App />}
  </StrictMode>,
)
