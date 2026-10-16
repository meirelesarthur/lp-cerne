import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(100) }
const pin = await p.evaluate(() => { const st = window.ST.getAll().find((t) => t.pin && t.trigger && t.trigger.id === 'problema'); return { s: st.start, e: st.end } })
let i = 0; for (const f of [0.36, 0.44, 0.52, 0.6, 0.66, 0.7, 0.76, 0.82]) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(pin.s + f * (pin.e - pin.s))); await sleep(1300); await p.screenshot({ path: `${OUT}/fly-${i++}.png` }) }
await b.close()
