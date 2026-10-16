import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [w, h, mob] of [[1440, 900, false], [390, 844, true]]) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob })
  await p.goto('http://127.0.0.1:5220/', { waitUntil: 'networkidle0' }); await sleep(2000)
  // rolagem contínua, como um usuário
  let y = 0; for (;;) { y += 160; await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(40); const t = await p.evaluate(() => document.getElementById('twin').getBoundingClientRect().top); if (t < h * 0.2) break; if (y > 40000) break }
  await sleep(2500)
  const info = await p.evaluate(() => { const q = (s) => { const e = document.querySelector(s); return e ? +getComputedStyle(e).opacity : null }; return { h2: q('.twin h2'), lead: q('.twin-lead'), btn: q('.twin .btn') } })
  console.log(w, info); await b.close()
}
