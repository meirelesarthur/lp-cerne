// Captura a Visão Geral do web (GB Mode, usuário mock) em várias resoluções.
import puppeteer from 'puppeteer-core'
import path from 'node:path'
import os from 'node:os'

const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../assets/capture')
const BASE = 'http://localhost:5173'
const sizes = [[2560, 1600]]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
for (const [w, h] of sizes) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto(BASE, { waitUntil: 'networkidle2' })
  if (await page.$('input[type=email]')) {
    await page.type('input[type=email]', 'demo@cerne.test')
    await page.type('input[type=password]', 'mock-local-1')
    await page.click('button[type=submit]')
    await page.waitForFunction(() => document.title.startsWith('Home'), { timeout: 20000 })
  }
  await page.goto(`${BASE}/dashboards/visao-geral`, { waitUntil: 'networkidle2' })
  // GB Mode via menu do avatar
  await page.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if (b.textContent.trim() === 'SA') b.click() })
  })
  await new Promise(r => setTimeout(r, 500))
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('[role=menuitem]')].find(e => /GB Mode/.test(e.textContent))
    el?.click()
  })
  await new Promise(r => setTimeout(r, 4000))
  const theme = await page.evaluate(() => document.body.getAttribute('data-theme'))
  console.log(w, h, 'theme=', theme)
  await page.screenshot({ path: path.join(OUT, `visao-geral-${w}x${h}.png`) })
  await page.close()
}
await browser.close()
