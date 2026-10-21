import { rmSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { HERO } from './src/content/heroCopy.js'

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
    // casca estática do primeiro quadro no HTML: cabeçalho, poster e a proposta de valor (H1, lead e CTA) aparecem sem esperar o JS.
    // O React troca esta casca pelo mesmo conteúdo quando monta (copy vem de src/content/heroCopy.ts, a mesma do Hero.tsx).
    { name: 'hero-static-shell', transformIndexHtml: { order: 'pre' as const, handler: (html: string) => html.replace('<!--HERO_STATIC-->', `<header class="header"><a href="/" aria-label="Cerne, página inicial"><img class="logo-on-glass" src="/logo.svg" alt="Cerne" height="28"><img class="logo-on-scene" src="/logo-white.svg" alt="" aria-hidden="true" height="28"></a><button type="button" class="btn btn-primary">${HERO.cta}</button></header><main id="main"><section class="hero" aria-label="Cerne: ERP para o agro"><div class="hero-pin"><picture><source media="(max-width: 820px) and (orientation: portrait)" srcset="${base}/frames/hero/mobile/poster-first.webp"><img class="poster" src="${base}/frames/hero/desktop/poster-first.webp" alt="" fetchpriority="high" decoding="async"></picture><div class="hero-shade"></div><div class="hero-intro"><div class="hero-intro-copy"><span class="hero-eyebrow">${HERO.eyebrow}</span><h1>${HERO.h1Pre} <em>${HERO.h1Em}</em></h1><p class="lead">${HERO.lead}</p><button type="button" class="btn btn-primary">${HERO.cta}</button><p class="hero-intro-proof">${HERO.proof}</p></div></div></div></section></main>`) } },
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
