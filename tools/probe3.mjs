import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://localhost:58357/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 3000))
await p.evaluate(() => window.scrollTo(0, 100)); await new Promise(r => setTimeout(r, 1500))
console.log(await p.evaluate(() => window.ST.getAll().map(t => ({ trig: (t.trigger?.className || t.trigger?.id || '').toString().slice(0, 30), start: Math.round(t.start), end: Math.round(t.end), pin: !!t.pin }))))
const fadeTop = await p.evaluate(() => document.querySelector('.ground-fade').getBoundingClientRect().top + scrollY)
console.log('fade top real', fadeTop)
await b.close()
