// QA da página inteira depois do Hero. Uso: node page.mjs <w> <h> <rótulo> [mobile] [url]
import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'; import fs from 'node:fs'
const [w, h, label, mobile] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[5] === 'mobile']
const URL = process.argv[6] || 'http://localhost:5180/'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v3'); fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage()
await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile })
const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(2500)
// desce devagar até o fim (dispara lazy-load e revelações), depois volta para os pontos
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += h * 0.8) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(250) }
const pinEnd = 4.2 * h
const shots = [['a-hero-fim', pinEnd], ['b-emenda', pinEnd + 0.6 * h], ['c-escopo', pinEnd + 1.25 * h]]
for (const [n, y] of shots) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(y)); await sleep(1500); await p.screenshot({ path: `${OUT}/${label}-${n}.png` }) }
const ids = ['escopo', 'problema', 'trailer', 'sistema', 'edicoes', 'perfis', 'contato', 'duvidas']
const tops = await p.evaluate((ids) => ids.map((id) => document.getElementById(id).getBoundingClientRect().top + scrollY), ids)
// fim da 2ª seção (fusão em verde + degradê)
const esc = await p.evaluate(() => { const r = document.getElementById('escopo').getBoundingClientRect(); return r.bottom + scrollY })
await p.evaluate((y) => window.scrollTo(0, y), Math.round(esc - 1.3 * h)); await sleep(1500); await p.screenshot({ path: `${OUT}/${label}-d-verde.png` })
await p.evaluate((y) => window.scrollTo(0, y), Math.round(esc - 0.7 * h)); await sleep(1500); await p.screenshot({ path: `${OUT}/${label}-e-degrade.png` })
for (let i = 1; i < ids.length; i++) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(tops[i] - 40)); await sleep(1400); await p.screenshot({ path: `${OUT}/${label}-s${i + 2}-${ids[i]}.png` }) }
// meio dos pins (Trailer e Perfis)
for (const id of ['trailer', 'perfis']) {
  const y = await p.evaluate((id) => document.getElementById(id).getBoundingClientRect().top + scrollY, id)
  await p.evaluate((y) => window.scrollTo(0, y), Math.round(y + 1.1 * h)); await sleep(1500); await p.screenshot({ path: `${OUT}/${label}-pin-mid-${id}.png` })
}
// hero: zoom no tablet (fase 2/3) para conferir o header
for (const [n, f] of [['h64', 0.64], ['h75', 0.75], ['h86', 0.86]]) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(f * 4.2 * h)); await sleep(1500); await p.screenshot({ path: `${OUT}/${label}-${n}.png` }) }
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(1200); await p.screenshot({ path: `${OUT}/${label}-z-rodape.png` })
console.log('altura total', total, '| erros:', errors.length ? errors : 'nenhum')
await b.close()
