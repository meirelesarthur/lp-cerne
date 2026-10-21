import { useState } from 'react'

export type GalleryItem = {
  key: string; n: string; tag: string; title: string; desc: string; feats?: string[]; src?: string
}

/**
 * Painéis que se abrem ao passar o mouse, focar ou tocar: o ativo expande e mostra a tela e a legenda; os demais
 * ficam como tiras com o título na vertical. A animação é só `flex-grow` (desktop) ou `height` (celular).
 * `src` ausente (mídia ainda adiada) deixa o painel com o fundo liso, sem quebrar o layout.
 */
export function AccordionGallery({ items, label }: { items: GalleryItem[]; label: string }) {
  const [active, setActive] = useState(0)
  return (
    <ul className="acg" aria-label={label}>
      {items.map((m, i) => {
        const on = i === active
        return (
          <li key={m.key} className={`acg-p${on ? ' is-on' : ''}`} onMouseEnter={() => setActive(i)}>
            <div className="acg-btn">
              <span className="acg-strip" aria-hidden="true"><b>{m.n}</b><span>{m.title}</span></span>
              <span className="acg-shot">
                {m.src && <img src={m.src} alt="" loading="lazy" decoding="async" />}
              </span>
              <button type="button" className="acg-hit" aria-expanded={on} aria-label={m.title} onClick={() => setActive(i)} onFocus={() => setActive(i)} />
              <span className="acg-cap">
                <span className="cell-top"><span className="cell-n">{m.n}</span><span className="cell-tag">{m.tag}</span></span>
                <strong>{m.title}</strong>
                <span className="acg-d">{m.desc}</span>
                {m.feats && <span className="acg-feats">{m.feats.map((f) => <i key={f}>{f}</i>)}</span>}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
