import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [w, h, mob] of [[1440, 900, false], [390, 844, true]]) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob })
  const r2 = { ok: 0, fail: [] }, local = []; const errs = []
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 140)))
  p.on('response', (res) => { const u = res.url(); if (u.includes('r2.dev')) { res.status() < 400 ? r2.ok++ : r2.fail.push(res.status() + ' ' + u.slice(-50)) } else if (/\/(frames|video|app|screens|mocks)\//.test(u)) local.push(u.replace(/^.*5220/, '')) })
  await p.goto('http://127.0.0.1:5220/', { waitUntil: 'networkidle0' }); await sleep(2500)
  for (let y = 0; y < 9000; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(250) }
  await p.evaluate(() => window.scrollTo(0, 1500)); await sleep(1500)
  await p.screenshot({ path: `${OUT}/r2-${w}.png` })
  console.log(w, { r2: r2.ok, falhasR2: r2.fail.slice(0, 3), aindaLocal: [...new Set(local)].slice(0, 4), erros: errs.slice(0, 3) }); await b.close()
}
