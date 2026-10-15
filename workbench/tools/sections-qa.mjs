// QA das seções Escopo → Problema → Sistema. Uso: node sections-qa.mjs <w> <h> <rótulo> [url]
import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'; import fs from 'node:fs'
const [w, h, label] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]]
const URL = process.argv[5] || 'http://127.0.0.1:5210/'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../docs/shots/v4'); fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: w, height: h })
const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(2500)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < total; y += h * 0.8) { await p.evaluate((y) => window.scrollTo(0, y), y); await sleep(200) }
const top = (id) => p.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { t: r.top + scrollY, b: r.bottom + scrollY } }, id)
const shot = async (name, y) => { await p.evaluate((y) => window.scrollTo(0, y), Math.round(y)); await sleep(1400); await p.screenshot({ path: `${OUT}/${label}-${name}.png` }) }
const esc = await top('escopo'), pro = await top('problema'), sis = await top('sistema')
console.log({ esc, pro, sis, h })
// fim do Escopo, em 4 passos
for (const [n, d] of [['esc-1', -1.6], ['esc-2', -1.1], ['esc-3', -0.6], ['esc-4', -0.15]]) await shot(n, esc.b + d * h)
// Problema (pin): pontos reais do ScrollTrigger
const pin = await p.evaluate(() => { const st = window.ST.getAll().find((t) => t.pin && t.trigger && t.trigger.id === 'problema'); return st ? { s: st.start, e: st.end } : null })
console.log('pin problema', pin)
if (pin) for (const f of [0, 0.12, 0.24, 0.34, 0.44, 0.55, 0.7, 0.9, 1]) await shot(`pro-${String(Math.round(f * 100)).padStart(3, '0')}`, pin.s + f * (pin.e - pin.s))
// Sistema
const sis2 = await top('sistema'); await shot('sis-0', sis2.t - 40); await shot('sis-1', sis2.t + 0.45 * (sis2.b - sis2.t)); await shot('sis-2', sis2.b - h + 40)
console.log('erros:', errors.length ? errors : 'nenhum'); await b.close()
