import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v2')
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// 1) scrub nos dois sentidos
let p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle0' }); await sleep(2000)
await p.screenshot({ path: `${OUT}/_a.png` })
await p.evaluate(() => window.scrollTo(0, 3000)); await sleep(2000)
await p.evaluate(() => window.scrollTo(0, 0)); await sleep(2500)
await p.screenshot({ path: `${OUT}/_b.png` })
// 2) foco por teclado no estado final
await p.evaluate(() => window.scrollTo(0, 3000)); await sleep(2000)
const order = []
for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); order.push(await p.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.trim().slice(0, 28) || document.activeElement?.tagName)) }
console.log('tab:', order.join(' > '))
await p.screenshot({ path: `${OUT}/hero-d1440-teclado.png` })
await p.close()
// 3) reduced motion
for (const [w, h, l] of [[1440, 900, 'd1440'], [390, 844, 'm390']]) {
  p = await b.newPage(); await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await p.setViewport({ width: w, height: h }); await p.goto('http://localhost:5180/', { waitUntil: 'networkidle0' }); await sleep(1500)
  await p.screenshot({ path: `${OUT}/hero-${l}-reduced-motion.png` }); await p.close()
}
await b.close()
