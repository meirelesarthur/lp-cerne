// Exporta os cartões de visita (workbench/print/cartoes/cartoes.html) para impressão.
// PNG a 600 dpi (96 × 56 mm com sangria = 2268 × 1323 px) e PDF vetorial por cartão (frente + verso).
// GB Agritech tem uma frente e um verso por vendedor (Silvio e Marcílio); GB Consult tem um só.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const DIR = path.resolve('../print/cartoes')
const OUT = path.join(DIR, 'export')
const URL = pathToFileURL(path.join(DIR, 'cartoes.html')).href
const DPI = 600
const SCALE = (DPI / 25.4) / 10 // 10 px CSS = 1 mm
const guias = process.argv.includes('--guias')

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const page = await browser.newPage()
await page.setViewport({ width: 3200, height: 1400, deviceScaleFactor: SCALE })
await page.goto(URL, { waitUntil: 'networkidle0' })
await page.evaluate(async g => { if (g) document.body.classList.add('guias'); await document.fonts.ready }, guias)

const faces = ['agritech-frente', 'agritech-verso-silvio', 'agritech-verso-marcilio', 'consult-frente', 'consult-verso']
const pdfs = {
  'agritech-silvio': ['agritech-frente', 'agritech-verso-silvio'],
  'agritech-marcilio': ['agritech-frente', 'agritech-verso-marcilio'],
  consult: ['consult-frente', 'consult-verso'],
}
for (const id of faces) {
  const el = await page.$('#' + id)
  await el.screenshot({ path: path.join(OUT, `${id}${guias ? '-guias' : ''}.png`) })
}

if (!guias) {
  // PDF: uma página por face, 96 × 56 mm, texto e vetores preservados
  for (const [nome, ids] of Object.entries(pdfs)) {
    await page.evaluate(ids => {
      document.querySelectorAll('.card').forEach(c => { c.style.display = ids.includes(c.id) ? '' : 'none'; c.style.breakAfter = '' })
      document.getElementById(ids[0]).style.breakAfter = 'page'
      const s = document.createElement('style'); s.id = 'print'
      s.textContent = `@page{size:96mm 56mm;margin:0} body{padding:0;display:block;background:none} .par{display:block}`
      document.getElementById('print')?.remove(); document.head.append(s)
    }, ids)
    await page.pdf({ path: path.join(OUT, `cartao-${nome}.pdf`), width: '96mm', height: '56mm', scale: 0.377953, printBackground: true })
  }
}
await browser.close()
console.log('ok', fs.readdirSync(OUT))
