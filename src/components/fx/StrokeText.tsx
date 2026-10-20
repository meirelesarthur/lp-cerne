import { useInViewOnce } from './useInViewOnce'

/**
 * Texto que nasce só em contorno (traçado da esquerda para a direita) e depois é preenchido. Uma vez só, sem loop:
 * clip-path + cor, sem JS por quadro. Sem movimento ou sem JS, o texto aparece já preenchido.
 */
export function StrokeText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, className: state } = useInViewOnce<HTMLSpanElement>('0px 0px -8% 0px')
  return <span ref={ref} className={`fx-st ${state} ${className}`.trim()}>{children}</span>
}
