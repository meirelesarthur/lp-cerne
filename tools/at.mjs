// Screenshots em pontos do scroll relativos a um elemento. Uso:
//   node at.mjs <url> <w> <h> <seletor> <rótulo> <deslocamentos em telas...> [--mobile]
// Ex.: node at.mjs http://localhost:58357/ 1440 900 .ground-fade fade -1 -0.5 0 0.5
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const args = process.argv.slice(2)
const mobile = args.includes('--mobile')
const [url, w, h, sel, label, ...offs] = args.filter((a) => a !== '--mobile')
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/at')
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const page = await browser.newPage()
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(url, { waitUntil: 'networkidle0' })
await sleep(2500)
// passa por toda a página uma vez: carrega mídia adiada e cria os pins
await page.evaluate(() => window.scrollTo(0, 1))
await sleep(800)
for (const o of offs) {
  // o topo do elemento é lido de novo a cada passo (pins mudam a altura da página)
  const y = await page.evaluate((s) => { const el = document.querySelector(s); const t = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el; return t.getBoundingClientRect().top + scrollY }, sel)
  await page.evaluate((v) => window.scrollTo(0, v), Math.round(y + Number(o) * +h))
  await sleep(1800)
  await page.screenshot({ path: `${OUT}/${label}_${o}.png` })
}
console.log('erros:', errors.length ? errors : 'nenhum')
await browser.close()
