import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface ScrubHandle {
  /** Desenha o quadro mais próximo já carregado. */
  setFrame(i: number): void
}

interface Props {
  dir: string
  count: number
  /** Formato dos quadros (a versão HD é AVIF). */
  ext?: 'webp' | 'avif'
  /** Imagem leve mostrada até o 1º quadro chegar (já pré-carregada no <head>). */
  poster?: string
}

const pad = (n: number) => String(n).padStart(3, '0')

/**
 * Canvas que exibe uma sequência de WebP. O primeiro quadro (poster) aparece de imediato;
 * os demais são carregados em lotes, do início ao fim, sem bloquear a thread.
 */
export const ScrubCanvas = forwardRef<ScrubHandle, Props>(function ScrubCanvas({ dir, count, ext = 'webp', poster }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const frames = useRef<(HTMLImageElement | null)[]>([])
  const current = useRef(0)
  const drawn = useRef(-1)

  const draw = () => {
    const el = canvas.current
    if (!el) return
    // quadro carregado mais próximo do alvo
    let i = current.current
    while (i > 0 && !frames.current[i]) i--
    const img = frames.current[i]
    if (!img || drawn.current === i) return
    drawn.current = i
    const ctx = el.getContext('2d')
    if (!ctx) return
    const { width: cw, height: ch } = el
    const r = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const w = img.naturalWidth * r, h = img.naturalHeight * r
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
  }

  useImperativeHandle(ref, () => ({
    setFrame(i) {
      current.current = Math.max(0, Math.min(count - 1, Math.round(i)))
      draw()
    },
  }))

  useEffect(() => {
    const el = canvas.current!
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      el.width = Math.round(el.clientWidth * dpr)
      el.height = Math.round(el.clientHeight * dpr)
      drawn.current = -1
      draw()
    }
    resize()
    window.addEventListener('resize', resize)

    let cancelled = false
    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        // decodifica já na carga (fora do caminho do scroll): o desenho do quadro fica instantâneo
        img.onload = () => {
          const done = () => {
            frames.current[i] = img
            if (i === 0) drawn.current = -1 // o quadro real substitui o poster
            if (i === current.current || i === 0) draw()
            resolve()
          }
          img.decode().then(done, done)
        }
        img.onerror = () => resolve()
        img.src = `${dir}/${pad(i + 1)}.${ext}`
      })
    if (poster) {
      const pi = new Image()
      pi.onload = () => { if (!frames.current[0]) { frames.current[0] = pi; draw() } }
      pi.src = poster
    }
    ;(async () => {
      await load(0)
      const BATCH = 6
      for (let i = 1; i < count && !cancelled; i += BATCH) {
        await Promise.all(Array.from({ length: Math.min(BATCH, count - i) }, (_, k) => load(i + k)))
        draw()
      }
    })()

    return () => { cancelled = true; window.removeEventListener('resize', resize) }
  }, [dir, count, ext, poster])

  return <canvas ref={canvas} aria-hidden="true" />
})
