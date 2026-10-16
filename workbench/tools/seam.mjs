import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const [w, h] = [Number(process.argv[2] || 1440), Number(process.argv[3] || 900)]
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: w, height: h })
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2500)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 700) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(120) }
const e = await p.evaluate(() => { const r = document.getElementById('escopo').getBoundingClientRect(); return r.top + scrollY })
console.log('escopo top', e)
let i = 0; for (const d of [-1.0, -0.6, -0.3, 0, 0.3, 0.6, 0.9]) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(e + d * h)); await sleep(1400); await p.screenshot({ path: `${OUT}/seam-${i++}.png` }) }
await b.close()
