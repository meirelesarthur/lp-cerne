
## Aplicado (2026-10-16, só código, sem mexer em hospedagem)
Medição local (Lighthouse mobile, preview do build): **92 → 99** (2 rodadas). FCP 1,5 s, LCP 2,1 s, TBT 20-30 ms, CLS 0, SI 1,5 s. Carregamento inicial **8,7 MB → 280 KB** (128 → ~10 requisições).
- **LCP:** poster do Hero como `<img fetchpriority="high">` no HTML (`Hero.tsx`) e preload com `fetchpriority="high"` (`index.html`); não espera mais manifesto nem JS.
- **Quadros sob demanda:** `ScrubCanvas` só baixa o 1º quadro no início; o resto começa na 1ª interação (ou após 10 s) em ordem de proximidade da posição de rolagem, 4 em paralelo (2 com economia de dados). `lib/defer.ts` ganhou `onFirstInteraction`.
- **JS dividido:** tudo abaixo do Hero (Problema … FAQ) foi para o chunk `Below` (46 KB), montado na 1ª interação (ou 6 s); rodapé idem. `reveal.ts` não registra elemento duas vezes. Main: 392 → 371 KB.
- **Mídia adiada:** estágio final do Hero (ground/final/app/vídeo) e mídia das seções só após a 1ª interação (ou 8-9 s); fundo da seção Sistema só quando está perto da tela (antes carregava de imediato).
- **Imagens do estágio final em AVIF** quando o navegador suporta (ground 971→476 KB, final 537→206 KB no desktop; celular ~metade), WebP de reserva. Arquivos `.avif` já no R2.
- **Fonte:** preload da Outfit latin variável injetado no HTML (`vite.config.ts`).
- **Cache:** `public/_headers` com `immutable` para `/assets/*`.
- **Ainda de fora (exigem hospedagem):** domínio próprio no bucket R2 (estabiliza o número no PageSpeed real) e cache de borda dos quadros.
- Script de patch: `workbench/tools/patch_perf.py`; verificação ponta a ponta: `workbench/tools/perf-check.mjs`.
