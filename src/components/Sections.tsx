import { asset } from '../lib/assets'
import { Suspense, lazy, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { maskPhone, submitLead, validators, whatsappHref, type Status } from '../lib/form'
import { gsap, shouldSkipScrub } from '../lib/scroll'
import { useAfterFirstScroll, useNear } from '../lib/defer'
import { MaskedHeading } from './fx/MaskedHeading'
import { StrokeText } from './fx/StrokeText'
import { AccordionGallery, type GalleryItem } from './fx/AccordionGallery'
import { FolderFloat } from './fx/FolderFloat'
import { CardSwap, type SwapItem } from './fx/CardSwap'
import { ScrubCanvas, type ScrubHandle } from './ScrubCanvas'
import { prefersHd, supportsAvif } from '../lib/stage'
import {
  BarnsIcon, Invoice01Icon, TractorIcon, WarehouseIcon, ArrowRight01Icon, Building02Icon, Calculator01Icon, Chart01Icon, Chat01Icon, HistoryIcon, Icon, PlusIcon, QrCodeIcon,
  SecurityLockIcon, Tick02Icon, WeightScale01Icon,
} from '../lib/icons'

// a maquete (arte de ~450 KB) só baixa quando a seção chega perto da tela
const FazendaCerne = lazy(() => import('../figures/fazenda/FazendaCerne').then((m) => ({ default: m.FazendaCerne })))

// curvas de nível (WebGL) só baixam quando o Trailer chega perto da tela e só em desktop com movimento permitido
const Topography = lazy(() => import('./fx/Topography'))
const TOPO_MQ = '(min-width: 961px) and (prefers-reduced-motion: no-preference)'

const Tbd = ({ children = 'a validar' }: { children?: string }) => <span className="tbd">{children}</span>

/* ───────────────────────── 03 · Problema → virada (scroll expand) ───────────────────────── */
// Palco fixo no desktop: a dor (planilha, caderno e conversa) em volta de uma janelinha com o Cerne em funcionamento.
// Conforme a rolagem, a janela cresce até a tela inteira (inspirado no ScrollExpand do React Bits), empurrando as três
// peças para fora, e o Cerne ocupa tudo: o título da virada e as frentes entram por cima do sistema em movimento.
// No celular e com movimento reduzido nada fica fixo: a dor, a janela do sistema e o texto da virada empilham.
const PROBLEM_PIN = '(min-width: 961px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)'

const PLANILHA = [
  ['Lote', 'Curral', 'Cab.', 'Peso (kg)', 'GMD'],
  ['L-07', 'C4', '84', '412,5', '1,38'],
  ['L-12', 'C7', '86?', '398,0', '#REF!'],
  ['L-15', 'C2', '120', '455,2', '1,52'],
  ['L-18', 'C9', '64', '371,8', '1,21'],
  ['L-21', 'C3', '—', '', '1,4'],
]
const CONVERSA = [
  { de: 'João Oliveira', cor: '#1f7aec', t: 'Quantos bois no curral 7?', h: '06:42' },
  { de: null, cor: '', t: 'Acho que 84, vou confirmar', h: '06:45' },
  { de: 'Marcos · trato', cor: '#c2410c', t: 'Ração acabou no silo 2. Alguém pediu?', h: '06:51' },
  { de: 'João Oliveira', cor: '#1f7aec', t: 'Manda foto da planilha 🙏', h: '06:52' },
]
const FRENTES_VIRADA = [
  { i: BarnsIcon, t: 'Rebanho e confinamento' },
  { i: TractorIcon, t: 'Lavoura' },
  { i: WarehouseIcon, t: 'Estoque e compras' },
  { i: Invoice01Icon, t: 'Fiscal' },
  { i: Chart01Icon, t: 'Financeiro e custo' },
]

export function ProblemSection() {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const media = useAfterFirstScroll()

  // o vídeo do sistema toca só enquanto a seção está na tela (e nunca sozinho com movimento reduzido)
  useEffect(() => {
    const v = video.current
    if (!v) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; if (!reduced) void v.play().catch(() => {}) } else v.pause()
    }, { threshold: 0.25 })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(PROBLEM_PIN, () => {
      const rootEl = root.current!
      const q = (sel: string) => rootEl.querySelector(sel)
      // as três peças ficam juntas no centro (sem a janela do sistema à mostra); a janela nasce atrás delas, no mesmo ponto
      gsap.set('.vira-art .layer', { xPercent: -50, yPercent: -50 })
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: rootEl, start: 'top top', end: '+=300%', pin: true, scrub: 0.6, refreshPriority: 6, invalidateOnRefresh: true },
      })
      void q
      const vw = () => window.innerWidth, vh = () => window.innerHeight
      // 0 → 1 = toda a duração
      tl.fromTo('.vira-art .layer-a', { x: () => -vw() * 0.17, y: () => -vh() * 0.02, rotate: -7, scale: 1 }, { x: 0, y: 0, rotate: -3, scale: 0.7, duration: 0.3 }, 0)
        .fromTo('.vira-art .layer-b', { x: () => vw() * 0.17, y: () => -vh() * 0.06, rotate: 6, scale: 1 }, { x: 0, y: 0, rotate: 3, scale: 0.7, duration: 0.3 }, 0)
        .fromTo('.vira-art .layer-c', { x: 0, y: () => vh() * 0.07, rotate: -2, scale: 1 }, { x: 0, y: 0, rotate: 0, scale: 0.7, duration: 0.3 }, 0)
        .to('.vira-copy', { autoAlpha: 0, y: -70, ease: 'power2.in', duration: 0.2 }, 0.06)
        // a janela do Cerne cresce do centro até a tela inteira, e as peças são absorvidas por ela
        .fromTo('.vira-frame', { clipPath: 'inset(63% 50% 37% 50% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.5 }, 0.2)
        .fromTo('.vira-media', { scale: 1.35 }, { scale: 1, duration: 0.5 }, 0.2)
        // as três peças saem logo que a janela nasce (não ficam por cima do que cresce ao fundo)
        .to('.vira-art .layer', { scale: 0.5, autoAlpha: 0, ease: 'power1.out', stagger: 0.015, duration: 0.1 }, 0.2)
        // o sistema ocupa a tela: véu escuro para o texto, título da virada e as frentes entrando uma a uma
        .fromTo('.vira-scrim', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none' }, 0.5)
        .fromTo('.vira-final-head', { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power3.out' }, 0.62)
        .fromTo('.vira-chips li', { autoAlpha: 0, y: 26, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.1, ease: 'back.out(1.6)', stagger: 0.04 }, 0.74)
        .set({}, {}, 1)
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className="sec sec-light problem vira" id="problema" aria-labelledby="problema-title">
      <div className="vira-stage">
        <header className="vira-copy sec-head center">
          <span className="eyebrow">O ponto de partida</span>
          <h2 id="problema-title">Planilha aqui, caderno ali, WhatsApp no meio.</h2>
          <p className="sec-lead">Quando a informação está espalhada, a decisão chega atrasada e o custo aparece só no fim do mês.</p>
          <ol className="pains">
            <li><b>01</b> Número diferente em cada controle.</li>
            <li><b>02</b> O que o campo anota demora a chegar ao escritório.</li>
            <li><b>03</b> Resultado por lote ou curral só no fechamento, se der.</li>
          </ol>
        </header>

        {/* a janela do Cerne: pequena no início e tela cheia no fim (clip-path animado) */}
        <div className="vira-frame">
          <video ref={video} className="vira-media" muted loop playsInline preload="none" poster={media ? asset('/video/system-loop-poster.webp') : undefined} aria-label="Cerne Web em funcionamento: painéis, rebanho, custos e financeiro">
            <source src={asset('/video/system-loop.webm')} type="video/webm" />
            <source src={asset('/video/system-loop.mp4')} type="video/mp4" />
          </video>
          <div className="vira-scrim" aria-hidden="true" />
        </div>

        <div className="vira-art" aria-hidden="true">
          <div className="layer layer-a">
            <div className="xl-bar"><i className="xl-ico">X</i>controle_rebanho_v7_FINAL(2).xlsx</div>
            <table className="sheet">
              <thead><tr><th /><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th></tr></thead>
              <tbody>
                {PLANILHA.map((row, r) => (
                  <tr key={r} className={r === 0 ? 'hd' : ''}>
                    <th>{r + 1}</th>
                    {row.map((c, k) => <td key={k} className={c === '#REF!' ? 'err' : c.endsWith('?') ? 'warn' : ''}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="xl-tabs"><span className="on">Rebanho</span><span>Trato</span><span>Cópia de Rebanho</span></div>
          </div>
          <div className="layer layer-b">
            <div className="spiral">{Array.from({ length: 14 }, (_, i) => <i key={i} />)}</div>
            <div className="notebook">
              <p className="nb-date">Seg, 15/09 · trato</p>
              <p>Curral 4: trato 6h30 <s>7h</s></p>
              <p>Lote 12: pesar sexta</p>
              <p>Ração: pedir 8 t (silo 2)</p>
              <p>Vacina L-15: ver c/ João</p>
              <p className="nb-note">84 ou 86 no C7??</p>
            </div>
          </div>
          <div className="layer layer-c">
            <div className="wa-bar">
              <span className="wa-av">FS</span>
              <span className="wa-tt"><b>Fazenda São Pedro</b><small>João, Marcos, Silvio, você</small></span>
            </div>
            <div className="chat">
              {CONVERSA.map((m, i) => (
                <p key={i} className={m.de ? 'in' : 'out'}>
                  {m.de && <b style={{ color: m.cor }}>{m.de}</b>}
                  {m.t}<small>{m.h}{!m.de && <em> ✓✓</em>}</small>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="vira-final">
          <header className="vira-final-head">
            <span className="eyebrow">A virada</span>
            <h2>O Cerne junta tudo em um lugar.</h2>
            <p className="sec-lead">Cada nota, pesagem e compra entra uma vez e já aparece no custo, no estoque e no DRE. No navegador hoje, com os apps de escritório e de campo a caminho.</p>
          </header>
          <ul className="vira-chips">
            {FRENTES_VIRADA.map((f) => <li key={f.t}><Icon icon={f.i} size={20} />{f.t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── 04 · Trailer ───────────────────────── */
// as cinco telas que passam na pilha (a cada 3 s); imagens já usadas no resto da página
const TELAS: SwapItem[] = [
  { key: 'geral', title: 'Visão geral', desc: 'Indicadores da fazenda num painel só.', src: '/screens/visao-geral.webp', alt: 'Cerne Web: painel Visão geral' },
  { key: 'pecuaria', title: 'Pecuária de corte', desc: 'Rebanho, composição e manejos do período.', src: '/screens/pecuaria.webp', alt: 'Cerne Web: painel Pecuária de corte' },
  { key: 'lotacao', title: 'Lotação de currais', desc: 'Quem está onde e o que precisa de atenção.', src: '/screens/lotacao-currais.webp', alt: 'Cerne Web: lotação de currais' },
  { key: 'custos', title: 'Custos do confinamento', desc: 'Custo por arroba, por animal/dia e COE, sem esperar o fechamento.', src: '/screens/custos-confinamento.webp', alt: 'Cerne Web: custos do confinamento' },
  { key: 'financeiro', title: 'Financeiro', desc: 'Receitas, despesas, atrasados e orçado × realizado.', src: '/screens/financeiros.webp', alt: 'Cerne Web: financeiro' },
]

export function TrailerSection() {
  const media = useAfterFirstScroll()

  return (
    <section className="sec sec-deep trailer" id="trailer" aria-labelledby="trailer-title" data-header-dark>
      <div className="wrap">
        <header className="sec-head center" data-reveal>
          <span className="eyebrow">O sistema em funcionamento</span>
          <h2 id="trailer-title">Veja o Cerne por dentro.</h2>
          <p className="sec-lead">Telas reais do Cerne Web, com dados de demonstração.</p>
        </header>
        <div data-reveal>
          <CardSwap label="Telas do Cerne Web" interval={3000} items={TELAS.map((t) => ({ ...t, src: media && t.src ? asset(t.src) : undefined }))} />
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── 05 · Sistema (módulos) ───────────────────────── */
// frentes com tela real entram na galeria de painéis; as sem tela viram pastas que soltam os subitens
type Modulo = { k: string; n: string; tag: string; t: string; d: string; feats?: string[]; img?: string; chips?: string[]; note?: string }
const MODULOS: Modulo[] = [
  { k: 'a', n: '01', tag: 'Operação', t: 'Pecuária e confinamento', d: 'Do nascimento à venda: reprodução, pesagens, sanitário, nutrição e o mapa de confinamento com currais, dietas e batidas.', feats: ['Mapa de confinamento', 'Reprodução: IATF, FIV e monta', 'Pesagem e GMD', 'Relatórios SISBOV'], img: 'lotacao-currais' },
  { k: 'b', n: '02', tag: 'Operação', t: 'Agricultura', d: 'Talhões no mapa, planejamento de safra, apontamentos, romaneios e rastreabilidade.', feats: ['Safras', 'Romaneios', 'Balança rodoviária'], img: 'talhoes' },
  { k: 'c', n: '03', tag: 'Administrativo', t: 'Suprimentos e estoque', d: 'Solicitação, cotação, aprovação, compra e recebimento, com SLA e fábrica de ração.', feats: ['Cotação via link', 'Aprovação de compras', 'Fábrica de ração'], img: 'suprimentos' },
  { k: 'd', n: '04', tag: 'Administrativo', t: 'Financeiro e ativos', d: 'Contas a pagar e receber, conciliação OFX, DRE e depreciação.', feats: ['Conciliação bancária', 'DRE', 'Orçado × realizado'], img: 'financeiros' },
  { k: 'e', n: '05', tag: 'Base', t: 'Cadastros', d: 'A base única que todas as frentes usam.', chips: ['Fazendas', 'Safras', 'Produtos', 'Pessoas', 'Perfis de acesso'], note: 'Cada frente lê o mesmo cadastro: um produto, uma pessoa, uma fazenda, um só lugar.' },
  { k: 'g', n: '06', tag: 'Fiscal', t: 'Fiscal do produtor', d: 'Notas e livros emitidos de dentro da operação, prontos para o contador.', chips: ['NF-e', 'CT-e', 'MDF-e', 'DF-e e manifestação', 'LCDPR', 'Exportação Domínio'], note: 'A pesagem da balança já pode virar NF-e, sem redigitar.' },
  { k: 'h', n: '07', tag: 'Gestão', t: 'Frota e pessoal', d: 'Máquinas, equipes e ordens de serviço no mesmo cadastro da fazenda.', chips: ['Manutenção preventiva', 'Abastecimentos', 'Ordens de serviço', 'Faltas e adiantamentos', 'Apuração mensal'], note: 'O custo da máquina e da mão de obra cai no centro de custo certo.' },
  { k: 'f', n: '08', tag: 'Gestão', t: 'Dashboards e relatórios', d: '115 relatórios em PDF e Excel e 10 painéis prontos, sem montar planilha.', feats: ['Visão geral', 'Custos do confinamento', 'Pecuária de corte', 'Financeiro', 'Pluviometria'], img: 'custos-confinamento' },
]

const GALERIA = MODULOS.filter((m) => m.img)
const PASTAS = MODULOS.filter((m) => !m.img)

// ícones das conquistas (Hugeicons, herdam a cor do medalhão)
const ICONES = {
  rastreio: QrCodeIcon,
  balanca: WeightScale01Icon,
  link: Chat01Icon,
  custo: Chart01Icon,
  fazendas: Building02Icon,
  permissao: SecurityLockIcon,
  historico: HistoryIcon,
  contador: Calculator01Icon,
}
type Conquista = { t: string; d: string; i: keyof typeof ICONES }

const DIFERENCIAIS: Conquista[] = [
  { t: 'Rastreio aberto ao comprador', d: 'Uma página pública mostra a origem do produto, a fazenda e o produtor.', i: 'rastreio' },
  { t: 'Da balança à nota', d: 'O peso do caminhão entra direto no sistema e vira romaneio e NF-e.', i: 'balanca' },
  { t: 'Cotação respondida por link', d: 'O fornecedor recebe pelo WhatsApp e preenche o preço sem precisar de login.', i: 'link' },
  { t: 'Custo e margem por lote', d: 'COE, COT e margem operacional de cada lote e talhão, fechados sem planilha paralela.', i: 'custo' },
]

/** Cada item é "conquistado" ao entrar na tela: o anel do medalhão se desenha, o selo aparece e um brilho passa pelo card.
 * Usado nos diferenciais (Sistema) e em Controle e segurança. */
function Conquistas({ items, className }: { items: Conquista[]; className?: string }) {
  const ref = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const items = Array.from(ref.current?.children ?? [])
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('is-earned')
        io.unobserve(e.target)
      })
    }, { rootMargin: '0px 0px -12% 0px' })
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return (
    <ul ref={ref} className={className}>
      {items.map((d, n) => (
        <li key={d.t} className="conq" style={{ '--n': n } as React.CSSProperties}>
          <span className="medal" aria-hidden="true">
            <svg className="medal-ring" viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" pathLength="1" /></svg>
            <Icon icon={ICONES[d.i]} size={26} className="medal-icon" />
            <i className="medal-check" />
          </span>
          <strong>{d.t}</strong>
          <span className="conq-d">{d.d}</span>
        </li>
      ))}
    </ul>
  )
}

export function SystemSection() {
  const root = useRef<HTMLElement>(null)
  const farmRef = useRef<HTMLElement>(null)
  const farmNear = useNear(farmRef, '150% 0px')
  const media = useAfterFirstScroll()
  return (
    <>
      <section ref={farmRef} className="sec sec-light farm" id="sistema" aria-labelledby="sistema-title" style={(farmNear ? { '--farm-bg': `url(${asset('/frames/sistema-bg.webp')})`, '--farm-bg-m': `url(${asset('/frames/sistema-bg-mobile.webp')})` } : undefined) as unknown as React.CSSProperties}>
        <div className="wrap farm-head">
          <header className="sec-head" data-reveal>
            <span className="eyebrow">O sistema</span>
            <h2 id="sistema-title">A fazenda inteira, num só cadastro.</h2>
            <p className="sec-lead">Cada operação do campo vira um registro, e o escritório acompanha tudo no mesmo lugar. Clique em um setor para ver o que o Cerne faz ali.</p>
          </header>
        </div>
        {farmNear ? (
          <Suspense fallback={<div className="fz-placeholder" />}><FazendaCerne /></Suspense>
        ) : <div className="fz-placeholder" />}
      </section>
    <section ref={root} className="sec sec-light system" id="modulos" aria-labelledby="modulos-title">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">Os módulos</span>
          <h2 id="modulos-title">Oito frentes. Um só cadastro.</h2>
          <p className="sec-lead">Os módulos que já estão no menu do Cerne Web, da porteira ao contador.</p>
        </header>
        <div data-reveal>
          <AccordionGallery label="Módulos com tela" items={GALERIA.map((m): GalleryItem => ({ key: m.k, n: m.n, tag: m.tag, title: m.t, desc: m.d, feats: m.feats, src: media ? asset(`/screens/${m.img}.webp`) : undefined }))} />
        </div>
        <div className="folders">
          {PASTAS.map((m) => (
            <article key={m.k} className="cell folder" data-reveal>
              <div className="cell-top"><span className="cell-n">{m.n}</span><span className="cell-tag">{m.tag}</span></div>
              <h3>{m.t}</h3>
              <p>{m.d}</p>
              <FolderFloat items={m.chips!} />
              {m.note && <p className="base-note"><i aria-hidden="true" />{m.note}</p>}
            </article>
          ))}
        </div>
        <div className="diferenciais">
          <h3 className="dif-title" data-reveal>Diferenciais</h3>
          <Conquistas items={[...DIFERENCIAIS, ...CONFIANCA]} />
        </div>
      </div>
    </section>
    </>
  )
}

/* ───────────────────────── 06 · Edições ───────────────────────── */
const EDICOES: GalleryItem[] = [
  { key: 'web', n: '01', tag: 'Disponível hoje', title: 'Cerne Web', desc: 'Disponível hoje no navegador: 11 módulos, 115 relatórios, fiscal e financeiro integrados. Instalável como app.', src: '/screens/visao-geral.webp', alt: 'Cerne Web: painel Visão Geral', cta: { label: 'Agendar demonstração', href: '#contato', interest: 'demonstracao', primary: true } },
  { key: 'adm', n: '02', tag: 'Em teste', title: 'Cerne Administração', desc: 'Para gestores e escritório: resultado, rebanho e ordens de serviço.', src: '/screens/app-administracao.webp', alt: 'App Administração: visão geral de rebanho e confinamento', phone: true, cta: { label: 'Entrar na lista de testes', href: '#contato', interest: 'app-administracao' } },
  { key: 'op', n: '03', tag: 'Em teste', title: 'Cerne Operação', desc: 'Para o campo: minhas ordens, trato, cocho, pesagem e sanitário.', src: '/screens/app-operacao.webp', alt: 'App Operação: ordem de serviço de vacinação do Lote 12', phone: true, cta: { label: 'Entrar na lista de testes', href: '#contato', interest: 'app-operacao' } },
]

export function EditionsSection() {
  const media = useAfterFirstScroll()
  return (
    <section className="sec sec-light editions" id="edicoes" aria-labelledby="edicoes-title">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">Como usar</span>
          <h2 id="edicoes-title">Um sistema. Três formas de usar.</h2>
        </header>
        <div data-reveal>
          <AccordionGallery large label="Edições do Cerne" items={EDICOES.map((e): GalleryItem => ({ ...e, src: media && e.src ? asset(e.src) : undefined }))} />
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
/** Onde cada passo acende (fração do scroll): OS já no celular, leitura de cocho, subida sobre o corredor, escritório. */
const PASSO_EM = [0, 0.05, 0.27, 0.74]
/** O plano termina aqui; o resto do scroll segura o escritório com o cartão do gestor. */
const PLANO_FIM = 0.9
const PIN_MQ = '(prefers-reduced-motion: no-preference)'

type PerfisManifest = { count: number; width: number; height: number }

/**
 * Plano contínuo em tela cheia: leitura de cocho com a OS no celular -> a câmera sobe acima do corredor de trato
 * (confinamento, escritório, silos, caminhão carregando) -> voa por ele, entra pela fachada de vidro e chega ao
 * gestor. Desktop e mobile têm planos próprios (16:9 e 9:16), com o mesmo percurso. Textos em vidro
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
  // celular: plano 9:16 próprio; desktop a partir de 1200 px reais com boa rede: HD 1920 px (a seção ocupa a tela
  // inteira, então o 1280 px já perde nitidez em ~1400 px); a partir de 2200 px reais: 2k (2560 px), para ler o app
  // e o painel em monitor grande; demais: 1280 px. AVIF sempre que houver suporte
  const [variant] = useState(() => (mobile ? 'mobile' : prefersHd(2200) ? 'desktop-2k' : prefersHd(1200) ? 'desktop-hd' : 'desktop'))
  const [ext] = useState(() => (supportsAvif() ? 'avif' : 'webp') as 'avif' | 'webp')
  const [m, setM] = useState<PerfisManifest | null>(null)
  // pasta versionada: o R2 serve os quadros como immutable (1 ano), então um plano novo vai para uma pasta nova
  const dir = asset(`/frames/perfis-v4/${variant}`)

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
          trigger: root.current, start: 'top top', end: '+=280%', pin: true, scrub: 0.5, refreshPriority: 4,
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
            <span className="pf-kicker">Campo</span>
            <h3>Quem está no curral</h3>
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
            <span className="pf-kicker">Escritório</span>
            <h3>Quem decide no escritório</h3>
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

/* ───────────────────────── GB Twin ───────────────────────── */
const TWIN_ITENS = ['Censo de copas por pivô', 'Mapa do censo em células de 20 m', 'Calibração por amostra de campo', 'Busca e controle de falhas']

export function TwinSection() {
  const root = useRef<HTMLElement>(null)
  const near = useNear(root, '60% 0px')
  // relevo em WebGL só em tela larga, com movimento permitido; senão fica o fundo estático de anéis
  const [topo] = useState(() => window.matchMedia(TOPO_MQ).matches && !shouldSkipScrub())
  const wa = whatsappHref('Olá! Quero conhecer o GB Twin.')
  return (
    <section ref={root} className="twin" id="twin" aria-labelledby="twin-title" data-header-dark>
      <div className="twin-terrain" aria-hidden="true">
        {topo && near && <Suspense fallback={null}><Topography /></Suspense>}
      </div>
      <div className="twin-grid">
        <figure className="twin-figure" data-reveal>
          <span className="twin-glow" aria-hidden="true" />
          <img src={asset('/frames/twin-drone.webp')} alt="Drone sobrevoando a lavoura com o mapa de copas do GB Twin no tablet" width={1200} height={1007} loading="lazy" decoding="async" />
        </figure>
        <div className="twin-copy">
          <span className="eyebrow">GB Twin</span>
          <MaskedHeading id="twin-title" text="Cada pé da lavoura, contado do alto." />
          <p className="twin-lead">O drone sobrevoa o pivô e o GB Twin conta os pés no ortomosaico, confere por amostra e emite o laudo. Você vê a falha onde ela está, não na média.</p>
          <ul className="twin-list">
            {TWIN_ITENS.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <dl className="twin-stats">
            <div><dt>Copas</dt><dd><StrokeText>120.855</StrokeText></dd></div>
            <div><dt>Estande</dt><dd><StrokeText>3.568</StrokeText><small>/ha</small></dd></div>
            <div><dt>Aproveitamento</dt><dd><StrokeText>86%</StrokeText></dd></div>
          </dl>
          <p className="twin-note">Pivô 02, dados de demonstração. <Tbd>disponibilidade a validar</Tbd></p>
          <div className="twin-cta">
            <a className="btn btn-light" href={wa ?? '#contato'} data-interest="gb-twin" {...(wa ? { target: '_blank', rel: 'noreferrer' } : {})}>{wa ? 'Falar sobre o GB Twin no WhatsApp' : 'Quero conhecer o GB Twin'}</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Controle e segurança (dentro do Sistema) ───────────────────────── */
const CONFIANCA: Conquista[] = [
  { t: 'Multifazenda e multiempresa', d: 'Cada fazenda com seus dados, todas na mesma visão.', i: 'fazendas' },
  { t: 'Permissões por ação', d: 'Perfis de acesso e autorizadores para cada compra.', i: 'permissao' },
  { t: 'Histórico de alterações', d: 'Logs do sistema e atividades recentes por fazenda.', i: 'historico' },
  { t: 'Seu contador conectado', d: 'Exportação para o Domínio: bancário, folha, pagar e receber.', i: 'contador' },
]
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
    const results = [check('name'), check('email'), check('whatsapp'), check('consent')]
    if (!results.every(Boolean)) {
      document.getElementById([`${uid}-name`, `${uid}-email`, `${uid}-whatsapp`, `${uid}-consent`][results.indexOf(false)])?.focus()
      return
    }
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
          <span className="eyebrow">Acesso antecipado</span>
          <MaskedHeading id="contato-title" text="Esteja entre os primeiros a usar o Cerne." />
          <p className="sec-lead">Receba acesso na primeira hora do lançamento, acompanhe os apps e agende uma demonstração com a nossa equipe.</p>
          <button type="button" className="btn btn-ghost whats" disabled>Falar agora no WhatsApp <Tbd>número a definir</Tbd></button>
        </header>

        {status === 'success' ? (
          <div className="form big" role="status" data-reveal>
            <h3>Pronto, seu acesso está reservado.</h3>
            <p className="sub show">Você será avisado na primeira hora do lançamento, pelo e-mail ou WhatsApp informado.</p>
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
                  <option value="gb-twin">GB Twin</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
            </div>
            <label className="consent">
              <input id={`${uid}-consent`} type="checkbox" checked={v.consent} onChange={(e) => { set('consent', e.target.checked); setErrors((x) => ({ ...x, consent: validators.consent(e.target.checked) })) }} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? `${uid}-consent-e` : undefined} />
              <span>Concordo em receber contato da GB Agritech, conforme a Política de Privacidade (LGPD).</span>
            </label>
            {errors.consent && <span className="err err-consent" id={`${uid}-consent-e`}>{errors.consent}</span>}
            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Enviando…' : 'Quero acesso antecipado'}</button>
              <button className="btn btn-ghost" type="button" disabled={status === 'loading'} onClick={(e) => onSubmit(e, 'demonstracao')}>Agendar demonstração</button>
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
  { q: 'Serve para a minha operação?', a: 'O Cerne atende pecuária de corte (cria, recria e engorda), confinamento e agricultura, com custo e margem por lote e por talhão. Na lavoura há safra, talhões no mapa, planejamento, apontamentos de máquina, colheita, romaneio e rentabilidade por cultura.' },
  { q: 'O Cerne emite nota fiscal?', a: 'Sim. NF-e, CT-e e MDF-e, com consulta e manifestação de DF-e, NFS-e recebidas e o LCDPR (Livro Caixa Digital do Produtor Rural). Também tem partida dobrada, para o fiscal e o contábil fecharem com o mesmo lançamento.' },
  { q: 'Meu contador usa o Domínio. Integra?', a: 'Sim. O Cerne exporta movimento bancário, folha, contas a pagar e receber e NFS-e para o Domínio.' },
  { q: 'Tenho mais de uma fazenda ou CNPJ. Funciona?', a: 'Sim. O Cerne é multifazenda e multiempresa: dados separados por fazenda, com visão consolidada e transferências de animais, lotes e estoque entre elas.' },
  { q: 'Controla compras e estoque?', a: 'Sim. A compra segue o caminho solicitação, cotação, autorização, compra e recebimento, com prazo (SLA) e ranking de fornecedores. O fornecedor responde a cotação por um link, inclusive pelo WhatsApp. A nota de entrada alimenta o estoque, com saldo por armazém e transferência entre armazéns e fazendas.' },
  { q: 'Tem integração com balança?', a: 'Sim. A pesagem rodoviária registra o caminhão no sistema e a NF-e pode ser emitida a partir da pesagem. Há romaneio, contratos de venda e tabelas de desconto e classificação.' },
  { q: 'Concilia o extrato do banco?', a: 'Sim. O Cerne importa o extrato em OFX, concilia mês a mês e permite congelar os meses já fechados. Junto vêm contas a pagar e a receber, DRE, fluxo de caixa e previsto × realizado.' },
  { q: 'Mostra o custo e a margem de cada lote?', a: 'Sim. COE × COT e margem operacional, com custeio por lote, animal, área e módulo, DRE e rateio por centro de custo. Cada nota, pesagem e compra entra uma vez e já aparece no custo.' },
  { q: 'Quais relatórios já vêm prontos?', a: '115 relatórios em PDF e Excel e 10 painéis, entre eles pecuária de corte, financeiro, suprimentos, confinamento, pluviômetro, ativos e depreciação.' },
  { q: 'Cobre reprodução e sanitário?', a: 'Sim. IATF, FIV e monta natural, estação de monta, diagnóstico de gestação, desmama, vacinas e sanitário por animal ou lote, ficha e histórico de cada animal e relatórios para o SISBOV.' },
  { q: 'Dá para rastrear o produto até o comprador?', a: 'Sim. Cada produto rastreado ganha uma página pública, aberta por código, e a fazenda pode ter o seu próprio site.' },
  { q: 'Consigo controlar quem faz o quê?', a: 'Sim. Há perfis e permissões por ação, autorizadores de compra, histórico de cada alteração (logs) e atividades recentes. O sistema tem português, inglês e espanhol.' },
  { q: 'E frota, equipe e ordens de serviço?', a: 'Estão no mesmo cadastro: manutenção preventiva, abastecimento e transferência de máquinas; faltas, adiantamentos e apuração mensal da equipe; e ordens de serviço com monitoramento e avaliação.' },
  { q: 'Consigo começar com os dados que já tenho?', a: 'Sim. Dá para lançar saldos iniciais e importar extratos OFX e planilhas, como orçamento e correção de estoque.' },
  { q: 'Funciona no celular?', a: 'O Cerne Web roda no navegador e pode ser instalado como app. Os apps de campo e de gestão estão em teste.' },
  { q: 'Como funciona o teste?', a: 'Garanta o acesso antecipado ou agende uma demonstração com a nossa equipe.', tbd: true },
  { q: 'Quanto custa?', a: 'Os valores dependem do tamanho da operação. Fale com a nossa equipe.', tbd: true },
]

// perguntas agrupadas por tema (as respostas ficam em FAQ acima); as três primeiras abrem sozinhas
const FAQ_GRUPOS = [
  { t: 'Produto', qs: ['O Cerne já está disponível?', 'Serve para a minha operação?', 'Funciona no celular?', 'Quais relatórios já vêm prontos?', 'Mostra o custo e a margem de cada lote?'] },
  { t: 'Fiscal e financeiro', qs: ['O Cerne emite nota fiscal?', 'Meu contador usa o Domínio. Integra?', 'Concilia o extrato do banco?'] },
  { t: 'Operação da fazenda', qs: ['Controla compras e estoque?', 'Tem integração com balança?', 'Cobre reprodução e sanitário?', 'Dá para rastrear o produto até o comprador?', 'E frota, equipe e ordens de serviço?'] },
  { t: 'Controle e contratação', qs: ['Tenho mais de uma fazenda ou CNPJ. Funciona?', 'Consigo controlar quem faz o quê?', 'Consigo começar com os dados que já tenho?', 'Como funciona o teste?', 'Quanto custa?'] },
]
const FAQ_ABERTAS = new Set(['O Cerne já está disponível?', 'Serve para a minha operação?', 'O Cerne emite nota fiscal?'])

/* ───────────────────────── Planos (comparativo sem preço) ───────────────────────── */
// célula por plano [Pro, Deluxe, Enterprise]: 'i' incluído · 'o' opcional (contratado à parte) · 'n' não incluso · texto
type PlCel = 'i' | 'o' | 'n' | string
type PlModulo = { m: string; p: [PlCel, PlCel, PlCel]; f: string[] }
const PLANOS = [
  { k: 'pro', t: 'Pro', d: 'Gestão essencial', u: ['1 atividade', '3 usuários'] },
  { k: 'dlx', t: 'Deluxe', d: 'Gestão gerencial e de custos', u: ['2 atividades', '5 usuários'] },
  { k: 'ent', t: 'Enterprise', d: 'Operação corporativa', u: ['todas as atividades', '10 usuários'] },
]
const COMPARATIVO: { g: string; mods: PlModulo[] }[] = [
  { g: 'Base de todos os planos', mods: [
    { m: 'Financeiro e fiscal', p: ['i', 'i', 'i'], f: ['Contas a pagar e a receber, caixa e bancos', 'Emissão de NF-e, XML e LCDPR', 'Regras fiscais e acesso do contador'] },
    { m: 'Estoque, frota e bens', p: ['i', 'i', 'i'], f: ['Entrada por NF-e e DF-e, baixas e transferências', 'Saldo por armazém', 'Manutenções, abastecimentos e inventário de bens'] },
    { m: 'Cadastros, relatórios e painéis', p: ['i', 'i', 'i'], f: ['Fazendas, safras, produtos e pessoas', 'Relatórios em PDF e Excel', 'Painéis de acompanhamento e pluviometria'] },
    { m: 'Atividades', p: ['1 à escolha', '2 à escolha', 'Todas'], f: ['Pecuária: rebanho, manejo e movimentações', 'Agricultura: apontamentos e romaneios', 'Fruticultura: pomar'] },
  ] },
  { g: 'Gestão e custos', mods: [
    { m: 'Gestão gerencial e contabilidade', p: ['n', 'i', 'i'], f: ['DRE e previsto × realizado', 'Centro de custo, rateios e contratos', 'Depreciação, partida dobrada e plano de contas'] },
    { m: 'Conciliação, CT-e/MDF-e e Domínio', p: ['o', 'i', 'i'], f: ['Importação de OFX e conciliação por mês', 'Emissão e manifestação de CT-e, emissão de MDF-e', 'Exportação para o Domínio, NFS-e e CSV'] },
    { m: 'Planejamento e orçamento', p: ['o', 'i', 'i'], f: ['Planejamento agrícola e pecuário', 'Previsão orçamentária'] },
    { m: 'Pecuária avançada', p: ['o', 'i', 'i'], f: ['Reprodução: estação de monta, protocolos, genealogia', 'Confinamento: dietas, batidas, pátios e currais', 'Fábrica de ração: formulação e custo'] },
    { m: 'Balança, grãos e frutas', p: ['o', 'i', 'i'], f: ['Pesagem rodoviária, descontos e classificação', 'Contratos de venda de grãos', 'Carregamento de frutas e fechamento semanal'] },
  ] },
  { g: 'Operação corporativa', mods: [
    { m: 'Compras', p: ['o', 'o', 'i'], f: ['Solicitação e cotação com fornecedores', 'Autorização por alçada', 'Compra, recebimento, SLA e savings'] },
    { m: 'Vendas e pedidos', p: ['o', 'o', 'i'], f: ['Orçamentos e pedidos', 'Vendas e relatórios por cliente e produto'] },
    { m: 'Ordens de serviço, pessoal e documentos', p: ['o', 'o', 'i'], f: ['Ordens de serviço com monitoramento e avaliações', 'Faltas, adiantamentos, apuração e folha para o Domínio', 'Repositório de documentos com vencimentos'] },
    { m: 'Rastreabilidade', p: ['o', 'o', 'i'], f: ['Rastreio por lote', 'Página pública da fazenda'] },
    { m: 'Implantação e suporte', p: ['n', 'n', 'i'], f: ['Implantação dedicada', 'Atendimento prioritário com SLA'] },
  ] },
]
// zebra: módulos alternam o tom do fundo (as funcionalidades abertas herdam o do módulo)
const ZEBRA = new Map(COMPARATIVO.flatMap((g) => g.mods).map((x, i) => [x.m, i % 2]))
const CelPlano = ({ c }: { c: PlCel }) =>
  c === 'i' ? <span className="pl-yes"><Icon icon={Tick02Icon} size={14} strokeWidth={2.6} /><span className="sr-only">Incluído</span></span>
  : c === 'o' ? <span className="pl-opt">Opcional</span>
  : c === 'n' ? <span className="pl-no" aria-label="Não incluso">—</span>
  : <span className="pl-txt">{c}</span>

/**
 * Comparativo dos planos por módulo e funcionalidade, sem preço. No celular a tabela rola na horizontal com a
 * coluna das funcionalidades fixa, para a página não crescer em altura. Começa só com os módulos e funciona como
 * acordeão: abrir um módulo fecha o que estava aberto.
 */
export function PlansSection() {
  const scroller = useRef<HTMLDivElement>(null)
  const [shadow, setShadow] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null)
  const alterna = (m: string) => setAberto((a) => (a === m ? null : m))
  const total = COMPARATIVO.reduce((a, g) => a + g.mods.length, 0)
  const inclusos = [0, 1, 2].map((k) => COMPARATIVO.reduce((a, g) => a + g.mods.filter((x) => x.p[k] !== 'n' && x.p[k] !== 'o').length, 0))
  return (
    <section className="sec sec-light planos" id="planos" aria-labelledby="planos-title">
      <div className="wrap">
        <p className="pl-swipe" aria-hidden="true">Arraste a tabela para o lado para ver os três planos →</p>
        <div ref={scroller} className={`pl-scroll${shadow ? ' is-scrolled' : ''}`} tabIndex={0} role="region" aria-label="Comparativo de funcionalidades por plano"
          onScroll={(e) => setShadow(e.currentTarget.scrollLeft > 2)} data-reveal>
          <table className="pl-table" id="planos-tabela">
            <thead>
              <tr>
                <th className="pl-fix pl-title" scope="col">
                  <h2 id="planos-title">Compare os planos, módulo a módulo</h2>
                  <p>Comece pelo essencial e some módulos quando a operação pedir.</p>
                </th>
                {PLANOS.map((p) => (
                  <th key={p.k} className={`pl-head ${p.k}`} scope="col">
                    <b>{p.t}</b><span>{p.d}</span>
                    <em>{p.u.map((x) => <i key={x}>{x}</i>)}</em>
                  </th>
                ))}
              </tr>
            </thead>
            {COMPARATIVO.map((g) => (
              <tbody key={g.g}>
                <tr className="pl-grp"><th className="pl-fix" scope="rowgroup" colSpan={1}>{g.g}</th><td colSpan={3} /></tr>
                {g.mods.flatMap((mod) => {
                  const open = aberto === mod.m
                  return [
                    <tr key={mod.m} className={`pl-mod z${ZEBRA.get(mod.m)}${open ? ' is-open' : ''}`}>
                      <th className="pl-fix" scope="row">
                        <button type="button" aria-expanded={open} onClick={() => alterna(mod.m)}>
                          <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2.2} />{mod.m}
                        </button>
                      </th>
                      {mod.p.map((c, k) => <td key={k}><CelPlano c={c} /></td>)}
                    </tr>,
                    ...(open ? mod.f.map((f) => (
                      <tr key={mod.m + f} className={`pl-feat z${ZEBRA.get(mod.m)}`}>
                        <th className="pl-fix" scope="row">{f}</th>
                        {mod.p.map((c, k) => <td key={k}><CelPlano c={c} /></td>)}
                      </tr>
                    )) : []),
                  ]
                })}
              </tbody>
            ))}
            <tfoot>
              <tr>
                <th className="pl-fix" scope="row">Módulos incluídos<small>os demais são contratados à parte ou vêm no plano de cima</small></th>
                {inclusos.map((n, k) => <td key={k}><span className="pl-txt">{n} de {total}</span></td>)}
              </tr>
              <tr className="pl-cta">
                <th className="pl-fix" scope="row" />
                {PLANOS.map((p) => <td key={p.k}><a className="btn btn-ghost" href="#contato" data-interest="demonstracao">Falar sobre o {p.t}</a></td>)}
              </tr>
              <tr className="pl-keyrow">
                <td colSpan={4}>
                  <div className="pl-legend">
                    <span><CelPlano c="i" /> Incluído</span>
                    <span><CelPlano c="o" /> Contratado à parte</span>
                    <span><CelPlano c="n" /> Não incluso</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="fineprint" data-reveal>Valores sob consulta, de acordo com o porte da fazenda (cabeças ou hectares) e o número de usuários.</p>
      </div>
    </section>
  )
}

export function FaqSection() {
  return (
    <section className="sec sec-light faq" id="duvidas" aria-labelledby="duvidas-title">
      <div className="wrap faq-inner">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">Dúvidas</span>
          <h2 id="duvidas-title">O que mais perguntam.</h2>
        </header>
        <div className="faq-list">
          {FAQ_GRUPOS.map((g) => (
            <div className="faq-group" key={g.t}>
              <h3 className="faq-group-title" data-reveal>{g.t}</h3>
              {g.qs.map((q) => {
                const f = FAQ.find((x) => x.q === q)!
                return (
                  <details key={f.q} data-reveal open={FAQ_ABERTAS.has(f.q) || undefined}>
                    <summary>{f.q}<Icon icon={PlusIcon} size={22} className="faq-plus" /></summary>
                    <p>{f.a} {f.tbd && <Tbd />}</p>
                  </details>
                )
              })}
            </div>
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
          <a href="#sistema">Sistema</a><a href="#edicoes">Edições</a><a href="#perfis">Perfis</a><a href="#planos">Planos</a><a href="#duvidas">Dúvidas</a><a href="#contato">Contato</a>
        </nav>
        <div className="legal">
          <a href="https://gbagritech.com.br" target="_blank" rel="noreferrer">gbagritech.com.br</a>
          <a href="#contato">Política de Privacidade <Tbd>link</Tbd></a>
        </div>
      </div>
    </footer>
  )
}
