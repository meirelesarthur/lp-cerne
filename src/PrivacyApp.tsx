import { useEffect } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Sections'
import './styles/sections.css'

/**
 * Política de Privacidade (rota /privacidade): mesma barra e mesmo rodapé da home, para parecer a mesma página.
 * Texto curto e direto, conforme a LGPD (Lei 13.709/2018). Atualize a data ao mudar o conteúdo.
 */
export default function PrivacyApp() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Política de Privacidade | Cerne'
    // a barra usa o estilo "com vidro" (o de depois do Hero), que aqui vale desde o início
    document.documentElement.setAttribute('data-hero-done', '')
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const prevHref = canonical?.href
    if (canonical) canonical.href = `${location.origin}/privacidade`
    window.scrollTo(0, 0)
    return () => { document.title = prev; document.documentElement.removeAttribute('data-hero-done'); if (canonical && prevHref) canonical.href = prevHref }
  }, [])

  return (
    <>
      <Header home />
      <main id="main" className="privacy">
        <h1>Política de Privacidade</h1>
        <p className="privacy-upd">Atualizada em 22/10/2026</p>

        <p>Esta página explica, de forma simples, como a GB Agritech trata os dados que você informa no cadastro de acesso antecipado ao Cerne, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).</p>

        <h2>Quem é o responsável</h2>
        <p>A GB Agritech, desenvolvedora do Cerne, é a responsável pelo tratamento dos seus dados. Site: <a href="https://gbagritech.com.br" target="_blank" rel="noreferrer">gbagritech.com.br</a>.</p>

        <h2>Quais dados coletamos</h2>
        <ul>
          <li>Nome e WhatsApp, que você informa no formulário.</li>
          <li>E-mail, só se você quiser informar (é opcional).</li>
          <li>De onde você veio (página, campanha ou link de origem), a data e a hora do cadastro e o aviso que você viu ao enviar.</li>
        </ul>

        <h2>Para que usamos</h2>
        <ul>
          <li>Entrar em contato sobre o Cerne: acesso antecipado, demonstração e novidades do produto.</li>
          <li>Entender quantas pessoas se interessam e por onde chegaram, em números gerais.</li>
        </ul>
        <p>Não usamos seus dados para outra finalidade e não os vendemos.</p>

        <h2>Base legal</h2>
        <p>Seu consentimento (LGPD, art. 7º, I), dado quando você clica no botão do formulário depois de ler o aviso que fica logo abaixo dele.</p>

        <h2>Com quem compartilhamos</h2>
        <p>Apenas com empresas que nos ajudam a operar este site e o atendimento (como hospedagem, armazenamento e ferramentas de contato), que só podem usar os dados para esse fim.</p>

        <h2>Por quanto tempo guardamos</h2>
        <p>Pelo tempo necessário para falar com você sobre o Cerne, ou até você pedir a exclusão.</p>

        <h2>Seus direitos</h2>
        <p>Você pode, a qualquer momento: saber se tratamos seus dados e acessá-los; corrigir dados; pedir a exclusão; pedir informações sobre compartilhamento; e retirar seu consentimento, o que interrompe os contatos. Para isso, fale com a GB Agritech pelo canal de contato do site <a href="https://gbagritech.com.br" target="_blank" rel="noreferrer">gbagritech.com.br</a> ou responda a qualquer mensagem que enviarmos.</p>

        <h2>Segurança e cookies</h2>
        <p>Usamos medidas técnicas razoáveis para proteger os dados. Esta página não usa cookies de publicidade nem de rastreamento. Se isso mudar, atualizamos esta política.</p>

        <h2>Mudanças nesta política</h2>
        <p>Se algo importante mudar, publicamos a nova versão aqui, com a data de atualização no topo.</p>

        <a className="privacy-back" href="/">← Voltar para o Cerne</a>
      </main>
      <Footer base="/" />
    </>
  )
}
