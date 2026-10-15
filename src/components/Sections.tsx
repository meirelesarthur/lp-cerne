import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { maskPhone, submitLead, validators, type Status } from '../lib/form'
import { gsap } from '../lib/scroll'
import { useAfterFirstScroll, useNear } from '../lib/defer'
import { ScrubCanvas, type ScrubHandle } from './ScrubCanvas'
import { prefersHd, supportsAvif } from '../lib/stage'

const Tbd = ({ children = 'a validar' }: { children?: string }) => <span className="tbd">{children}</span>

/* ───────────────────────── 03 · Problema → Cerne ───────────────────────── */
// Palco em duas etapas, fixo no desktop: (A) a dor, com planilha, caderno e conversa; (B) a virada, com o produto
// inteiro (notebook e os dois apps) em grande. No celular e com movimento reduzido as duas etapas ficam empilhadas.
const PRODUTOS = [
  { n: 'Cerne Web', s: 'disponível', on: true },
  { n: 'Cerne Administração', s: 'em teste' },
  { n: 'Cerne Operação', s: 'em teste' },
]
const PROBLEM_PIN = '(min-width: 961px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)'

export function ProblemSection() {
  const root = useRef<HTMLElement>(null)
  const media = useAfterFirstScroll()

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(PROBLEM_PIN, () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=240%', pin: true, scrub: 0.6, refreshPriority: 6 },
      })
      // 0 → 1 = toda a duração
      tl.fromTo('.layer-a', { x: -70, y: -40, rotate: -7 }, { x: 18, y: 26, rotate: -2, duration: 0.3 }, 0)
        .fromTo('.layer-b', { x: 60, y: 6, rotate: 6 }, { x: -22, y: 0, rotate: 1.5, duration: 0.3 }, 0)
        .fromTo('.layer-c', { x: -36, y: 64, rotate: -4 }, { x: 22, y: -64, rotate: -1, duration: 0.3 }, 0)
        .to('.stage-a', { autoAlpha: 0, y: -40, duration: 0.14 }, 0.36)
        .fromTo('.stage-b', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.5)
        .fromTo('.product-head', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.14 }, 0.5)
        .fromTo('.product-img', { autoAlpha: 0, scale: 0.86, y: 70, rotateX: 10, transformPerspective: 1200 }, { autoAlpha: 1, scale: 1, y: 0, rotateX: 0, duration: 0.28 }, 0.54)
        .fromTo('.product-tags li', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.1 }, 0.8)
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className="sec sec-light problem" id="problema" aria-labelledby="problema-title">
      <div className="problem-stage">
        <div className="stage-a">
          <div className="wrap problem-grid">
            <div className="problem-copy">
              <header className="sec-head">
                <span className="eyebrow">O ponto de partida</span>
                <h2 id="problema-title">Planilha aqui, caderno ali, WhatsApp no meio.</h2>
                <p className="sec-lead">Quando a informação está espalhada, a decisão chega atrasada e o custo aparece só no fim do mês.</p>
              </header>
              <ol className="pains">
                <li><b>01</b> Número diferente em cada controle.</li>
                <li><b>02</b> O que o campo anota demora a chegar ao escritório.</li>
                <li><b>03</b> Resultado por lote ou curral só no fechamento, se der.</li>
              </ol>
            </div>
            <div className="layers" aria-hidden="true">
              <div className="layer layer-a">
                <span className="layer-tag">Planilha</span>
                <div className="sheet">{Array.from({ length: 30 }, (_, i) => <i key={i} />)}</div>
              </div>
              <div className="layer layer-b">
                <span className="layer-tag">Caderno</span>
                <div className="notebook"><p>Curral 4: trato 6h30</p><p>Lote 12: pesar sexta</p><p>Ração: pedir 8 t</p></div>
              </div>
              <div className="layer layer-c">
                <span className="layer-tag">Conversa</span>
                <div className="chat"><p className="in">Quantos bois no curral 7?</p><p className="out">Acho que 84, vou confirmar</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="stage-b">
          <div className="wrap product">
            <header className="product-head">
              <span className="eyebrow">A virada</span>
              <h2>O Cerne junta tudo em um lugar.</h2>
              <p className="sec-lead">Um sistema no navegador hoje, com os apps de escritório e de campo a caminho.</p>
            </header>
            <figure className="product-fig">
              {media && (
                <img className="product-img" src="/mocks/cerne-produtos-1400.webp" srcSet="/mocks/cerne-produtos-1400.webp 1400w, /mocks/cerne-produtos-2400.webp 2400w" sizes="(min-width: 1200px) 1100px, 92vw" width={2400} height={1461} alt="Cerne Web no notebook, com os apps Administração e Operação em dois celulares" loading="lazy" decoding="async" />
              )}
              <ul className="product-tags">
                {PRODUTOS.map((p) => (
                  <li key={p.n} className={p.on ? 'on' : ''}><i aria-hidden="true" />{p.n}<small>{p.s}</small></li>
                ))}
              </ul>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── 04 · Trailer ───────────────────────── */
const CAPITULOS = [
  { t: 0, n: 'Visão geral', d: 'Indicadores da fazenda num painel só.' },
  { t: 3.6, n: 'Pecuária de corte', d: 'Rebanho, composição e manejos do período.' },
  { t: 6.4, n: 'Lotação de currais', d: 'Quem está onde e o que precisa de atenção.' },
  { t: 9.2, n: 'Custos do confinamento', d: 'Quanto custa cada fase, sem esperar o fechamento.' },
  { t: 12.0, n: 'Financeiro', d: 'Receitas, despesas e orçamento do período.' },
]

const DESKTOP_PIN = '(min-width: 961px) and (prefers-reduced-motion: no-preference)'

export function TrailerSection() {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const capRef = useRef(0)
  const media = useAfterFirstScroll()
  const [cap, setCap] = useState(0)

  useEffect(() => {
    const v = video.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; void v.play().catch(() => {}) } else v.pause()
    }, { threshold: 0.35 })
    io.observe(v)
    const onTime = () => {
      const t = v.currentTime % 15
      let i = 0
      CAPITULOS.forEach((c, k) => { if (t >= c.t) i = k })
      capRef.current = i
      setCap(i)
    }
    v.addEventListener('timeupdate', onTime)
    return () => { io.disconnect(); v.removeEventListener('timeupdate', onTime) }
  }, [])

  const goTo = (i: number) => {
    const v = video.current
    capRef.current = i
    setCap(i)
    if (!v) return
    v.currentTime = CAPITULOS[i].t + 0.05
    void v.play().catch(() => {})
  }

  // desktop: a seção fica fixa e cada trecho do scroll abre um capítulo
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(DESKTOP_PIN, () => {
      gsap.timeline({
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: '+=240%', pin: true, scrub: true, refreshPriority: 5,
          onUpdate: (self) => {
            const i = Math.min(CAPITULOS.length - 1, Math.floor(self.progress * CAPITULOS.length))
            if (i !== capRef.current) goTo(i)
          },
        },
      }).fromTo('.trailer .browser', { scale: 0.94 }, { scale: 1, ease: 'none', duration: 0.25 })
        .fromTo('.trailer .scrub-bar i', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
    })
    return () => mm.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section ref={root} className="sec sec-deep trailer" id="trailer" aria-labelledby="trailer-title" data-header-dark>
      <div className="wrap">
        <header className="sec-head center" data-reveal>
          <span className="eyebrow">O sistema em funcionamento</span>
          <h2 id="trailer-title">Veja o Cerne por dentro.</h2>
          <p className="sec-lead">Telas reais do Cerne Web, com dados de demonstração.</p>
        </header>
        <div className="trailer-grid">
          <figure className="browser" data-reveal>
            <div className="browser-bar" aria-hidden="true"><i /><i /><i /><span>app.cerne.agr.br</span></div>
            <video ref={video} muted loop playsInline preload="none" poster={media ? '/video/system-loop-poster.webp' : undefined} aria-label="Demonstração das telas do Cerne Web">
              <source src="/video/system-loop.webm" type="video/webm" />
              <source src="/video/system-loop.mp4" type="video/mp4" />
            </video>
          </figure>
          <ol className="chapters">
            <li className="scrub-bar" aria-hidden="true"><i /></li>
            {CAPITULOS.map((c, i) => (
              <li key={c.n} data-reveal>
                <button type="button" className={i === cap ? 'on' : ''} onClick={() => goTo(i)} aria-pressed={i === cap}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <span><strong>{c.n}</strong><small>{c.d}</small></span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── 05 · Sistema (bento) ───────────────────────── */
// grade de 12 colunas: telas reais em moldura de proporção fixa; frentes sem tela mostram os subitens em chips
const MODULOS = [
  { k: 'a', n: '01', tag: 'Operação', t: 'Pecuária e confinamento', d: 'Rebanho, lotes, currais, dieta, trato diário e leitura de cocho.', feats: ['Mapa de currais', 'Dieta e batelada', 'Trato e cocho', 'Manejo e reprodução'], img: 'lotacao-currais' },
  { k: 'b', n: '02', tag: 'Operação', t: 'Agricultura', d: 'Talhões, planejamento de safra, romaneios e rastreabilidade.', feats: ['Safras', 'Romaneios', 'Pesagem rodoviária'], img: 'talhoes' },
  { k: 'c', n: '03', tag: 'Administrativo', t: 'Suprimentos e estoque', d: 'Cotação, compra, recebimento e fábrica de ração.', feats: ['Cotações', 'Recebimentos', 'Fábrica de ração'], img: 'suprimentos' },
  { k: 'd', n: '04', tag: 'Administrativo', t: 'Financeiro e ativos', d: 'Custos, resultado e depreciação.', feats: ['Livro caixa', 'Depreciações', 'Ativos'], img: 'financeiros' },
  { k: 'e', n: '05', tag: 'Base', t: 'Cadastros', d: 'A base única que todas as frentes usam.', chips: ['Fazendas', 'Safras', 'Produtos', 'Pessoas', 'Perfis de acesso'] },
  { k: 'f', n: '06', tag: 'Gestão', t: 'Dashboards e relatórios', d: 'Visão geral, custos, lotação, desempenho de lotes e pluviometria, sem montar planilha.', feats: ['Visão geral', 'Custos do confinamento', 'Lotação de currais', 'Desempenho de lotes', 'Pluviometria'], img: 'custos-confinamento' },
]

export function SystemSection() {
  const root = useRef<HTMLElement>(null)
  const media = useAfterFirstScroll()
  // leve parallax das telas dentro das molduras (transform só, sem layout)
  useLayoutEffect(() => {
    if (!media || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.shot img').forEach((img) => {
        gsap.fromTo(img, { yPercent: 0 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
    }, root)
    return () => ctx.revert()
  }, [media])

  return (
    <section ref={root} className="sec sec-light system" id="sistema" aria-labelledby="sistema-title">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">O sistema</span>
          <h2 id="sistema-title">Seis frentes. Um só cadastro.</h2>
          <p className="sec-lead">Os módulos que já estão no menu do Cerne Web.</p>
        </header>
        <div className="bento">
          {MODULOS.map((m) => (
            <article key={m.k} className={`cell cell-${m.k}`} data-reveal>
              <div className="cell-text">
                <div className="cell-top"><span className="cell-n">{m.n}</span><span className="cell-tag">{m.tag}</span></div>
                <h3>{m.t}</h3>
                <p>{m.d}</p>
                {m.feats && <ul className="feats">{m.feats.map((f) => <li key={f}>{f}</li>)}</ul>}
              </div>
              {m.img ? (
                <div className="shot">{media && <img src={`/screens/${m.img}.webp`} alt="" loading="lazy" decoding="async" />}</div>
              ) : (
                <div className="base">
                  <ul className="chips">{m.chips!.map((c) => <li key={c}>{c}</li>)}</ul>
                  <p className="base-note"><i aria-hidden="true" />Cada frente lê o mesmo cadastro: um produto, uma pessoa, uma fazenda, um só lugar.</p>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="spine" data-reveal aria-hidden="true">
          <span>Um só cadastro</span>
          <ol>{MODULOS.map((m) => <li key={m.k}><i />{m.t}</li>)}</ol>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── 06 · Edições ───────────────────────── */
export function EditionsSection() {
  const media = useAfterFirstScroll()
  return (
    <section className="sec sec-light editions" id="edicoes" aria-labelledby="edicoes-title">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">Como usar</span>
          <h2 id="edicoes-title">Um sistema. Três formas de usar.</h2>
        </header>
        <div className="editions-grid">
          <article className="edition web" data-reveal>
            <span className="badge on">Disponível · navegador</span>
            <h3>Cerne Web</h3>
            <p>O ERP completo: cadastros, dashboards, suprimentos, estoque, financeiro e operação.</p>
            {media && <img src="/screens/visao-geral.webp" alt="Cerne Web: painel Visão Geral" loading="lazy" />}
            <a className="btn btn-primary" href="#contato" data-interest="demonstracao">Agendar demonstração</a>
          </article>
          <article className="edition app" data-reveal>
            <span className="badge">Em construção · em teste</span>
            <h3>Cerne Administração</h3>
            <p>Para gestores e escritório: resultado, rebanho e ordens de serviço.</p>
            <div className="phone" aria-hidden="true"><span>Tela do app</span></div>
            <a className="btn btn-ghost" href="#contato" data-interest="app-administracao">Quero testar</a>
          </article>
          <article className="edition app" data-reveal>
            <span className="badge">Em construção · em teste</span>
            <h3>Cerne Operação</h3>
            <p>Para o campo: minhas ordens, trato, cocho, pesagem e sanitário.</p>
            <div className="phone" aria-hidden="true"><span>Tela do app</span></div>
            <a className="btn btn-ghost" href="#contato" data-interest="app-operacao">Quero testar</a>
          </article>
        </div>
        <p className="fineprint" data-reveal>Os apps estão em desenvolvimento; funcionalidades e prazos podem mudar. <Tbd>texto a validar</Tbd></p>
      </div>
    </section>
  )
}

/* ───────────────────────── 07 · Perfis ───────────────────────── */
const PASSOS = [
  { t: 'Escritório', d: 'Cria a ordem de serviço.' },
  { t: 'Campo', d: 'Recebe e executa.' },
  { t: 'Apontamento', d: 'Registrado em etapas.' },
  { t: 'Gestor', d: 'Avalia e vê o resultado.' },
]
/** Onde cada passo acende (fração do scroll): OS já no celular, leitura de cocho, subida até a vista da fazenda, escritório. */
const PASSO_EM = [0, 0.05, 0.27, 0.74]
/** O plano termina aqui; o resto do scroll segura o escritório com o cartão do gestor. */
const PLANO_FIM = 0.9
const PIN_MQ = '(prefers-reduced-motion: no-preference)'

type PerfisManifest = { count: number; width: number; height: number }

/**
 * Plano contínuo em tela cheia: leitura de cocho com a OS no celular -> a câmera sobe e mostra a fazenda inteira
 * (confinamento, armazém, silos, caminhão carregando) -> desce e entra no escritório do gestor. Textos em vidro
 * por cima, em três momentos (campo, fazenda, gestor), e os 4 passos da OS acendendo no rodapé.
 */
export function ProfilesSection() {
  const root = useRef<HTMLElement>(null)
  const scrub = useRef<ScrubHandle>(null)
  const frames = useRef(0)
  const near = useNear(root)
  const [step, setStep] = useState(0)
  const [mobile] = useState(() => window.matchMedia('(max-width: 820px) and (orientation: portrait)').matches)
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  // celular: recorte vertical; desktop a partir de 1200 px reais com boa rede: HD 1920 px (a seção ocupa a tela
  // inteira, então o 1280 px já perde nitidez em ~1400 px); demais: 1280 px. AVIF sempre que houver suporte
  const [variant] = useState(() => (mobile ? 'mobile' : prefersHd(1200) ? 'desktop-hd' : 'desktop'))
  const [ext] = useState(() => (supportsAvif() ? 'avif' : 'webp') as 'avif' | 'webp')
  const [m, setM] = useState<PerfisManifest | null>(null)
  const dir = `/frames/perfis/${variant}`

  useEffect(() => {
    if (!near || still) return
    fetch(`${dir}/manifest.json`).then((r) => r.json()).then((d: PerfisManifest) => { frames.current = d.count - 1; setM(d) }).catch(() => {})
  }, [near, still, dir])

  // pin criado já na montagem (a altura da página não muda depois); os quadros entram quando o manifest chega
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(PIN_MQ, () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power1.out' },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: '+=480%', pin: true, scrub: 0.5, refreshPriority: 4,
          onUpdate: (st) => {
            const p = st.progress
            scrub.current?.setFrame(Math.min(1, p / PLANO_FIM) * frames.current)
            let k = 0
            PASSO_EM.forEach((at, i) => { if (p >= at) k = i })
            setStep(k)
          },
        },
      })
      // 1 = toda a duração; cada momento entra e sai no seu trecho
      tl.set({}, {}, 1)
        .fromTo('.pf-campo', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.06 }, 0.2)
        .fromTo('.pf-fazenda', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.27)
        .to('.pf-fazenda', { autoAlpha: 0, y: -24, duration: 0.06 }, 0.5)
        .fromTo('.pf-gestor', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.72)
        .fromTo('.pf-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className={`perfis${still ? ' still' : ''}`} id="perfis" aria-labelledby="perfis-title">
      <div className="pf-media" aria-hidden="true">
        {still || !m
          ? <img src={`${dir}/poster-${still ? 'last' : 'first'}.webp`} alt="" loading="lazy" decoding="async" />
          : <ScrubCanvas key={dir} ref={scrub} dir={dir} count={m.count} ext={ext} poster={`${dir}/poster-first.webp`} />}
        <div className="pf-shade" />
      </div>

      <div className="pf-overlay">
        <div className="pf-phase pf-campo">
          <header className="pf-glass pf-head">
            <span className="eyebrow">Escritório e campo</span>
            <h2 id="perfis-title">Quem decide e quem executa, no mesmo fluxo.</h2>
          </header>
          <article className="pf-glass pf-card">
            <span className="pf-kicker">No curral</span>
            <h3>Campo</h3>
            <ul><li>Minhas ordens: iniciar, pausar, retomar</li><li>Trato diário e leitura de cocho</li><li>Pesagem e sanitário em etapas</li></ul>
            <p className="note">Pelo app Operação, em construção.</p>
          </article>
        </div>

        <div className="pf-phase pf-fazenda">
          <div className="pf-glass pf-card pf-center">
            <span className="pf-kicker">A fazenda inteira</span>
            <h3>Do cocho ao armazém, o apontamento chega ao escritório.</h3>
            <p>Confinamento, estoque e carga registrados no mesmo sistema.</p>
          </div>
        </div>

        <div className="pf-phase pf-gestor">
          <article className="pf-glass pf-card">
            <span className="pf-kicker">No escritório</span>
            <h3>Gestor</h3>
            <ul><li>Resultado, receita, custo e margem</li><li>Rebanho e confinamento com alertas</li><li>Ordens de serviço e apontamentos</li></ul>
          </article>
        </div>

        <ol className="pf-glass pf-steps" aria-label="Fluxo da ordem de serviço">
          <li className="pf-track" aria-hidden="true"><i className="pf-fill" /></li>
          {PASSOS.map((p, i) => (
            <li key={p.t} className={i <= step || still ? 'on' : ''} aria-current={i === step && !still ? 'step' : undefined}>
              <b>{i + 1}</b><span><strong>{p.t}</strong><small>{p.d}</small></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────────────────────── 08 · Confiança ───────────────────────── */
export function TrustSection() {
  return (
    <section className="sec sec-light trust" aria-labelledby="confianca-title">
      <div className="wrap trust-inner" data-reveal>
        <span className="eyebrow">Quem constrói</span>
        <h2 id="confianca-title">Feito por quem conhece o campo.</h2>
        <p className="sec-lead">Desenvolvido pela GB Agritech. <Tbd>redação e prova a validar</Tbd></p>
        <p className="fineprint">Depoimentos, parcerias e selos só entram com material real validado para o Cerne.</p>
      </div>
    </section>
  )
}

/* ───────────────────────── 09 · Form completo ───────────────────────── */
type CErr = Partial<Record<'name' | 'email' | 'whatsapp' | 'consent', string>>

export function ContactSection() {
  const uid = useId()
  const [v, setV] = useState({ name: '', email: '', whatsapp: '', size: '', interest: '', consent: false })
  const [errors, setErrors] = useState<CErr>({})
  const [status, setStatus] = useState<Status>('idle')

  // os CTAs "Agendar demonstração" / "Quero testar" pré-selecionam o interesse
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('[data-interest]') as HTMLElement | null
      if (a) setV((s) => ({ ...s, interest: a.dataset.interest ?? '' }))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const check = (k: keyof CErr) => {
    const msg = k === 'consent' ? validators.consent(v.consent) : validators[k](v[k])
    setErrors((e) => ({ ...e, [k]: msg }))
    return !msg
  }
  const set = (k: keyof typeof v, val: string | boolean) => setV((s) => ({ ...s, [k]: val }))

  const onSubmit = async (ev: FormEvent, intent: 'lista' | 'demonstracao') => {
    ev.preventDefault()
    if (![check('name'), check('email'), check('whatsapp'), check('consent')].every(Boolean)) return
    setStatus('loading')
    try {
      await submitLead({ origem: 'form-completo', intencao: intent, nome: v.name.trim(), email: v.email.trim(), whatsapp: v.whatsapp, tamanho: v.size, interesse: v.interest, consent: v.consent })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const field = (k: 'name' | 'email' | 'whatsapp', label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field" data-invalid={Boolean(errors[k])}>
      <label htmlFor={`${uid}-${k}`}>{label}</label>
      <input id={`${uid}-${k}`} {...props} value={v[k]} onBlur={() => check(k)}
        onChange={(e) => set(k, k === 'whatsapp' ? maskPhone(e.target.value) : e.target.value)}
        aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `${uid}-${k}-e` : undefined} />
      {errors[k] && <span className="err" id={`${uid}-${k}-e`}>{errors[k]}</span>}
    </div>
  )

  return (
    <section className="sec sec-light contact" id="contato" aria-labelledby="contato-title">
      <div className="wrap contact-grid">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">Lista de espera</span>
          <h2 id="contato-title">Entre na lista e fale com a gente.</h2>
          <p className="sec-lead">Receba o acesso ao Cerne Web, acompanhe os apps e agende uma demonstração com a nossa equipe.</p>
          <a className="btn btn-ghost whats" aria-disabled="true" href="#contato" onClick={(e) => e.preventDefault()}>Falar agora no WhatsApp <Tbd>número a definir</Tbd></a>
        </header>

        {status === 'success' ? (
          <div className="form big" role="status" data-reveal>
            <h3>Pronto, você está na lista.</h3>
            <p className="sub" style={{ display: 'block' }}>Nossa equipe vai falar com você pelo e-mail ou WhatsApp informado.</p>
          </div>
        ) : (
          <form className="form big" noValidate onSubmit={(e) => onSubmit(e, 'lista')} data-reveal>
            {field('name', 'Nome', { autoComplete: 'name', placeholder: 'Seu nome' })}
            <div className="row2">
              {field('email', 'E-mail', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'voce@suafazenda.com.br' })}
              {field('whatsapp', 'WhatsApp', { type: 'tel', autoComplete: 'tel-national', inputMode: 'tel', placeholder: '(00) 00000-0000' })}
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor={`${uid}-size`}>Tamanho da operação</label>
                <select id={`${uid}-size`} value={v.size} onChange={(e) => set('size', e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="ate-1000">Até 1.000 cabeças</option>
                  <option value="1000-5000">1.000 a 5.000 cabeças</option>
                  <option value="acima-5000">Acima de 5.000 cabeças</option>
                  <option value="agricultura-outro">Agricultura / outro</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor={`${uid}-interest`}>Interesse</label>
                <select id={`${uid}-interest`} value={v.interest} onChange={(e) => set('interest', e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="web">Cerne Web</option>
                  <option value="app-administracao">App Administração</option>
                  <option value="app-operacao">App Operação</option>
                  <option value="demonstracao">Demonstração</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>
            <label className="consent">
              <input type="checkbox" checked={v.consent} onChange={(e) => { set('consent', e.target.checked); setErrors((x) => ({ ...x, consent: validators.consent(e.target.checked) })) }} aria-invalid={Boolean(errors.consent)} />
              <span>Concordo em receber contato da GB Agritech, conforme a Política de Privacidade (LGPD).</span>
            </label>
            {errors.consent && <span className="err" style={{ marginTop: -8, marginBottom: 10 }}>{errors.consent}</span>}
            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Enviando…' : 'Entrar na lista'}</button>
              <button className="btn btn-ghost" type="button" disabled={status === 'loading'} onClick={(e) => onSubmit(e, 'demonstracao')}>Prefiro agendar demonstração</button>
            </div>
            {status === 'error' && <p className="form-msg bad" role="alert">Não foi possível enviar agora. Tente novamente em instantes.</p>}
          </form>
        )}
      </div>
    </section>
  )
}

/* ───────────────────────── 10 · Dúvidas ───────────────────────── */
const FAQ = [
  { q: 'O Cerne já está disponível?', a: 'O Cerne Web está disponível. Os apps de Administração e Operação estão em construção e em fase de teste.', tbd: true },
  { q: 'Como funciona o teste?', a: 'Entre na lista de espera ou agende uma demonstração com a nossa equipe.', tbd: true },
  { q: 'Quanto custa?', a: 'Os valores dependem do tamanho da operação. Fale com a nossa equipe.', tbd: true },
  { q: 'Serve para a minha operação?', a: 'O Cerne atende pecuária de corte, confinamento e agricultura.', tbd: true },
]

export function FaqSection() {
  return (
    <section className="sec sec-light faq" id="duvidas" aria-labelledby="duvidas-title">
      <div className="wrap faq-inner">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">Dúvidas</span>
          <h2 id="duvidas-title">O que mais perguntam.</h2>
        </header>
        <div className="faq-list">
          {FAQ.map((f) => (
            <details key={f.q} data-reveal>
              <summary>{f.q}</summary>
              <p>{f.a} {f.tbd && <Tbd />}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Rodapé ───────────────────────── */
export function Footer() {
  return (
    <footer className="footer" data-header-dark>
      <div className="wrap footer-inner">
        <div>
          <img src="/logo-white.svg" alt="Cerne" height={28} />
          <p>uma solução GB Agritech</p>
        </div>
        <nav aria-label="Rodapé">
          <a href="#sistema">Sistema</a><a href="#edicoes">Edições</a><a href="#perfis">Perfis</a><a href="#duvidas">Dúvidas</a>
        </nav>
        <div className="legal">
          <a href="https://gbagritech.com.br" target="_blank" rel="noreferrer">gbagritech.com.br</a>
          <a href="#contato">Política de Privacidade <Tbd>link</Tbd></a>
        </div>
      </div>
    </footer>
  )
}
