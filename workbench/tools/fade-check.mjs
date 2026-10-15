import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 700) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(120) }
const e = await p.evaluate(() => { const r = document.getElementById('escopo').getBoundingClientRect(); return { t: r.top + scrollY, b: r.bottom + scrollY } })
// do fim dos cards até o fim da seção
const f = await p.evaluate(() => document.querySelector('.fatos').getBoundingClientRect().top + scrollY)
const a = f - 0.42 * 900 - 80, z = e.b - 900 * 0.92 + 60
console.log({ a, z })
let i = 0; for (const k of [0, 0.2, 0.4, 0.6, 0.8, 1]) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(a + k * (z - a))); await sleep(1300); await p.screenshot({ path: `${OUT}/fade-${i++}.png` }) }
await b.close()
