import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v3')
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
// 1) bento e trailer em 1400x820
let p = await b.newPage(); await p.setViewport({ width: 1400, height: 820 })
await p.goto('http://localhost:58357/', { waitUntil: 'networkidle0' }); await sleep(2000)
await p.evaluate(() => window.scrollTo(0, 50)); await sleep(1500)
const st = (re, f) => p.evaluate((re, f) => { const t = window.ST.getAll().find(t => t.pin && new RegExp(re).test(t.trigger.className)); return t.start + f * (t.end - t.start) }, re, f)
await p.evaluate((y) => window.scrollTo(0, y), Math.round(await st('trailer', 0.5))); await sleep(1800); await p.screenshot({ path: `${OUT}/q-trailer-1400.png` })
const sy = await p.evaluate(() => document.getElementById('sistema').getBoundingClientRect().top + scrollY)
for (const [n, d] of [['q-bento-1', 60], ['q-bento-2', 700]]) { await p.evaluate((y) => window.scrollTo(0, y), Math.round(sy + d)); await sleep(1600); await p.screenshot({ path: `${OUT}/${n}.png` }) }
await p.close()
// 2) HD em 1920x1080: qual sequência carregou e qualidade no fim da sequência
p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 })
const reqs = []; p.on('request', r => { if (r.url().includes('/frames/hero/')) reqs.push(r.url().split('/frames/hero/')[1]) })
await p.goto('http://localhost:58357/', { waitUntil: 'networkidle0' }); await sleep(2500)
for (let y = 0; y < 4.2 * 1080; y += 400) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(120) }
await sleep(3000)
await p.evaluate(() => window.scrollTo(0, Math.round(0.53 * 4.2 * 1080))); await sleep(2000); await p.screenshot({ path: `${OUT}/q-hd-53.png` })
console.log('HD?', reqs.filter(r => r.startsWith('desktop-hd/')).length, 'avif | base', reqs.filter(r => r.startsWith('desktop/') && /\d{3}\.webp/.test(r)).length, 'webp')
await b.close()
