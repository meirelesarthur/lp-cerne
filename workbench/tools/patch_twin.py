"""Seção GB Twin: imagem (drone + tablet com o print real) à esquerda, texto branco à direita, sobre soja."""
import os
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# imagem para a web (2200 px; o arquivo vai para o R2 como os demais /frames)
src = os.path.join(ROOT, 'workbench/assets/gen-v5/twin-composto-4000.png')
im = Image.open(src).convert('RGB')
im = im.resize((2200, round(im.height * 2200 / im.width)), Image.LANCZOS)
os.makedirs(os.path.join(ROOT, 'public/frames'), exist_ok=True)
im.save(os.path.join(ROOT, 'public/frames/twin-bg.webp'), quality=82)
print('imagem', im.size)

p = os.path.join(ROOT, 'src/components/Sections.tsx')
s = open(p, encoding='utf-8').read()
comp = '''/* ───────────────────────── GB Twin ───────────────────────── */
const TWIN_ITENS = ['Censo de copas por pivô', 'Mapa do censo em células de 20 m', 'Calibração por amostra de campo', 'Busca e controle de falhas']

export function TwinSection() {
  return (
    <section className="twin" id="twin" aria-labelledby="twin-title" data-header-dark>
      <div className="twin-bg" aria-hidden="true">
        <img src={asset('/frames/twin-bg.webp')} alt="" width={2200} height={1238} loading="lazy" decoding="async" />
      </div>
      <div className="twin-grid">
        <div className="twin-spacer" aria-hidden="true" />
        <div className="twin-copy">
          <span className="eyebrow" data-reveal>GB Twin</span>
          <h2 id="twin-title" data-reveal>Cada pé da lavoura, contado do alto.</h2>
          <p className="twin-lead" data-reveal>O drone sobrevoa o pivô e o GB Twin conta os pés no ortomosaico, confere por amostra e emite o laudo. Você vê a falha onde ela está, não na média.</p>
          <ul className="twin-list" data-reveal>
            {TWIN_ITENS.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <dl className="twin-stats" data-reveal>
            <div><dt>Copas</dt><dd>120.855</dd></div>
            <div><dt>Estande</dt><dd>3.568<small>/ha</small></dd></div>
            <div><dt>Aproveitamento</dt><dd>86%</dd></div>
          </dl>
          <p className="twin-note" data-reveal>Pivô 02, dados de demonstração. <Tbd>disponibilidade a validar</Tbd></p>
          <a className="btn btn-light" href="#contato" data-interest="todos" data-reveal>Quero conhecer o GB Twin</a>
        </div>
      </div>
    </section>
  )
}

'''
marker = '/* ───────────────────────── 08'
i = s.find('export function TrustSection')
# insere antes do comentário de bloco que precede TrustSection (se existir), senão antes da função
j = s.rfind('/* ─', 0, i)
if j != -1 and i - j < 200:
    i = j
s = s[:i] + comp + s[i:]
open(p, 'w', encoding='utf-8').write(s)

a = os.path.join(ROOT, 'src/App.tsx')
t = open(a, encoding='utf-8').read()
t = t.replace('ProfilesSection, SystemSection, TrailerSection, TrustSection,', 'ProfilesSection, SystemSection, TrailerSection, TrustSection, TwinSection,')
t = t.replace('        <ProfilesSection />\n', '        <ProfilesSection />\n        <TwinSection />\n')
open(a, 'w', encoding='utf-8').write(t)

c = os.path.join(ROOT, 'src/styles/sections.css')
css = open(c, encoding='utf-8').read()
css += '''
/* ===== GB Twin: foto de soja (drone + tablet à esquerda) e texto branco à direita, 50/50 ===== */
.twin { position: relative; isolation: isolate; min-height: min(100svh, 860px); display: grid; align-items: center; color: #eafaf0; background: #062414; overflow: hidden; }
.twin-bg { position: absolute; inset: 0; z-index: -1; }
.twin-bg img { width: 100%; height: 100%; object-fit: cover; object-position: left center; display: block; }
.twin-bg::after { content: ''; position: absolute; inset: 0; background:
  linear-gradient(90deg, rgba(4, 28, 14, 0) 0%, rgba(4, 28, 14, 0) 38%, rgba(4, 32, 16, .72) 58%, rgba(3, 26, 13, .9) 100%),
  linear-gradient(180deg, rgba(5, 25, 12, .35) 0%, rgba(5, 25, 12, 0) 22%, rgba(5, 25, 12, 0) 78%, rgba(5, 25, 12, .55) 100%); }
.twin-grid { width: min(1320px, 100% - 2 * var(--gutter)); margin-inline: auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 72px); padding: clamp(72px, 12vh, 140px) 0; }
.twin-copy { display: grid; gap: 18px; align-content: center; max-width: 560px; }
.twin .eyebrow { color: #86efac; margin: 0; }
.twin h2 { margin: 0; font-size: clamp(32px, 3.9vw, 56px); line-height: 1.05; font-weight: 600; letter-spacing: -.022em; color: #fff; max-width: 14ch; }
.twin-lead { margin: 0; font-size: clamp(16px, 1.25vw, 19px); line-height: 1.55; color: #d6efe0; max-width: 46ch; }
.twin-list { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 10px; }
.twin-list li { display: flex; gap: 12px; align-items: center; font-size: 16px; color: #f1fbf4; }
.twin-list li::before { content: ''; flex: none; width: 8px; height: 8px; border-radius: 3px; background: #4ade80; box-shadow: 0 0 0 4px rgba(74, 222, 128, .18); }
.twin-stats { margin: 6px 0 0; display: grid; grid-template-columns: repeat(3, auto); justify-content: start; gap: 28px; padding: 18px 0; border-block: 1px solid rgba(255, 255, 255, .18); }
.twin-stats dt { font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: #9ddfb4; }
.twin-stats dd { margin: 4px 0 0; font-size: clamp(24px, 2.4vw, 34px); font-weight: 600; color: #fff; font-variant-numeric: tabular-nums; }
.twin-stats small { font-size: .5em; font-weight: 500; color: #b6e8c6; margin-left: 2px; }
.twin-note { margin: 0; font-size: 13.5px; color: #a8d5b8; }
.twin .tbd { background: rgba(255, 246, 224, .14); border-color: #e8b34a; color: #ffe2a3; }
.btn-light { justify-self: start; background: #fff; color: #064e3b; border-color: #fff; }
.btn-light:hover { background: #e8f8ee; }
@media (max-width: 900px) {
  .twin { min-height: 0; align-items: end; }
  .twin-bg img { object-position: 12% center; }
  .twin-bg::after { background: linear-gradient(180deg, rgba(4, 28, 14, 0) 0%, rgba(4, 28, 14, 0) 26%, rgba(3, 26, 13, .85) 50%, rgba(3, 26, 13, .96) 100%); }
  .twin-grid { grid-template-columns: 1fr; padding: 0 0 56px; }
  .twin-spacer { height: clamp(250px, 56vw, 420px); }
  .twin-stats { gap: 18px; }
}
'''
open(c, 'w', encoding='utf-8').write(css)
print('ok')
