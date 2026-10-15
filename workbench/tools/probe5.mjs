import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v3')
const [w, h] = [Number(process.argv[2] || 1400), Number(process.argv[3] || 820)]
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: w, height: h })
await p.goto('http://localhost:58357/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500))
for (const f of [0.3, 0.5, 0.6, 0.64, 0.75, 0.86, 0.95, 1.0]) {
  await p.evaluate((y) => window.scrollTo(0, y), Math.round(f * 4.2 * h)); await new Promise(r => setTimeout(r, 1800))
  await p.screenshot({ path: `${OUT}/hero-${w}-${Math.round(f * 100)}.png` })
}
const t = await p.evaluate(() => window.ST.getAll().find(t => t.pin && /trailer/.test(t.trigger.className)))
for (const f of [0.1, 0.5, 0.9]) {
  const y = await p.evaluate((f) => { const t = window.ST.getAll().find(t => t.pin && /trailer/.test(t.trigger.className)); return t.start + f * (t.end - t.start) }, f)
  await p.evaluate((y) => window.scrollTo(0, y), Math.round(y)); await new Promise(r => setTimeout(r, 1800))
  await p.screenshot({ path: `${OUT}/trailer-${w}-${Math.round(f * 100)}.png` })
}
await b.close()
