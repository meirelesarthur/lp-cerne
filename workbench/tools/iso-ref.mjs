import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'; import { pathToFileURL } from 'node:url'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell' })
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 })
await p.goto(pathToFileURL(path.resolve('iso/fazenda/out/fazenda.html')).href); await new Promise((r) => setTimeout(r, 1500))
const el = await p.$('svg'); await el.screenshot({ path: path.resolve('../assets/gen-v5/maquete-ref.png') }); await b.close()
