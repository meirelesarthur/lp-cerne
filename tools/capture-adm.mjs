// Captura o app Operação (build web Flutter) em tela de celular. Uso: node capture-app.mjs
import puppeteer from 'puppeteer-core'
import path from 'node:path'; import os from 'node:os'; import fs from 'node:fs'
const CHROME = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe')
const OUT = path.resolve('../assets/capture/app'); fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'shell', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await p.goto('http://localhost:5191/', { waitUntil: 'networkidle0', timeout: 60000 }); await sleep(8000)
await p.screenshot({ path: `${OUT}/adm-01.png` })
// login mock (app de demonstração local)
await p.mouse.click(195, 307); await sleep(400); await p.keyboard.type('demo@cerne.test', { delay: 30 })
await p.mouse.click(170, 399); await sleep(400); await p.keyboard.type('mock-local-1', { delay: 30 })
await p.mouse.click(195, 575); await sleep(7000)
await p.screenshot({ path: `${OUT}/adm-02.png` })
console.log('título:', await p.title())
await b.close()
