import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tag = process.argv[2] || 'fm'
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://127.0.0.1:5210/', { waitUntil: 'networkidle0' }); await sleep(2000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(90) }
const top = await p.evaluate(() => document.getElementById('sistema').getBoundingClientRect().top + scrollY)
const go = async (n, y) => { await p.evaluate((y) => window.scrollTo(0, y), Math.round(y)); await sleep(1500); await p.screenshot({ path: `${OUT}/${tag}-${n}.png` }) }
await go('0', top)
const click = async (n) => { await p.evaluate((n) => document.querySelectorAll('.fz-label')[n]?.click(), n); await sleep(1600) }
const secTop = async () => p.evaluate(() => document.querySelector('.fz-figure').getBoundingClientRect().top + scrollY)
await click(0); await go('1', (await secTop()) - 90)
await p.evaluate(() => document.querySelectorAll('.fz-label')[1]?.click()); await sleep(1600); await go('2', (await secTop()) - 90)
await p.evaluate(() => document.querySelectorAll('.fz-label')[3]?.click()); await sleep(1600); await go('3', (await secTop()) - 90)
console.log('erros', errs.slice(0, 3)); await b.close()
