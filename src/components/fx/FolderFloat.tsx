import { useEffect, useRef, useState } from 'react'

/** Posição final de cada nota (px a partir do centro da pasta): duas colunas, subindo; a última, se ímpar, fica ao centro. */
function notePos(i: number, n: number) {
  const row = Math.floor(i / 2), col = i % 2
  const alone = n % 2 === 1 && i === n - 1
  const x = alone ? 0 : (col ? 1 : -1) * (84 + (row % 2) * 12)
  return { '--x': `${x}px`, '--y': `${-(row * 40 + 84)}px`, '--r': `${(col ? 1 : -1) * (2 + row)}deg`, '--d': `${i * 45}ms` } as React.CSSProperties
}

/**
 * Pasta que abre no hover/foco/toque e solta os itens como notas flutuantes. Só transform e opacity, sem loop.
 * No celular abre sozinha ao rolar até ela. Com movimento reduzido, as notas ficam sempre à mostra, numa lista comum.
 */
export function FolderFloat({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  // celular (sem hover): a pasta abre sozinha quando chega ao meio da tela, uma vez; o toque continua abrindo e fechando
  useEffect(() => {
    const el = root.current
    if (!el || !window.matchMedia('(max-width: 719px)').matches) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOpen(true); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={root} className={`ff${open ? ' is-open' : ''}`}>
      <ul className="ff-notes">
        {items.map((c, i) => <li key={c} style={notePos(i, items.length)}>{c}</li>)}
      </ul>
      <button type="button" className="ff-folder" aria-expanded={open} aria-label={open ? 'Fechar itens' : 'Abrir itens'} onClick={() => setOpen((o) => !o)}>
        <span className="ff-back" aria-hidden="true" />
        <span className="ff-front" aria-hidden="true" />
      </button>
    </div>
  )
}
