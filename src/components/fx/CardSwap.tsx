import { useEffect, useRef, useState } from 'react'

export type SwapItem = { key: string; title: string; desc: string; src?: string; alt?: string }

/**
 * Card Swap (inspirado no React Bits): telas empilhadas em 3D, centralizadas; a da frente vai para o fundo a cada
 * `interval` ms. Clicar numa tela de trás (ou numa pílula) traz aquela para a frente; clicar na da frente passa
 * para a próxima. O avanço automático para com o mouse em cima, fora da tela e com movimento reduzido.
 * Pilha 3D só em tela larga e sem movimento reduzido; fora disso aparece só a tela ativa. Só transform e opacity (CSS).
 */
export function CardSwap({ items, interval = 3000, label }: { items: SwapItem[]; interval?: number; label: string }) {
  const n = items.length
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [inView, setInView] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  // `tick` reinicia o intervalo (e a barra de progresso) a cada troca, inclusive as feitas por clique
  const [tick, setTick] = useState(0)
  const go = (i: number) => { setActive(((i % n) + n) % n); setTick((t) => t + 1) }

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const running = inView && !paused && !reduced
  useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => go(active + 1), interval)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, active, tick, interval])

  const cur = items[active]
  return (
    <div ref={root} className="cs" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <ul className="cs-stage" aria-label={label}>
        {items.map((m, i) => {
          const p = (i - active + n) % n
          return (
            <li key={m.key} className={`cs-card${p === 0 ? ' is-front' : ''}`} style={{ '--p': p, '--n': n } as React.CSSProperties}>
              <div className="browser-bar" aria-hidden="true"><i /><i /><i /><span>app.cerne.agr.br</span></div>
              <div className="cs-screen">{m.src && <img src={m.src} alt={p === 0 ? (m.alt ?? m.title) : ''} loading="lazy" decoding="async" />}</div>
              <button type="button" className="cs-hit" tabIndex={p === 0 ? 0 : -1} aria-label={p === 0 ? `Próxima tela (${m.title} está à frente)` : `Ver ${m.title}`} onClick={() => go(p === 0 ? active + 1 : i)} />
            </li>
          )
        })}
      </ul>
      <div className="cs-caption" aria-live="polite">
        <strong>{cur.title}</strong>
        <span>{cur.desc}</span>
      </div>
      <div className="cs-pills" role="group" aria-label="Telas do Cerne">
        {items.map((m, i) => (
          <button key={m.key} type="button" className={`cs-pill${i === active ? ' on' : ''}${running ? ' run' : ''}`} aria-pressed={i === active} onClick={() => go(i)} style={{ '--ms': `${interval}ms` } as React.CSSProperties}>
            <i key={i === active ? tick : 0} aria-hidden="true" />
            <span>{m.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
