import { useState } from 'react'

export type GalleryItem = {
  key: string; n: string; tag: string; title: string; desc: string; feats?: string[]; src?: string
  /** texto alternativo da tela; sem ele a imagem é decorativa */
  alt?: string
  /** tela de celular: aparece dentro de uma moldura vertical, à direita da legenda */
  phone?: boolean
  cta?: { label: string; href: string; interest?: string; primary?: boolean }
}

/**
 * Painéis que se abrem ao passar o mouse, focar ou tocar: o ativo expande e mostra a tela e a legenda; os demais
 * ficam como tiras com o título na vertical. A animação é só `flex-grow` (desktop) ou `height` (celular).
 * `src` ausente (mídia ainda adiada) deixa o painel com o fundo liso, sem quebrar o layout.
 * O botão de abrir fica por baixo da legenda, para ela poder ter um link (CTA) sem aninhar controles.
 */
export function AccordionGallery({ items, label, large }: { items: GalleryItem[]; label: string; large?: boolean }) {
  const [active, setActive] = useState(0)
  return (
    <ul className={`acg${large ? ' acg-lg' : ''}`} aria-label={label}>
      {items.map((m, i) => {
        const on = i === active
        return (
          <li key={m.key} className={`acg-p${on ? ' is-on' : ''}${m.phone ? ' acg-phone' : ''}`} onMouseEnter={() => setActive(i)}>
            <div className="acg-btn">
              <span className="acg-strip" aria-hidden="true"><b>{m.n}</b><span>{m.title}</span></span>
              <span className="acg-shot">
                {m.src && (m.phone
                  ? <span className="acg-frame"><img src={m.src} alt={m.alt ?? ''} loading="lazy" decoding="async" /></span>
                  : <img src={m.src} alt={m.alt ?? ''} loading="lazy" decoding="async" />)}
              </span>
              <button type="button" className="acg-hit" aria-expanded={on} aria-label={m.title} onClick={() => setActive(i)} onFocus={() => setActive(i)} />
              <span className="acg-cap">
                <span className="cell-top"><span className="cell-n">{m.n}</span><span className="cell-tag">{m.tag}</span></span>
                <strong>{m.title}</strong>
                <span className="acg-d">{m.desc}</span>
                {m.feats && <span className="acg-feats">{m.feats.map((f) => <i key={f}>{f}</i>)}</span>}
                {m.cta && (
                  <a className={`btn ${m.cta.primary ? 'btn-primary' : 'btn-ghost'} acg-cta`} href={m.cta.href} data-interest={m.cta.interest} tabIndex={on ? 0 : -1}>{m.cta.label}</a>
                )}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
