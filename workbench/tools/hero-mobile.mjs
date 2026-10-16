import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tag = process.argv[2] || 'hm'
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const reqs = []; p.on('request', (r) => /frames\/hero\/mobile/.test(r.url()) && reqs.push(r.url().split('/frames/')[1]))
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(4000)
const pin = await p.evaluate(() => { const st = window.ST.getAll().find((t) => t.pin && t.trigger && t.trigger.classList?.contains('hero')); return st ? { s: st.start, e: st.end } : null })
console.log('pin', pin, 'variantes pedidas', [...new Set(reqs.map((u) => u.split('/')[1]))])
let i = 0; for (const f of [0, 0.2, 0.45, 0.62, 0.8, 1]) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(pin.s + f * (pin.e - pin.s))); await sleep(2000); await p.screenshot({ path: `${OUT}/${tag}-${i++}.png` }) }
console.log('erros', errs.slice(0, 3)); await b.close()
