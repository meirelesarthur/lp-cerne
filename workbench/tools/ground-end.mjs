import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const [w, h, tag] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]]
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 })
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2500)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(90) }
const e = await p.evaluate(() => { const r = document.getElementById('escopo').getBoundingClientRect(); return { t: r.top + scrollY, b: r.bottom + scrollY } })
let i = 0; for (const d of [-1.9, -1.4, -0.95, -0.5, -0.2]) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(e.b + d * h)); await sleep(1300); await p.screenshot({ path: `${OUT}/${tag}-${i++}.png` }) }
await b.close()
