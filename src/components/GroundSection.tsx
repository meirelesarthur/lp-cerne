import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import type { HeroGeometry } from './Hero'

/**
 * 02 · Escopo. Fundo: o resto da fazenda, continuando pixel a pixel o último quadro do Hero (mesma escala e
 * posição do zoom final) e fixo (`sticky`) enquanto o conteúdo passa. No fim da seção a plantação se funde
 * num verde lavoura sólido e, abaixo, um degradê leva ao tom claro do resto da página.
 */
const FRENTES = [
  { t: 'Multifazendas', d: 'Várias propriedades na mesma visão, com dados separados por fazenda.' },
  { t: 'Rebanho e confinamento', d: 'Lotes, currais, dieta, trato e leitura de cocho.' },
  { t: 'Suprimentos e estoque', d: 'Da solicitação ao recebimento, com fábrica de ração.' },
  { t: 'Financeiro e ativos', d: 'Custos, resultado e depreciação sem planilha paralela.' },
]
const FATOS = [
  { t: 'Feito para', d: 'Pecuária de corte, confinamento e agricultura.', tbd: true },
  { t: 'Acesse de onde estiver', d: 'No computador hoje. Celular e tablet com os apps em breve.' },
  { t: 'Fiscal', d: 'Emissão e obrigações fiscais integradas ao dia a dia.', tbd: true },
]

export function GroundSection({ geo }: { geo: HeroGeometry | null }) {
  const root = useRef<HTMLElement>(null)
  const g = geo?.ready ? geo.manifest.ground : undefined
  let style: React.CSSProperties | undefined
  if (geo && g) {
    const { box, zoom, vh } = geo
    const width = box.width * zoom.s
    const height = width * (g.h / g.w)
    const left = box.left + zoom.tx
    // topo do quadro final na tela menos a altura da tela: a seção começa exatamente onde o Hero termina
    const top = box.top + zoom.ty - vh
    style = { width, height, left, top }
  }

  // a plantação vai se fundindo no verde lavoura conforme a seção avança
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.ground-veil', { opacity: 0 }, {
        opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.ground-fade', start: 'top 170%', end: 'top bottom', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="ground" id="escopo" aria-labelledby="escopo-title">
      <div className="ground-bg" aria-hidden="true">
        {g && style && <img src={g.src} alt="" style={style} decoding="async" />}
        <div className="ground-shade" />
        <div className="ground-veil" />
      </div>

      <div className="ground-content">
        <header className="sec-head on-photo" data-reveal>
          <span className="eyebrow">O que o Cerne cobre</span>
          <h2 id="escopo-title">Tudo da fazenda em uma visão só.</h2>
          <p className="sec-lead">Do curral ao caixa: o Cerne Web organiza a rotina de quem decide. Os apps de campo estão em construção.</p>
        </header>

        <ul className="frentes">
          {FRENTES.map((f) => (
            <li key={f.t} className="glass-card" data-reveal>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </li>
          ))}
        </ul>

        <ul className="fatos">
          {FATOS.map((f) => (
            <li key={f.t} data-reveal>
              <h3>{f.t} {f.tbd && <span className="tbd">a validar</span>}</h3>
              <p>{f.d}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="ground-fade" aria-hidden="true" />
    </section>
  )
}
