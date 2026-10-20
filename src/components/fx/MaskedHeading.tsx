import { Fragment, type ElementType } from 'react'
import { useInViewOnce } from './useInViewOnce'

/**
 * Título revelado palavra a palavra por trás de uma máscara (cada palavra sobe de dentro da própria linha), com um
 * brilho de malha verde passando pelas letras (background-clip: text). Só transform e background-position, em CSS.
 * O texto continua inteiro para leitores de tela (aria-label no título, palavras em aria-hidden).
 */
export function MaskedHeading({ as: Tag = 'h2', id, text, className = '' }: { as?: ElementType; id?: string; text: string; className?: string }) {
  const { ref, className: state } = useInViewOnce<HTMLElement>()
  return (
    <Tag ref={ref} id={id} aria-label={text} className={`fx-mh ${state} ${className}`.trim()}>
      {text.split(' ').map((w, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="fx-mh-w" aria-hidden="true"><span style={{ '--i': i } as React.CSSProperties}>{w}</span></span>
        </Fragment>
      ))}
    </Tag>
  )
}
