import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: w < 800, hasTouch: w < 800 })
  await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
  const total = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(80) }
  await p.evaluate(() => document.querySelector('.fz-figure').scrollIntoView({ block: 'center' })); await sleep(1200)
  await p.evaluate(() => document.querySelectorAll('.fz-label')[1].click()); await sleep(800)
  const open = await p.evaluate(() => !!document.querySelector('.fz-card'))
  await p.evaluate(() => document.querySelector('.farm-head h2, #modulos-title').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await sleep(500)
  const afterOutside = await p.evaluate(() => !!document.querySelector('.fz-card'))
  await p.evaluate(() => document.querySelectorAll('.fz-label')[2].click()); await sleep(600)
  await p.evaluate(() => document.querySelector('.fz-card h3').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await sleep(400)
  const afterInside = await p.evaluate(() => !!document.querySelector('.fz-card'))
  console.log(w, { abriu: open, aposCliqueFora: afterOutside, aposCliqueNoCartao: afterInside }); await b.close()
}
