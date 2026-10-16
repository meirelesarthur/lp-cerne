import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [w, h, mob, tag] of [[1440, 900, false, 'tw-d'], [390, 844, true, 'tw-m']]) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
  const total = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(90) }
  const top = await p.evaluate(() => document.getElementById('twin').getBoundingClientRect().top + scrollY)
  await p.evaluate((y) => window.scrollTo(0, y), Math.round(top - 60)); await sleep(1800)
  await p.screenshot({ path: `${OUT}/${tag}.png` }); console.log(tag, errs.slice(0, 2)); await b.close()
}
