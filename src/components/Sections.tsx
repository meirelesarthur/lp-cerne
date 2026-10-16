import { asset } from '../lib/assets'
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { FazendaCerne } from '../figures/fazenda/FazendaCerne'
import { maskPhone, submitLead, validators, type Status } from '../lib/form'
import { gsap } from '../lib/scroll'
import { useAfterFirstScroll, useNear } from '../lib/defer'
import { ScrubCanvas, type ScrubHandle } from './ScrubCanvas'
import { prefersHd, supportsAvif } from '../lib/stage'

const Tbd = ({ children = 'a validar' }: { children?: string }) => <span className="tbd">{children}</span>

/* ───────────────────────── 03 · Problema → Cerne ───────────────────────── */
// Palco fixo no desktop: (A) a dor, com planilha, caderno e conversa; o texto sobe e some, as três peças vão para o
// centro, caem num funil e entram na tela do notebook; (B) a virada, com o produto inteiro (notebook e os dois apps).
// No celular e com movimento reduzido as duas etapas ficam empilhadas e o funil não aparece.
const PROBLEM_PIN = '(min-width: 961px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)'
// ponto da tela do notebook (fração da figura) onde o sistema "nasce"; o pulso usa o mesmo ponto no CSS
const SCREEN_AT = { x: 0.4, y: 0.42 }

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

export function ProblemSection() {
  const root = useRef<HTMLElement>(null)
  const media = useAfterFirstScroll()

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(PROBLEM_PIN, () => {
      const rootEl = root.current!
      const q = <T extends Element>(sel: string) => rootEl.querySelector(sel) as T
      // posição relativa à seção (que fica fixa), medida sem transformações: offsets do layout, não do que já está animado
      const rel = (el: Element) => { const r = el.getBoundingClientRect(), b = rootEl.getBoundingClientRect(); return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height } }
      const W = () => rootEl.clientWidth, H = () => rootEl.clientHeight
      const target = () => { const f = rel(q('.product-fig')); return { x: f.x + f.w * SCREEN_AT.x, y: f.y + f.h * SCREEN_AT.y } }
      const mouth = () => ({ x: W() / 2, y: H() * 0.17, w: Math.min(W() * 0.46, 620) })
      // centro de cada peça no layout (o contêiner .layers não se move; só as peças)
      const center = (el: Element) => { const L = rel(q('.layers')), e = el as HTMLElement; return { x: L.x + e.offsetLeft + e.offsetWidth / 2, y: L.y + e.offsetTop + e.offsetHeight / 2 } }
      const cluster = () => { const L = rel(q('.layers')); return { x: L.x + L.w / 2, y: L.y + L.h / 2 } }
      const toCenter = (axis: 'x' | 'y') => () => { const c = cluster(); return axis === 'x' ? W() / 2 - c.x : H() * 0.52 - c.y }
      const toMouth = (axis: 'x' | 'y') => (i: number, el: Element) => {
        const m = mouth(), c = center(el)
        return axis === 'x' ? m.x + (i - 1) * m.w * 0.24 - c.x : m.y + 6 - c.y
      }
      const toSpout = (axis: 'x' | 'y') => (_i: number, el: Element) => { const t = target(), c = center(el); return axis === 'x' ? t.x - c.x : t.y - c.y }

      // o funil liga a boca (sob as peças) ao ponto da tela do notebook; redesenhado a cada refresh
      const drawFunnel = () => {
        const svg = q<SVGSVGElement>('.funnel'), m = mouth(), t = target(), l = m.x - m.w / 2, r = m.x + m.w / 2, d = t.y - m.y
        svg.setAttribute('viewBox', `0 0 ${W()} ${H()}`)
        const body = `M ${l} ${m.y} C ${l} ${m.y + d * 0.55}, ${t.x - 16} ${t.y - d * 0.45}, ${t.x - 16} ${t.y} L ${t.x + 16} ${t.y} C ${t.x + 16} ${t.y - d * 0.45}, ${r} ${m.y + d * 0.55}, ${r} ${m.y} Z`
        svg.querySelector('.funnel-body')!.setAttribute('d', body)
        const rim = svg.querySelector('.funnel-rim')!
        rim.setAttribute('cx', `${m.x}`); rim.setAttribute('cy', `${m.y}`); rim.setAttribute('rx', `${m.w / 2}`); rim.setAttribute('ry', `${Math.max(14, m.w * 0.05)}`)
      }
      drawFunnel()

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: rootEl, start: 'top top', end: '+=320%', pin: true, scrub: 0.6, refreshPriority: 6, invalidateOnRefresh: true, onRefresh: drawFunnel },
      })
      // 0 → 1 = toda a duração
      tl.fromTo('.layer-a', { x: -60, y: -30, rotate: -7 }, { x: 10, y: 14, rotate: -3, duration: 0.14 }, 0)
        .fromTo('.layer-b', { x: 50, y: 6, rotate: 6 }, { x: -12, y: 0, rotate: 2, duration: 0.14 }, 0)
        .fromTo('.layer-c', { x: -30, y: 50, rotate: -4 }, { x: 12, y: -30, rotate: -1.5, duration: 0.14 }, 0)
        // o texto do ponto de partida sobe e some; as três peças ocupam o meio da tela
        .to('.stage-a .problem-copy', { autoAlpha: 0, y: -140, ease: 'power2.in', duration: 0.14 }, 0.1)
        .to('.layer', { x: toCenter('x'), y: toCenter('y'), scale: 1.06, duration: 0.16 }, 0.14)
        // o mockup surge desfocado ao fundo e o funil se abre
        .fromTo('.stage-b', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.32)
        .fromTo('.product-img', { autoAlpha: 0, scale: 0.86, y: 40, rotateX: 8, transformPerspective: 1200, filter: 'blur(16px)' }, { autoAlpha: 0.45, scale: 0.94, y: 12, rotateX: 3, filter: 'blur(8px)', ease: 'power2.out', duration: 0.18 }, 0.32)
        .fromTo('.funnel', { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.1 }, 0.34)
        // as peças encolhem até a boca do funil e descem por ele até a tela do notebook
        .to('.layer', { x: toMouth('x'), y: toMouth('y'), rotate: (i: number) => (i - 1) * 8, scale: 0.34, stagger: 0.02, duration: 0.12 }, 0.4)
        .to('.layer', { x: toSpout('x'), y: toSpout('y'), rotate: 0, scale: 0.06, ease: 'power2.in', stagger: 0.03, duration: 0.12 }, 0.54)
        .to('.layer', { autoAlpha: 0, stagger: 0.03, duration: 0.03, ease: 'none' }, 0.63)
        .to('.funnel', { autoAlpha: 0, duration: 0.06 }, 0.72)
        .to('.product-img', { autoAlpha: 1, scale: 1, y: 0, rotateX: 0, filter: 'blur(0px)', ease: 'power3.out', duration: 0.16 }, 0.7)
        .fromTo('.product-pulse', { autoAlpha: 0.7, scale: 0.1 }, { autoAlpha: 0, scale: 9, ease: 'power2.out', duration: 0.22 }, 0.7)
        .fromTo('.product-head', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.8)
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
              <span className="product-pulse" aria-hidden="true" />
              {/* o elemento existe desde o início (a animação precisa dele); só o arquivo espera o primeiro scroll */}
              <img className="product-img" src={media ? asset('/mocks/cerne-produtos-recorte-1400.webp') : undefined} srcSet={media ? `${asset('/mocks/cerne-produtos-recorte-1400.webp')} 1400w, ${asset('/mocks/cerne-produtos-recorte-2400.webp')} 2400w` : undefined} sizes="(min-width: 1200px) 1100px, 92vw" width={2400} height={1461} alt="Cerne Web no notebook, com os apps Administração e Operação em dois celulares" decoding="async" />
            </figure>
          </div>
        </div>

        <svg className="funnel" aria-hidden="true">
          <defs>
            <linearGradient id="funnel-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#059669" stopOpacity=".14" />
              <stop offset="1" stopColor="#059669" stopOpacity=".42" />
            </linearGradient>
          </defs>
          <path className="funnel-body" fill="url(#funnel-fill)" stroke="#059669" strokeWidth="2" />
          <ellipse className="funnel-rim" fill="rgba(5,150,105,.10)" stroke="#059669" strokeWidth="2" />
        </svg>
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
            <video ref={video} muted loop playsInline preload="none" poster={media ? asset('/video/system-loop-poster.webp') : undefined} aria-label="Demonstração das telas do Cerne Web">
              <source src={asset('/video/system-loop.webm')} type="video/webm" />
              <source src={asset('/video/system-loop.mp4')} type="video/mp4" />
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
    <>
      <section className="sec sec-light farm" id="sistema" aria-labelledby="sistema-title" style={{ '--farm-bg': `url(${asset('/frames/sistema-bg.webp')})`, '--farm-bg-m': `url(${asset('/frames/sistema-bg-mobile.webp')})` } as React.CSSProperties}>
        <div className="wrap farm-head">
          <header className="sec-head" data-reveal>
            <span className="eyebrow">O sistema</span>
            <h2 id="sistema-title">A fazenda inteira, num só cadastro.</h2>
            <p className="sec-lead">Cada operação do campo vira um registro, e o escritório acompanha tudo no mesmo lugar. Escolha um setor.</p>
          </header>
        </div>
        <FazendaCerne />
      </section>
    <section ref={root} className="sec sec-light system" id="modulos" aria-labelledby="modulos-title">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <span className="eyebrow">Os módulos</span>
          <h2 id="modulos-title">Seis frentes. Um só cadastro.</h2>
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
                <div className="shot">{media && <img src={asset(`/screens/${m.img}.webp`)} alt="" loading="lazy" decoding="async" />}</div>
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
    </>
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
            {media && <img src={asset('/screens/visao-geral.webp')} alt="Cerne Web: painel Visão Geral" loading="lazy" />}
            <a className="btn btn-primary" href="#contato" data-interest="demonstracao">Agendar demonstração</a>
          </article>
          <article className="edition app" data-reveal>
            <span className="badge">Em construção · em teste</span>
            <h3>Cerne Administração</h3>
            <p>Para gestores e escritório: resultado, rebanho e ordens de serviço.</p>
            <div className="phone">{media && <img src={asset('/screens/app-administracao.webp')} alt="App Administração: visão geral de rebanho e confinamento" loading="lazy" decoding="async" />}</div>
            <a className="btn btn-ghost" href="#contato" data-interest="app-administracao">Quero testar</a>
          </article>
          <article className="edition app" data-reveal>
            <span className="badge">Em construção · em teste</span>
            <h3>Cerne Operação</h3>
            <p>Para o campo: minhas ordens, trato, cocho, pesagem e sanitário.</p>
            <div className="phone">{media && <img src={asset('/screens/app-operacao.webp')} alt="App Operação: ordem de serviço de vacinação do Lote 12" loading="lazy" decoding="async" />}</div>
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
  const dir = asset(`/frames/perfis/${variant}`)

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
          <span className="eyebrow">Acesso antecipado</span>
          <h2 id="contato-title">Esteja entre os primeiros a usar o Cerne.</h2>
          <p className="sec-lead">Receba acesso na primeira hora do lançamento, acompanhe os apps e agende uma demonstração com a nossa equipe.</p>
          <a className="btn btn-ghost whats" aria-disabled="true" href="#contato" onClick={(e) => e.preventDefault()}>Falar agora no WhatsApp <Tbd>número a definir</Tbd></a>
        </header>

        {status === 'success' ? (
          <div className="form big" role="status" data-reveal>
            <h3>Pronto, seu acesso está reservado.</h3>
            <p className="sub" style={{ display: 'block' }}>Você será avisado na primeira hora do lançamento, pelo e-mail ou WhatsApp informado.</p>
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
              <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Enviando…' : 'Quero acesso antecipado'}</button>
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
  { q: 'Como funciona o teste?', a: 'Garanta o acesso antecipado ou agende uma demonstração com a nossa equipe.', tbd: true },
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
