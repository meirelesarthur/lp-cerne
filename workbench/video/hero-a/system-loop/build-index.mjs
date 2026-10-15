// Gera index.html do loop do sistema. Uso: node build-index.mjs
// Quadro 1740x1200 = mesma proporção da tela do tablet gigante (1,45), então nada é recortado no site.
// Cada painel aparece em largura total (sem zoom) e rola suavemente para baixo, como alguém navegando.
import fs from "node:fs";

const W = 1740, H = 1200, DUR = 18;
const heights = JSON.parse(fs.readFileSync("assets/heights.json", "utf8"));
// t = início, d = duração, pan = fração do conteúdo extra (abaixo da dobra) percorrida na cena
const scenes = [
  { id: "visao", img: "visao-geral", t: 0, d: 4.0, pan: [0, 0.32] },
  { id: "pecuaria", img: "pecuaria", t: 3.6, d: 3.2, pan: [0, 1] },
  { id: "lotacao", img: "lotacao-currais", t: 6.4, d: 3.2, pan: [0, 1] },
  { id: "custos", img: "custos-confinamento", t: 9.2, d: 3.2, pan: [0, 1] },
  { id: "financeiros", img: "financeiros", t: 12.0, d: 3.4, pan: [0, 1] },
  // volta ao topo da Visão Geral: o último quadro é igual ao primeiro (loop sem emenda)
  { id: "final", img: "visao-geral", t: 15.0, d: 3.0, pan: [0, 0] },
].map((s) => ({ ...s, extra: Math.max(0, heights[s.img] - H) }));

const clips = scenes.map((s, i) => `      <section id="${s.id}" class="clip scene" data-start="${s.t}" data-duration="${s.d}" data-track-index="${i}">
        <div class="page" id="${s.id}-page"><img id="${s.id}-img" src="assets/${s.img}-full.jpg" alt="" /></div>
      </section>`).join("\n");

const js = `
    const scenes = ${JSON.stringify(scenes)};
    const tl = gsap.timeline({ paused: true });
    scenes.forEach((sc, i) => {
      const img = "#" + sc.id + "-img", pg = "#" + sc.id + "-page";
      if (sc.extra > 0 && sc.pan[1] !== sc.pan[0]) {
        tl.fromTo(img, { y: -sc.extra * sc.pan[0] }, { y: -sc.extra * sc.pan[1], duration: sc.d - 0.6, ease: "sine.inOut" }, sc.t + 0.3);
      } else {
        tl.set(img, { y: 0 }, sc.t);
      }
      if (i > 0) tl.fromTo(pg, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power1.out" }, sc.t);
    });
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;
`;

fs.writeFileSync("index.html", `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>Cerne System Loop</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #f3f4f3; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #f3f4f3; }
      .scene { position: absolute; inset: 0; overflow: hidden; background: #f3f4f3; }
      .page { position: absolute; inset: 0; background: #f3f4f3; }
      .page img { position: absolute; left: 0; top: 0; width: ${W}px; height: auto; display: block; will-change: transform; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">
${clips}
    </div>
    <script>${js}    </script>
  </body>
</html>
`);
console.log("index.html gerado:", scenes.map((s) => `${s.id} (pan ${Math.round(s.extra * (s.pan[1] - s.pan[0]))}px)`).join(", "));
