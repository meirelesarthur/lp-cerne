import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(3000)
console.log(await p.evaluate(() => { const i = document.querySelector('.ground-bg img'), s = document.getElementById('escopo'); return { top: i.style.top, h: i.style.height, w: i.style.width, left: i.style.left, vh: innerHeight, secH: s.offsetHeight } }))
await b.close()
