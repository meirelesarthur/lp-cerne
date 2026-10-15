import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(150) }
const t = await p.evaluate(() => { const r = document.getElementById('problema').getBoundingClientRect(); return { t: r.top + scrollY, h: r.height } })
console.log(t)
let i = 0; for (const y of [t.t, t.t + 700, t.t + 1400, t.t + 2100]) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(1200); await p.screenshot({ path: `${OUT}/m2-pro-${i++}.png` }) }
await b.close()
