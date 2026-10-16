import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { onFirstInteraction } from '../lib/defer'

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

  const pumpRef = useRef<() => void>(() => {})
  useImperativeHandle(ref, () => ({
    setFrame(i) {
      current.current = Math.max(0, Math.min(count - 1, Math.round(i)))
      draw()
      pumpRef.current()
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
    // Os quadros só começam a baixar na primeira interação (ou após 10 s parado) e na ordem do que o usuário está vendo:
    // o poster/1º quadro não disputa rede com o resto da página, e quem rola rápido recebe primeiro os quadros à frente.
    const net = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const CONC = net?.saveData ? 2 : 4
    const inflight = new Set<number>()
    let started = false
    const nextMissing = () => {
      const cur = current.current
      for (let d = 0; d < count; d++) {
        const a = cur + d
        if (a < count && !frames.current[a] && !inflight.has(a)) return a
        const b = cur - d
        if (d > 0 && b >= 0 && !frames.current[b] && !inflight.has(b)) return b
      }
      return -1
    }
    const pump = () => {
      if (cancelled || !started) return
      while (inflight.size < CONC) {
        const i = nextMissing()
        if (i < 0) return
        inflight.add(i)
        load(i).then(() => { inflight.delete(i); draw(); pump() })
      }
    }
    pumpRef.current = pump
    load(0)
    const stop = onFirstInteraction(() => { started = true; pump() }, 10000)
    return () => { cancelled = true; stop(); pumpRef.current = () => {}; window.removeEventListener('resize', resize) }
  }, [dir, count, ext, poster])

  return <canvas ref={canvas} aria-hidden="true" />
})
