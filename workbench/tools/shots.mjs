// Screenshots do Hero v2 nas fases do scroll + emenda com a 2ª seção. Uso: node shots.mjs <w> <h> <rótulo> [mobile] [url]
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const [w, h, label, mobile] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[5] === 'mobile']
const URL = process.argv[6] || 'http://localhost:5180/'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v2')
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const page = await browser.newPage()
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(URL, { waitUntil: 'networkidle0' })
await sleep(3000)
const PIN = 4.2 * h
const points = [['00', 0], ['20', 0.2], ['40', 0.4], ['55', 0.555], ['64', 0.64], ['75', 0.75], ['86', 0.86], ['100', 1]]
for (const [name, p] of points) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(p * PIN))
  await sleep(1600)
  await page.screenshot({ path: `${OUT}/${label}-${name}.png` })
}
// emenda: meio caminho saindo do Hero e já na 2ª seção
for (const [name, extra] of [['seam-50', 0.5], ['seam-120', 1.2]]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(PIN + extra * h))
  await sleep(1600)
  await page.screenshot({ path: `${OUT}/${label}-${name}.png` })
}
console.log('erros:', errors.length ? errors : 'nenhum')
await browser.close()
