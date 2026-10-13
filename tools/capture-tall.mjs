// Painéis em modo claro, barras recolhidas, página inteira (rolam dentro do tablet gigante e no vídeo do sistema).
// Uso: node capture-tall.mjs [slug ...]   (padrão: visao-geral)
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../assets/capture/light')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const W = 1600
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage()
await p.setViewport({ width: W, height: 1000, deviceScaleFactor: 2 })
await p.goto('http://localhost:5173', { waitUntil: 'networkidle2' })
if (await p.$('input[type=email]')) {
  await p.type('input[type=email]', 'demo@cerne.test'); await p.type('input[type=password]', 'mock-local-1')
  await p.click('button[type=submit]'); await p.waitForFunction(() => document.title.startsWith('Home'), { timeout: 20000 })
}
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : ['visao-geral']
for (const slug of slugs) {
  await p.setViewport({ width: W, height: 1000, deviceScaleFactor: 2 })
await p.goto(`http://localhost:5173/dashboards/${slug}`, { waitUntil: 'networkidle2' }); await sleep(1500)
// altura real do conteúdo: maior scrollHeight entre os contêineres roláveis
const h = await p.evaluate(() => Math.max(...[...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY.match(/auto|scroll/)).map(e => e.scrollHeight + 120), document.body.scrollHeight))
console.log(slug, 'altura do conteúdo', h)
await p.setViewport({ width: W, height: Math.min(h, 4200), deviceScaleFactor: 2 })
await sleep(1200)
await p.evaluate(() => document.querySelector('[aria-label="Recolher segundo nível do menu"]')?.click())
const r = await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find(x => x.querySelector('svg') && x.getBoundingClientRect().top < 60 && x.getBoundingClientRect().left < 260); const b = el?.getBoundingClientRect(); return b ? [b.x + b.width / 2, b.y + b.height / 2] : null })
if (r) await p.mouse.click(r[0], r[1])
await sleep(2500)
await p.screenshot({ path: path.join(OUT, `${slug}-full.png`) })
}
await b.close()
