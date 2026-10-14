/** Geometria da cena final do Hero (tablet gigante) e da emenda com a 2ª seção. */

export interface Rect { x: number; y: number; w: number; h: number }

/** Gerado por video/hero-a/build_v2.py junto com os quadros. Rects normalizados (0-1). */
export interface Manifest {
  count: number
  width: number
  height: number
  /** Formato dos quadros e poster leve (versão HD). */
  ext?: 'webp' | 'avif'
  poster?: string
  /** Still em alta do último quadro e a tela do tablet gigante nele. */
  final?: { src: string; fg: string; tablet: Rect }
  /** Plantação estendida para baixo e onde o quadro final está dentro dela. */
  ground?: { src: string; w: number; h: number; frame: Rect }
}

/** Suporte a AVIF (todos os navegadores atuais; Safari desde 16.4). */
export function supportsAvif() {
  const safari = /Version\/(\d+)\.(\d+).*Safari/.exec(navigator.userAgent)
  if (safari && (Number(safari[1]) < 16 || (Number(safari[1]) === 16 && Number(safari[2]) < 4))) return false
  return 'createImageBitmap' in window
}

/**
 * Quadros HD (AVIF 1920 px) só onde eles aparecem de fato e a rede aguenta: tela larga (≥ `minPx` px reais),
 * sem economia de dados, conexão 4G ou melhor, e navegador com AVIF. O resto usa a versão 1280 px.
 */
export function prefersHd(minPx = 1600) {
  if (window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) < minPx) return false
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (c?.saveData || (c?.effectiveType && c.effectiveType !== '4g')) return false
  return supportsAvif()
}

export interface Box { left: number; top: number; width: number; height: number }
export interface Zoom { s: number; tx: number; ty: number }

/** Caixa do quadro com `object-fit: cover` dentro de (vw, vh). */
export function coverBox(vw: number, vh: number, fw: number, fh: number): Box {
  const k = Math.max(vw / fw, vh / fh)
  const width = fw * k, height = fh * k
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height }
}

/**
 * Zoom final aplicado à caixa do quadro (transform-origin 0 0; translate(tx,ty) scale(s)).
 * Um ponto local (u,v) da caixa vai para (box.left + tx + u·s, box.top + ty + v·s).
 * O tablet passa a ocupar `fill` da largura, centralizado; o centro dele fica em `cy`·vh.
 * A caixa escalada sempre cobre a tela (a fazenda continua encostada no rodapé).
 */
export function finalZoom(vw: number, vh: number, box: Box, t: Rect, fill: number, cy: number): Zoom {
  const s = Math.max(1, (fill * vw) / (t.w * box.width))
  const cu = (t.x + t.w / 2) * box.width
  const cv = (t.y + t.h / 2) * box.height
  let tx = vw / 2 - box.left - cu * s
  let ty = cy * vh - box.top - cv * s
  tx = Math.min(-box.left, Math.max(vw - box.left - box.width * s, tx))
  ty = Math.min(-box.top, Math.max(vh - box.top - box.height * s, ty))
  return { s, tx, ty }
}

/** Ponto local (u,v) da caixa -> tela, após o zoom. */
export const project = (box: Box, z: Zoom, u: number, v: number) => ({
  x: box.left + z.tx + u * z.s,
  y: box.top + z.ty + v * z.s,
})
