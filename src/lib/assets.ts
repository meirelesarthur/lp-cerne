/**
 * Arquivos pesados (quadros, vídeos, telas) ficam no Cloudflare R2. `VITE_ASSET_BASE` aponta para o bucket
 * (sem barra no fim); vazio = mesmo domínio (desenvolvimento local, arquivos em `public/`).
 */
const BASE = ((import.meta.env.VITE_ASSET_BASE as string | undefined) ?? '').replace(/\/+$/, '')

export const asset = (path: string) => (BASE && path.startsWith('/') ? BASE + path : path)
