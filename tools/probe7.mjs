import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v3'); const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const [w, h, mob] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4] === 'mobile']
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob })
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()))
await p.goto('http://localhost:58357/', { waitUntil: 'networkidle0' }); await sleep(2000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += h * 0.8) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(200) }
const top = await p.evaluate(() => { const t = window.ST.getAll().find(t => t.pin && /profiles/.test(t.trigger.className)); return t ? [t.start, t.end] : null })
const sec = await p.evaluate(() => document.getElementById('perfis').getBoundingClientRect().top + scrollY)
const pts = top ? [0.02, 0.35, 0.6, 0.98].map(f => top[0] + f * (top[1] - top[0])) : [0, 0.4, 0.8, 1.3].map(f => sec + f * h)
for (const [k, y] of pts.entries()) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(y)); await sleep(1800); await p.screenshot({ path: `${OUT}/campo-${w}-${k}.png` }) }
const tr = await p.evaluate(() => document.getElementById('trailer').getBoundingClientRect().top + scrollY)
await p.evaluate((y) => window.scrollTo(0, y), Math.round(tr + 300)); await sleep(1500)
console.log('header escuro no trailer:', await p.evaluate(() => document.documentElement.hasAttribute('data-header-dark')), '| erros', errs)
await p.screenshot({ path: `${OUT}/header-dark-${w}.png` })
await b.close()
