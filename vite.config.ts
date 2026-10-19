import { rmSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = (loadEnv(mode, process.cwd(), 'VITE_').VITE_ASSET_BASE ?? '').replace(/\/+$/, '')
  const site = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? '').replace(/\/+$/, '')
  if (mode === 'production' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_FORM_ENDPOINT) {
    console.warn('[lp-cerne] AVISO: VITE_FORM_ENDPOINT vazio. Em produção o formulário mostrará erro de envio (nenhum lead será recebido).')
  }
  return {
  // %VITE_ASSET_BASE% no index.html (preloads) vale vazio em dev, para o Vite não deixar o marcador literal
  plugins: [react(),
    // marcadores do index.html: %VITE_ASSET_BASE% (arquivos pesados) e %VITE_SITE_URL% (canonical, og:url, og:image).
    // Sem o valor, as tags marcadas com data-asset / data-site saem do HTML em vez de ficarem com href vazio
    { name: 'asset-base-html', transformIndexHtml: { order: 'pre' as const, handler: (html: string) => {
      let out = html.replaceAll('%VITE_ASSET_BASE%', base).replaceAll('%VITE_SITE_URL%', site)
      if (!base) out = out.replace(/\s*<[^>]*data-asset[^>]*>/g, '')
      if (!site) out = out.replace(/\s*<[^>]*data-site[^>]*>/g, '')
      return out.replace(/ data-(asset|site)(?=[\s>/])/g, '')
    } } },
    // robots.txt e sitemap.xml no build (o sitemap precisa da URL absoluta do site)
    { name: 'seo-files', apply: 'build' as const, generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *
Allow: /
${site ? `
Sitemap: ${site}/sitemap.xml
` : ''}` })
      if (site) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${site}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>
` })
    } },
    // preload da fonte principal (latin variável): o texto do Hero não espera o CSS achar o arquivo
    { name: 'preload-font', transformIndexHtml: { order: 'post' as const, handler(_html: string, ctx: { bundle?: Record<string, unknown> }) {
      const f = ctx.bundle && Object.keys(ctx.bundle).find((k) => /outfit-latin-wght-normal.*\.woff2$/.test(k))
      return f ? [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f}`, crossorigin: '' }, injectTo: 'head-prepend' as const }] : undefined
    } } },
    // com os arquivos pesados no R2, o build não precisa levar a cópia local de public/
    { name: 'drop-heavy-public', apply: 'build' as const, closeBundle() { if (base) for (const d of ['frames', 'video', 'app', 'screens', 'mocks']) rmSync(`dist/${d}`, { recursive: true, force: true }) } }],
  // O preview atribui a porta via PORT; sem ela, usa o padrão do Vite (5173).
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
}
})
