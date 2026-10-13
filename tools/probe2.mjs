import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://localhost:58357/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500))
const info = async (label) => console.log(label, await p.evaluate(() => {
  const img = document.querySelector('.ground-bg img'), veil = document.querySelector('.ground-veil'), bg = document.querySelector('.ground-bg')
  return { y: scrollY, img: img ? [img.getAttribute('style'), img.complete, img.naturalWidth] : null, veil: veil && getComputedStyle(veil).opacity, bg: bg.getBoundingClientRect().top, sec: document.getElementById('escopo').getBoundingClientRect().top, spacer: document.querySelector('.pin-spacer')?.offsetHeight }
}))
await p.evaluate(() => window.scrollTo(0, 4.2 * 900 + 540)); await new Promise(r => setTimeout(r, 2000)); await info('direto')
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += 720) { await p.evaluate((y) => window.scrollTo(0, y), y); await new Promise(r => setTimeout(r, 250)) }
await p.evaluate(() => window.scrollTo(0, 4.2 * 900 + 540)); await new Promise(r => setTimeout(r, 2000)); await info('depois de percorrer')
await b.close()
