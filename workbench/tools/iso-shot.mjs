import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'; import { pathToFileURL } from 'node:url'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1500, height: 880 })
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.goto(pathToFileURL(path.resolve('iso/fazenda/out/fazenda.html')).href); await new Promise((r) => setTimeout(r, 1500))
await p.screenshot({ path: path.resolve('../docs/shots/v4/iso-art.png') }); console.log('erros', errs.slice(0, 3)); await b.close()
