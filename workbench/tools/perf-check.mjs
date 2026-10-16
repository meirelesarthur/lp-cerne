import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const URL = process.argv[2] || 'http://127.0.0.1:5220/'
for (const [w, h, mob, tag] of [[1440, 900, false, 'pf-d'], [390, 844, true, 'pf-m']]) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob })
  const errs = [], reqs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 120)))
  p.on('response', (r) => { const u = r.url(); if (/frames\/hero\/(desktop|mobile)(-hd)?\/\d{3}\./.test(u)) reqs.push(u) })
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(1500)
  const before = { sections: await p.evaluate(() => document.querySelectorAll('section').length), frames: reqs.length }
  // rolagem contínua e realista
  const shot = async (name) => { await sleep(900); await p.screenshot({ path: `${OUT}/${tag}-${name}.png` }) }
  await p.evaluate(() => window.scrollTo(0, 200)); await sleep(2500)
  const after = { sections: await p.evaluate(() => document.querySelectorAll('section').length), footer: await p.evaluate(() => !!document.querySelector('footer')) }
  const total = await p.evaluate(() => document.documentElement.scrollHeight)
  const marks = {}
  for (let y = 200; y < total; y += 220) {
    await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(35)
    for (const id of ['problema', 'trailer', 'sistema', 'perfis', 'twin']) {
      if (!marks[id]) { const t = await p.evaluate((id) => { const e = document.getElementById(id); return e ? e.getBoundingClientRect().top : 9999 }, id); if (t < h * 0.3) { marks[id] = y } }
    }
  }
  for (const [id, y] of Object.entries(marks)) { await p.evaluate((y) => window.scrollTo(0, y), y + (id === 'problema' || id === 'perfis' || id === 'trailer' ? 500 : 0)); await shot(id) }
  console.log(tag, { antes: before, depois: after, secoesVistas: Object.keys(marks), framesHeroBaixados: reqs.length, erros: errs.slice(0, 3) }); await b.close()
}
