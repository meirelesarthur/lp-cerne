import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500))
console.log(await p.evaluate(() => {
  const sp = document.querySelector('.pin-spacer'); const fb = document.querySelector('.frame-box')
  return { spacer: sp?.offsetHeight, docH: document.documentElement.scrollHeight, vh: innerHeight, fbStyle: fb?.getAttribute('style') }
}))
for (const y of [0.64, 0.75].map(f => f * 4.2 * 900)) {
  await p.evaluate((y) => window.scrollTo(0, y), y); await new Promise(r => setTimeout(r, 1800))
  console.log(Math.round(y), await p.evaluate(() => { const r = document.querySelector('.tablet-screen').getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), y: Math.round(r.y), h: Math.round(r.height), t: document.querySelector('.frame-box').style.transform } }))
}
await b.close()
