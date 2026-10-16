import { rmSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = (loadEnv(mode, process.cwd(), 'VITE_').VITE_ASSET_BASE ?? '').replace(/\/+$/, '')
  return {
  // %VITE_ASSET_BASE% no index.html (preloads) vale vazio em dev, para o Vite não deixar o marcador literal
  plugins: [react(), { name: 'asset-base-html', transformIndexHtml: (html: string) => html.replaceAll('%VITE_ASSET_BASE%', base) },
    // com os arquivos pesados no R2, o build não precisa levar a cópia local de public/
    { name: 'drop-heavy-public', apply: 'build' as const, closeBundle() { if (base) for (const d of ['frames', 'video', 'app', 'screens', 'mocks']) rmSync(`dist/${d}`, { recursive: true, force: true }) } }],
  // O preview atribui a porta via PORT; sem ela, usa o padrão do Vite (5173).
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
}
})
