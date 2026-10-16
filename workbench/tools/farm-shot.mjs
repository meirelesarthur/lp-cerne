import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const [w, h, tag, mobile] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4], process.argv[5] === 'mobile']
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(100) }
const top = await p.evaluate(() => document.getElementById('sistema').getBoundingClientRect().top + scrollY)
const go = async (n, y) => { await p.evaluate((y) => window.scrollTo(0, y), Math.round(y)); await sleep(1500); await p.screenshot({ path: `${OUT}/${tag}-${n}.png` }) }
await go('0', top - 40)
const click = async (sel) => { await p.evaluate((sel) => document.querySelector(sel)?.click(), sel); await sleep(1400) }
await click('.fz-label:nth-of-type(3)'); await go('1', top - 40)
await click('.fz-label:nth-of-type(2)'); await p.screenshot({ path: `${OUT}/${tag}-2.png` })
console.log('erros', errs.slice(0, 3)); await b.close()
