# LP Cerne: Hero em alta fidelidade

Vite + React + TypeScript + GSAP (ScrollTrigger) + Lenis, tema claro. O Hero abre no ombro de um fazendeiro com o Cerne no tablet e, num único plano contínuo, sobe pelo confinamento e pela lavoura de soja até um tablet gigante emergir dos morros; o app rola dentro dele, o vídeo do sistema entra em loop e aparecem título e form. A 2ª seção continua a plantação como fundo fixo.

## Como rodar
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
npm run preview
```
Formulário: copie `.env.example` para `.env` e preencha `VITE_FORM_ENDPOINT` (POST JSON `{email, whatsapp, consent}`). Sem endpoint, o form roda em mock local e nada é enviado.

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `src/components` | `Hero`, `ScrubCanvas`, `HeroForm`, `Header`, `GroundSection` (2ª seção), `Sections` (Problema → rodapé) |
| `src/lib` | `scroll` (Lenis + ScrollTrigger), `stage` (geometria da cena final), `form` (validação/envio), `reveal`, `defer` |
| `src/lib/scroll.ts` | Lenis sincronizado ao ScrollTrigger; detecção de movimento reduzido e conexão lenta |
| `src/styles` | `tokens.css` (tema claro + GB Mode, Outfit self-hosted) e `app.css` |
| `public/frames/hero/{desktop,mobile}` | quadros WebP, cena final (`final`, `final-fg`), chão da 2ª seção e `manifest.json` |
| `public/app`, `public/video` | Visão Geral completa (rola no tablet) e vídeo do sistema em loop |
| `video/hero-a` | `build_v2.py` + `track_screen.py` (composição) e `system-loop/` (HyperFrames) |
| `assets/capture` | screenshots reais do web (usuário mock; `light/` = modo claro) |
| `assets/gen-v2` | originais do Magnific do Hero v2 (`assets/gen` = v1) |
| `tools` | captura do web e screenshots de QA (puppeteer-core) |

## Como regerar os frames (Hero v2)
1. Capturas do web em modo claro com as barras recolhidas (web rodando em :5173):
   ```bash
   cd tools && npm install && node capture-light.mjs && node capture-tall.mjs
   ```
2. Vídeos e imagens do Magnific em `assets/gen-v2/` (ver `docs/05-registro-geracoes.md` e `docs/06-hero-v2-prompts.md`).
3. Composição + quadros + cena final + chão da 2ª seção:
   ```bash
   python video/hero-a/build_v2.py desktop
   python video/hero-a/build_v2.py mobile
   ```
   Requer Python com OpenCV (`opencv-python-headless`), numpy e Pillow, e ffmpeg no PATH.
4. Vídeo do sistema no tablet: `video/hero-a/system-loop/` (HyperFrames), renders em `public/video/`.
5. QA: `cd tools && node shots.mjs 1440 900 d1440` (e `390 844 m390 mobile`), screenshots em `docs/shots/v2/`.

Detalhes do funcionamento: `docs/07-hero-v2.md`. Arquitetura da página, copy e cores: `docs/08-arquitetura-da-pagina.md`.

QA da página inteira: `cd tools && node page.mjs 1440 900 d1440 0 <url>` (screenshots em `docs/shots/v3/`).

## Comportamento
- Pin de 420% da altura da tela, em 4 fases (ver `docs/07-hero-v2.md`).
- Primeiro quadro desenhado de imediato; o resto carrega em lotes de 6.
- `prefers-reduced-motion` ou conexão lenta/Save-Data: poster final e conteúdo visíveis, sem scrub nem Lenis.
- Mobile (≤ 820 px): plano vertical separado, título em cima, tablet no meio e form embaixo.
- A cena final e o chão da 2ª seção só carregam após o primeiro scroll (ou 3,5 s), para não disputar banda com o primeiro quadro.
