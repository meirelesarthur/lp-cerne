import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(90) }
await sleep(1500)
console.log(await p.evaluate(() => { const e = document.querySelector('.fz-scroll'); return { l: e.scrollLeft, w: e.scrollWidth, c: e.clientWidth } }))
await b.close()
