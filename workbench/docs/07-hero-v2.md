# Hero v2: como funciona

## Roteiro do scroll (pin de 420% da altura da tela)
| Fase | Scroll | O que acontece |
|---|---|---|
| 1. Plano contínuo | 0–55% | Sequência de quadros (canvas): ombro do fazendeiro com o tablet (Visão Geral real, modo claro, barras recolhidas) → afasta para as costas (polo verde, jeans, botina com terra) → sobe sobre o confinamento sem teto e os Nelores → soja com o drone agrícola mapeando → morros do ES ao amanhecer → tablet gigante sobe dos morros já com o sistema na tela |
| 2. Zoom no tablet | 55–64% | O still em alta assume no lugar do canvas e dá zoom centralizado no tablet (60% da largura no desktop, 96% no mobile); céu em cima e fazenda no rodapé continuam visíveis |
| 3. App rolando | 64–86% | A Visão Geral completa (página alta, `public/app/visao-geral-full.webp`) rola dentro da tela do tablet |
| 4. Hero | 86–100% | O tablet recua ao enquadramento natural; o vídeo do sistema (HyperFrames, loop de 18 s) começa a tocar na tela; título entra à esquerda e form à direita (mobile: título em cima, form embaixo); header ganha fundo de vidro |
| 2ª seção | após o pin | A plantação continua exatamente do rodapé do Hero (mesma escala e posição) e fica fixa (`position: sticky`) enquanto os cards passam por cima |

## Camadas da cena final (`frame-box`, mesma geometria do `cover` do canvas)
1. `final.webp`: K3 em alta, alinhado ao último quadro do vídeo.
2. `.tablet-screen`: app rolando e `<video>` do sistema, posicionados pelo retângulo do manifest.
3. `final-fg.webp`: recorte com alfa dos morros e da neblina que ficam **na frente** da tela (o tablet sai de trás dos morros).

## Pipeline (`video/hero-a/build_v2.py`)
- Telas geradas em magenta liso (`#FF00FF`), substituídas por recorte suave (chroma), assim dedos, morros e neblina continuam na frente.
- Tablet da mão: cantos por 4 retas ajustadas às bordas visíveis (reconstrói o canto que o polegar esconde) + homografia.
- Tablet gigante: lados e topo pelo magenta, base pela proporção (1,45); passada de trás para frente para quando o brilho esconde parte da tela.
- Divisor mão/gigante: o maior trecho do vídeo sem tela magenta.
- Chão da 2ª seção: o still final + a plantação em perspectiva (P) a partir da linha que casa com o rodapé + fusão com neblina leve na plantação próxima (P2).

## Números
| | Desktop | Mobile |
|---|---|---|
| Quadros | 160 × 1280 px | 150 × 608 px |
| Sequência | 8,55 MB | 5,0 MB |
| Cena final + chão (carregam após o 1º scroll) | ~2,0 MB | ~1,0 MB |
| Lighthouse mobile | — | performance 97, acessibilidade 100, LCP 2,1 s, CLS 0 |

## Pendências
- Clip desktop: faixa coberta na borda esquerda dos lotes entre 4 e 6 s (refazer custaria 9.480 créditos).
- No desktop entre ~1100 e 1440 px, o form sobrepõe levemente a borda direita do tablet (card flutuante).
- Vídeo do tablet (refeito em 2026-10-13): 1740×1200 (mesma proporção da tela, sem recorte), painéis em largura total rolando; a renderização usa GSAP via CDN (precisa de internet para re-renderizar). Telas em `video/hero-a/system-loop/assets/*-full.jpg` (de `tools/capture-tall.mjs`).
