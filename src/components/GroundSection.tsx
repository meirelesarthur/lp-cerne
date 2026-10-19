import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import type { HeroGeometry } from './Hero'

/**
 * 02 · Escopo. Fundo: o resto da fazenda, continuando pixel a pixel o último quadro do Hero (mesma escala e
 * posição do zoom final) e fixo (`sticky`) enquanto o conteúdo passa. No fim da seção a própria foto se
 * esmaece, de baixo para cima, até o fundo claro do resto da página.
 */
const FRENTES = [
  { t: 'Rebanho e confinamento', d: 'Do nascimento à venda: reprodução (IATF e FIV), pesagens, sanitário e mapa de confinamento.' },
  { t: 'Lavoura', d: 'Safra, talhões no mapa, apontamentos, romaneio e balança rodoviária integrada.' },
  { t: 'Suprimentos e estoque', d: 'Da solicitação ao recebimento, com aprovação, SLA de compras e fábrica de ração.' },
  { t: 'Financeiro e fiscal', d: 'Custo, DRE e conciliação bancária, com NF-e, CT-e, MDF-e e LCDPR emitidos no sistema.' },
]
const FATOS: { t: string; d: string; tbd?: boolean }[] = [
  { t: 'Multifazenda e multiempresa', d: 'Várias propriedades e CNPJs na mesma visão, com dados e permissões separados por fazenda.' },
  { t: '115 relatórios e 10 painéis', d: 'Em PDF e Excel, prontos para o gestor, o banco e o contador.' },
  { t: 'Acesse de onde estiver', d: 'No navegador hoje, instalável como app. Os apps de campo estão em teste.' },
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

  // o véu claro sobe enquanto o conteúdo sai e a próxima seção entra; a borda de baixo do véu já é o fundo
  // claro, então a foto pode continuar se esmaecendo depois de soltar o sticky sem marcar emenda
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      // o véu começa abaixo da tela (foto limpa atrás dos cards) e só sobe quando os cards já estão saindo
      gsap.fromTo('.ground-veil', { yPercent: 52 }, {
        yPercent: -36, ease: 'none',
        scrollTrigger: { trigger: '.fatos', start: 'top 42%', endTrigger: root.current, end: 'bottom 92%', scrub: true },
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
          <h2 id="escopo-title">Uma fazenda, um cadastro, nenhuma planilha paralela.</h2>
          <p className="sec-lead">Do curral ao caixa e da lavoura à nota fiscal: o Cerne Web organiza a rotina de quem decide.</p>
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
