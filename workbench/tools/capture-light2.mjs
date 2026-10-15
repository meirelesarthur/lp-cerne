// Captura painéis do web em MODO CLARO com as duas barras laterais recolhidas (para a tela do tablet).
// Uso: node capture-light.mjs   (web em http://localhost:5173)
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../assets/capture/light')
fs.mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PANELS = (process.argv.slice(2).length ? process.argv.slice(2) : ['visao-geral'])
const [W, H] = [2560, 1600]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
await page.goto(BASE, { waitUntil: 'networkidle2' })
if (await page.$('input[type=email]')) {
  await page.type('input[type=email]', 'demo@cerne.test')
  await page.type('input[type=password]', 'mock-local-1')
  await page.click('button[type=submit]')
  await page.waitForFunction(() => document.title.startsWith('Home'), { timeout: 20000 })
}
for (const slug of PANELS) {
  await page.goto((slug.includes('/') ? `${BASE}/${slug}` : `${BASE}/dashboards/${slug}`), { waitUntil: 'networkidle2' })
  await sleep(1500)
  const theme = await page.evaluate(() => document.body.getAttribute('data-theme'))
  // 2º nível do menu
  await page.evaluate(() => document.querySelector('[aria-label="Recolher segundo nível do menu"]')?.click())
  // 1º nível: botão de recolher ao lado do logo (primeiro botão do topo da sidebar)
  await page.mouse.click(222, 44)
  await sleep(2500)
  const title = await page.title()
  console.log(slug, '| tema:', theme ?? 'light', '|', title)
  await page.screenshot({ path: path.join(OUT, `${slug.split('/').pop()}.png`) })
}
await browser.close()
