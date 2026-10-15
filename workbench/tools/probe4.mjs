import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 820 })
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()))
await p.goto('http://localhost:58357/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 3000))
await p.evaluate(() => window.scrollTo(0, 50)); await new Promise(r => setTimeout(r, 2500))
console.log(await p.evaluate(() => window.ST.getAll().filter(t => t.pin || /hero|trailer|profiles|ground-fade/.test(t.trigger?.className || '')).map(t => ({ trig: (t.trigger?.className || '').toString().slice(0, 25), start: Math.round(t.start), end: Math.round(t.end), pin: !!t.pin, prio: t.vars.refreshPriority }))))
await p.evaluate(() => window.scrollTo(0, Math.round(0.75 * 4.2 * 820))); await new Promise(r => setTimeout(r, 2000))
console.log(await p.evaluate(() => ({ y: scrollY, fl: getComputedStyle(document.querySelector('.final-layer') || document.body).visibility, fb: document.querySelector('.frame-box')?.style.transform, heroProg: window.ST.getAll().find(t => t.pin && /hero/.test(t.trigger.className))?.progress })))
console.log('erros', errs.slice(0, 5))
await b.close()
