"""Redesenha o funil do Ponto de partida (vidro verde 3D) e a esfera de luz final. Aplica em src/components/Sections.tsx e sections.css."""
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
p = os.path.join(ROOT, 'src/components/Sections.tsx')
s = open(p, encoding='utf-8').read()

# 1) drawFunnel
a = s.index('      // o funil liga a boca')
b = s.index('      drawFunnel()\n')
new = r'''      // o funil liga a boca (sob as peças) ao ponto da tela do notebook: vidro verde em 3D, redesenhado a cada refresh
      const drawFunnel = () => {
        const svg = q<SVGSVGElement>('.funnel'), m = mouth(), t = target(), d = t.y - m.y, a = m.w / 2, ry = Math.max(16, m.w * 0.07), neck = 15
        svg.setAttribute('viewBox', `0 0 ${W()} ${H()}`)
        const hw = (u: number) => neck + (a - neck) * Math.pow(1 - u, 2.15) // meia-largura do corpo em u (0 boca ... 1 bico)
        const yAt = (u: number) => m.y + u * d
        const N = 44, us = Array.from({ length: N + 1 }, (_, i) => i / N)
        const left = us.map((u) => `${(m.x - hw(u)).toFixed(1)} ${yAt(u).toFixed(1)}`)
        const rightRev = [...us].reverse().map((u) => `${(m.x + hw(u)).toFixed(1)} ${yAt(u).toFixed(1)}`)
        const bodyD = `M ${left.join(' L ')} L ${rightRev.join(' L ')} Z`
        const ring = (u: number, w: number, o: number) => {
          const x = hw(u), y = yAt(u), r = Math.max(2.5, x * 0.2)
          return `<path d="M ${m.x - x} ${y} A ${x} ${r} 0 0 0 ${m.x + x} ${y}" fill="none" stroke="#ecfdf5" stroke-opacity="${o}" stroke-width="${w}"/>` +
                 `<path d="M ${m.x - x} ${y} A ${x} ${r} 0 0 1 ${m.x + x} ${y}" fill="none" stroke="#065f46" stroke-opacity="${o * 0.35}" stroke-width="${w * 0.8}"/>`
        }
        const streak = (k: number, w: number, o: number, u0 = 0.06, u1 = 0.74) => {
          const pts = us.filter((u) => u >= u0 && u <= u1).map((u) => `${(m.x + k * hw(u) * 0.78).toFixed(1)} ${yAt(u).toFixed(1)}`)
          return `<path d="M ${pts.join(' L ')}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`
        }
        const rim = `<ellipse cx="${m.x}" cy="${m.y}" rx="${a}" ry="${ry}" fill="url(#fn-inside)"/>` +
          `<ellipse cx="${m.x}" cy="${m.y}" rx="${a - 5}" ry="${ry - 3}" fill="none" stroke="#022c22" stroke-opacity=".5" stroke-width="2"/>`
        const rimFront = `<path d="M ${m.x - a} ${m.y} A ${a} ${ry} 0 0 0 ${m.x + a} ${m.y}" fill="none" stroke="#a7f3d0" stroke-width="5" stroke-linecap="round"/>` +
          `<path d="M ${m.x - a} ${m.y} A ${a} ${ry} 0 0 1 ${m.x + a} ${m.y}" fill="none" stroke="#34d399" stroke-opacity=".7" stroke-width="2.5"/>` +
          `<path d="M ${m.x - a * 0.9} ${m.y + ry * 0.55} A ${a} ${ry} 0 0 0 ${m.x + a * 0.9} ${m.y + ry * 0.55}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>`
        const tube = `<ellipse cx="${m.x}" cy="${t.y}" rx="${neck}" ry="4.5" fill="#064e3b" stroke="#6ee7b7" stroke-width="2"/>`
        svg.querySelector('.funnel-shell')!.innerHTML =
          `<path d="${bodyD}" fill="none" stroke="#34d399" stroke-width="10" stroke-opacity=".55" filter="url(#fn-glow)"/>` +
          rim +
          `<path d="${bodyD}" fill="url(#fn-body)"/><path d="${bodyD}" fill="url(#fn-shade)"/>` +
          [0.1, 0.22, 0.36, 0.52, 0.68, 0.84].map((u, i) => ring(u, 1.2 + i * 0.08, 0.55 - i * 0.04)).join('') +
          streak(-0.62, 7, 0.3) + streak(-0.58, 2.2, 0.75, 0.08, 0.6) + streak(0.7, 3.2, 0.2) +
          `<path d="M ${left.join(' L ')}" fill="none" stroke="#6ee7b7" stroke-width="2"/>` +
          `<path d="M ${us.map((u) => `${(m.x + hw(u)).toFixed(1)} ${yAt(u).toFixed(1)}`).join(' L ')}" fill="none" stroke="#047857" stroke-width="2"/>` +
          tube + rimFront
        for (const [cls, r] of [['.orb-halo', 30], ['.orb-core', 9], ['.orb-bloom', 44]] as const) {
          const c = svg.querySelector(cls)!
          c.setAttribute('cx', `${m.x}`); c.setAttribute('cy', `${t.y + 6}`); c.setAttribute('r', `${r}`)
        }
      }
'''
s = s[:a] + new + s[b:]

# 2) timeline
old = s[s.index("        .to('.funnel', { autoAlpha: 0, duration: 0.06 }, 0.72)"):s.index("        .fromTo('.product-head'")]
tl = '''        // a esfera de luz nasce no bico, pulsa, cresce e "estoura" revelando o produto nítido; o funil se dissolve
        .fromTo('.orb-core', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: 'back.out(2)', duration: 0.05 }, 0.62)
        .fromTo('.orb-halo', { scale: 0.2, autoAlpha: 0 }, { scale: 1.6, autoAlpha: 0.9, ease: 'power2.out', duration: 0.08 }, 0.62)
        .to('.orb-core', { scale: 1.9, duration: 0.05, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0.67)
        .to('.funnel-shell', { autoAlpha: 0, y: -10, duration: 0.09, ease: 'power2.in' }, 0.7)
        .fromTo('.orb-bloom', { scale: 0.05, autoAlpha: 0.95 }, { scale: 26, autoAlpha: 0, ease: 'power3.out', duration: 0.2 }, 0.76)
        .to('.orb-core, .orb-halo', { scale: 6, autoAlpha: 0, duration: 0.1, ease: 'power2.out' }, 0.76)
        .to('.product-img', { autoAlpha: 1, scale: 1, y: 0, rotateX: 0, filter: 'blur(0px)', ease: 'power3.out', duration: 0.18 }, 0.77)
'''
s = s.replace(old, tl)

# 3) markup do svg
a = s.index('        <svg className="funnel" aria-hidden="true">')
b = s.index('        </svg>\n', a) + len('        </svg>\n')
svg = '''        <svg className="funnel" aria-hidden="true">
          <defs>
            <linearGradient id="fn-body" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#047857" stopOpacity=".62" />
              <stop offset=".2" stopColor="#6ee7b7" stopOpacity=".5" />
              <stop offset=".5" stopColor="#10b981" stopOpacity=".26" />
              <stop offset=".8" stopColor="#059669" stopOpacity=".42" />
              <stop offset="1" stopColor="#064e3b" stopOpacity=".66" />
            </linearGradient>
            <linearGradient id="fn-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity=".2" />
              <stop offset=".55" stopColor="#047857" stopOpacity="0" />
              <stop offset="1" stopColor="#022c22" stopOpacity=".38" />
            </linearGradient>
            <radialGradient id="fn-inside" cx=".5" cy=".4" r=".7">
              <stop offset="0" stopColor="#022c22" stopOpacity=".92" />
              <stop offset="1" stopColor="#065f46" stopOpacity=".7" />
            </radialGradient>
            <radialGradient id="fn-orb">
              <stop offset="0" stopColor="#fff" />
              <stop offset=".35" stopColor="#bbf7d0" />
              <stop offset="1" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="fn-bloom">
              <stop offset="0" stopColor="#fff" stopOpacity=".95" />
              <stop offset=".4" stopColor="#a7f3d0" stopOpacity=".6" />
              <stop offset="1" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <filter id="fn-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
          </defs>
          <g className="funnel-shell" />
          <circle className="orb-bloom" fill="url(#fn-bloom)" />
          <circle className="orb-halo" fill="url(#fn-orb)" />
          <circle className="orb-core" fill="#fff" stroke="#34d399" strokeWidth="3" />
        </svg>
'''
s = s[:a] + svg + s[b:]
open(p, 'w', encoding='utf-8').write(s)

c = open(os.path.join(ROOT, 'src/styles/sections.css'), encoding='utf-8').read()
c += '''
/* funil: esfera de luz (transformações em torno do próprio centro) */
.funnel .orb-core, .funnel .orb-halo, .funnel .orb-bloom { transform-box: fill-box; transform-origin: center; opacity: 0; }
.funnel-shell { transform-box: fill-box; transform-origin: center top; }
.product-pulse { display: none !important; }
'''
open(os.path.join(ROOT, 'src/styles/sections.css'), 'w', encoding='utf-8').write(c)
print('ok')
