// Maquete isométrica "Fazenda no Cerne" (skill Anatomy, kit em tools/iso/kit, MIT).
// Uma fazenda em quatro setores (sede, confinamento, estoque, lavoura) sobre um bloco de terra.
// Gera src/figures/fazenda/art.ts (SVG estático + dados para a parte viva) e uma página de conferência.
// Uso: node tools/iso/fazenda/build.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const OUT_TS = join(ROOT, "src", "figures", "fazenda");
const OUT_HTML = join(HERE, "out");

// ───────── materiais: cor base → topo, 4 faces e traços ─────────
const MATS = {
  grass: "#a9cf88", soil: "#b88a5c", dirt: "#e3cfa3", field: "#caa77a", crop: "#73b055", cropDark: "#5f9a45",
  pen: "#cdb48a", concrete: "#e4e4de", wall: "#f5f2ea", floor: "#efe6d6", roof: "#aebcc0", roofRed: "#c96a4c",
  silo: "#dfe3e1", steel: "#9aa4a6", wood: "#b48b5f", trunk: "#8d6b48", leaf: "#6faa52", leaf2: "#86bb5e",
  cow: "#ece8df", cowDark: "#8f857c", water: "#8ccbe0", tractor: "#2f8f5b", planter: "#d0703f", tyre: "#4a4a4a",
  cab: "#f4f4f1", wagon: "#4f7b63", glass: "#bfdbe4", bag: "#e8dcbf", shirt: "#3f7fb4", skin: "#d9a982", desk: "#c9a57a",
  pickup: "#d9dfe2", feed: "#d9b46a", screen: "#26302b",
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mul = (h, f) => "#" + hex(h).map((c) => Math.max(0, Math.min(255, Math.round(f >= 1 ? c + (255 - c) * (f - 1) : c * f))).toString(16).padStart(2, "0")).join("");
const MAT_CSS = Object.entries(MATS)
  .map(([n, c]) => `.m-${n}{--anatomy-paper:${mul(c, 1.04)};--anatomy-face:${mul(c, 1.06)};--anatomy-top:${mul(c, 1.08)};--anatomy-lit-top:${mul(c, 1.14)};--anatomy-shade-3:${mul(c, 0.98)};--anatomy-shade-2:${mul(c, 0.92)};--anatomy-shade-1:${mul(c, 0.86)};--anatomy-shade-0:${mul(c, 0.8)};--anatomy-hi:${mul(c, 0.42)};--anatomy-mid:${mul(c, 0.56)};--anatomy-lo:${mul(c, 0.7)};--anatomy-faint:${mul(c, 0.84)};--anatomy-dot:${mul(c, 0.4)};--mc:${c}}`)
  .join("\n");

// ───────── mundo e câmera ─────────
const W = 760;
const H = 430;
const BASE = { x: -270, y: -190, w: 540, d: 380, r: 16 };
const P = k.fitProjection(
  [...k.boxCorners(BASE, -28, 0), [-120, 60, 66], [-100, 84, 74], [-205, 110, 50], [14, -170, 30]],
  W, H, { pad: 6 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style = {}) => k.solidSvg(paths, { tone: "mid", ...style });
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const box = (plan, z, h, steps = 2, bevel = 0) => k.slabOf({ r: 0.3, ...plan }, z, h, P, steps, bevel);
const cyl = (x, y, r, z, h, steps = 20, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel);
// a cor vai direto no grupo do sólido quando é um só; senão, um grupo em volta
const M = (mat, inner) =>
  inner.startsWith('<g class="iso-solid"') && inner.split('<g class="iso-solid').length === 2 ? inner.replace('<g class="iso-solid"', `<g class="iso-solid m-${mat}"`) : `<g class="m-${mat}">${inner}</g>`;
const depth = (p) => k.depthOf(p, P);
const poly = (pts, cls, extra = "") => `<path class="${cls}"${extra} d="${k.pathOf(pts.map(at), true)}"/>`;
const flatPlan = (plan, z = 0) => k.pathOf(k.roundedPlan({ r: 0, ...plan }, 3).map(([x, y]) => at([x, y, z])), true);

// itens em ordem de pintura: chave = profundidade do ponto de referência
const items = [];
const put = (ref, svg, zone, bias = 0) => items.push({ key: depth(ref) + bias, y: ref[1], svg, zone });

// ───────── base: bloco de terra com gramado ─────────
const ground = [];
ground.push(`<path class="iso-halo" d="${k.haloOf(BASE, -28, 12, P)}"/>`);
ground.push(M("soil", S(box(BASE, -28, 24, 8, 0), { inner: L(k.sideSeam(BASE, -12, P, 8) + k.sideSeam(BASE, -20, P, 8), { tone: "faint" }) })));
// pedrinhas no barranco
const pebbles = [];
for (let i = 0; i < 36; i++) {
  const t = (i * 0.618) % 1;
  const z = -26 + ((i * 7.31) % 20);
  const side = i % 2 === 0;
  const p = side ? [BASE.x + BASE.w, BASE.y + 20 + t * (BASE.d - 40), z] : [BASE.x + 20 + t * (BASE.w - 40), BASE.y + BASE.d, z];
  pebbles.push(at(p));
}
ground.push(M("soil", D(pebbles, { size: 0.7, tone: "mid" })));
ground.push(M("grass", S(box(BASE, -4, 4, 8, 1), { crease: "lo" })));

// estradas de chão
const ROAD_X = { x: -264, y: -8, w: 528, d: 18 };
const ROAD_Y = { x: -14, y: -184, w: 18, d: 368 };
ground.push(`<g class="m-dirt"><path class="iso-fill fz-flat" d="${flatPlan(ROAD_X)}${flatPlan(ROAD_Y)}"/>${L(k.onTop([[ROAD_X.x, -3], [ROAD_X.x + ROAD_X.w, -3]], 0, P) + k.onTop([[ROAD_X.x, 5], [ROAD_X.x + ROAD_X.w, 5]], 0, P) + k.onTop([[-9, ROAD_Y.y], [-9, -8]], 0, P) + k.onTop([[-9, 10], [-9, ROAD_Y.y + ROAD_Y.d]], 0, P) + k.onTop([[-1, ROAD_Y.y], [-1, -8]], 0, P) + k.onTop([[-1, 10], [-1, ROAD_Y.y + ROAD_Y.d]], 0, P), { tone: "faint" })}</g>`);

// ───────── LAVOURA (fundo, à esquerda) ─────────
const T1 = { x: -258, y: -182, w: 104, d: 160 };
const T2 = { x: -144, y: -182, w: 112, d: 160 };
const LANE = 9.4;
const LANES = Math.floor(T2.d / LANE);
ground.push(`<g data-zone="lavoura">`);
ground.push(`<g class="m-field"><path class="iso-fill fz-flat" d="${flatPlan(T1)}${flatPlan(T2)}"/><path class="iso-line" data-tone="lo" d="${flatPlan(T1)}${flatPlan(T2)}"/></g>`);
// sulcos do talhão 2 (ainda por plantar) e faixas que o trator vai plantando
const furrows = [];
for (let i = 0; i <= LANES; i++) furrows.push(k.onTop([[T2.x, T2.y + i * LANE], [T2.x + T2.w, T2.y + i * LANE]], 0, P));
ground.push(M("field", L(furrows.join(""), { tone: "faint" })));
ground.push(`<g class="m-crop fz-strips">${Array.from({ length: LANES }, (_, i) => `<path class="fz-strip" data-lane="${i}" d=""/>`).join("")}</g>`);
// talhão 1: lavoura formada (milho), um bloco baixo com as linhas de plantio
const rows = [];
for (let y = T1.y + 5; y < T1.y + T1.d - 2; y += 6) rows.push(k.onTop([[T1.x + 1, y], [T1.x + T1.w - 1, y]], 5, P));
ground.push(`</g>`);
put([T1.x, T1.y, 0], `<g data-zone="lavoura">${M("crop", S(box({ ...T1, x: T1.x + 1, y: T1.y + 1, w: T1.w - 2, d: T1.d - 2 }, 0, 5, 2, 0.6), { crease: "lo", inner: "" }) + L(rows.join(""), { tone: "lo" }))}</g>`, "lavoura", -400);

// ───────── árvores ─────────
function tree(x, y, s = 1, kind = "leaf") {
  const out = [];
  out.push(M("trunk", S(cyl(x, y, 1.5 * s, 0, 11 * s, 8), { crease: "none" })));
  out.push(M(kind, S(G.sphereOf([x, y, 16 * s], 7.4 * s, P, { steps: 20 }), { tone: "mid" })));
  out.push(M(kind, S(G.sphereOf([x + 2.4 * s, y + 2.6 * s, 20.5 * s], 4.6 * s, P, { steps: 18 }), { tone: "mid" })));
  return `<path class="iso-halo fz-shadow" d="${k.cylinder(x + 3, y + 3, 7 * s, 0, 0.1, P, 24).fill}"/>` + out.join("");
}
for (const [x, y, s, kind] of [[14, -172, 1, "leaf"], [16, -136, 0.9, "leaf2"], [14, -100, 1.05, "leaf"], [16, -62, 0.85, "leaf2"], [-258, 34, 1, "leaf2"], [-30, 172, 1, "leaf"], [26, 174, 0.9, "leaf2"], [254, 34, 1, "leaf"], [256, 172, 1.1, "leaf2"], [62, 178, 0.8, "leaf"], [-262, -6 + 30, 0.8, "leaf"]]) {
  put([x, y, 0], tree(x, y, s, kind), null);
}

// ───────── CONFINAMENTO (fundo, à direita) ─────────
const PEN_X = [28, 103.3, 178.6, 254];
const PEN_Y0 = -176;
const PEN_Y1 = -24;
const COCHO = { x: 28, y: -23, w: 226, d: 6 };
ground.push(`<g data-zone="confinamento"><g class="m-pen"><path class="iso-fill fz-flat" d="${flatPlan({ x: 28, y: PEN_Y0, w: 226, d: PEN_Y1 - PEN_Y0 })}"/></g>`);
// marcas de casco e esterco no chão dos currais
const marks = [];
for (let i = 0; i < 60; i++) marks.push(at([30 + ((i * 37.7) % 222), PEN_Y0 + 4 + ((i * 53.3) % 140), 0]));
ground.push(M("pen", D(marks, { size: 0.6, tone: "lo" })));
ground.push(`</g>`);

const post = (x, y, h = 15) => M("wood", S(box({ x: x - 1.3, y: y - 1.3, w: 2.6, d: 2.6 }, 0, h, 2), { crease: "none" }));
const rail = (a, b, z) => `<path class="fz-rail" d="${k.pathOf([at([a[0], a[1], z]), at([b[0], b[1], z])])}"/>`;
function fenceLine(a, b, step, zone, rails = [6, 11], h = 15) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const p = [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n];
    put([p[0], p[1], 0], `<g data-zone="${zone}">${post(p[0], p[1], h)}</g>`, zone, 0.2);
    if (i < n) {
      const q = [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n];
      put([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0], `<g data-zone="${zone}">${rails.map((z) => rail(p, q, z)).join("")}</g>`, zone, 0.1);
    }
  }
}
fenceLine([28, PEN_Y0], [254, PEN_Y0], 25, "confinamento");
for (const x of PEN_X) fenceLine([x, PEN_Y0], [x, PEN_Y1], 25.4, "confinamento");
// cocho de concreto na frente, com a canga (régua de pescoço) por cima
put([141, -20, 0], `<g data-zone="confinamento">${M("concrete", S(box(COCHO, 0, 5, 2, 0.5), { crease: "lo" }))}${M("concrete", L(flatPlan({ x: COCHO.x + 1.2, y: COCHO.y + 1.2, w: COCHO.w - 2.4, d: COCHO.d - 2.4 }, 5), { tone: "mid" }))}<g class="m-feed">${[0, 1, 2].map((i) => `<path class="iso-fill fz-feed" data-feed="${i}" d=""/>`).join("")}</g></g>`, "confinamento", 502);
for (let i = 0; i < PEN_X.length; i++) put([PEN_X[i], PEN_Y1, 0], `<g data-zone="confinamento">${post(PEN_X[i], PEN_Y1, 19)}</g>`, "confinamento", 501);
put([141, -24, 0], `<g data-zone="confinamento">${[14, 18].map((z) => rail([28, PEN_Y1], [254, PEN_Y1], z)).join("")}</g>`, "confinamento", 500);

// bebedouros (fundo de cada curral)
for (let i = 0; i < 3; i++) {
  const cx = PEN_X[i] + 14;
  const cy = PEN_Y0 + 16;
  put([cx, cy, 0], `<g data-zone="confinamento">${M("concrete", S(cyl(cx, cy, 6.5, 0, 4.5, 28, 0.4), { crease: "lo" }))}<g class="m-water"><path class="iso-fill fz-flat" d="${k.onTop(k.circleRing(cx, cy, 5.2, 28), 4.5, P, true)}"/></g></g>`, "confinamento");
}

// gado Nelore: corpo claro, cupim, cabeça e pernas; virado para o cocho (+y) ou para os lados
const DIRS = { "+x": ([x, y]) => [x, y], "-x": ([x, y]) => [-x, -y], "+y": ([x, y]) => [-y, x], "-y": ([x, y]) => [y, -x] };
function rplan(plan, dir, ox, oy) {
  const f = DIRS[dir];
  const a = f([plan.x, plan.y]);
  const b = f([plan.x + plan.w, plan.y + plan.d]);
  return { x: ox + Math.min(a[0], b[0]), y: oy + Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), d: Math.abs(b[1] - a[1]), r: plan.r ?? 0.4 };
}
// desenha peças (caixas locais) num veículo/animal, em ordem de profundidade
function assemble(parts, dir, ox, oy, oz = 0) {
  const placed = parts.map((p) => {
    const plan = rplan(p.plan, dir, ox, oy);
    return { ...p, plan, ref: depth([plan.x + plan.w / 2, plan.y + plan.d / 2, 0]) + (p.z + oz) * 0.02 + (p.bias ?? 0) };
  });
  placed.sort((a, b) => a.ref - b.ref);
  return placed.map((p) => (p.wrap ? p.wrap(M(p.mat, S(box(p.plan, p.z + oz, p.h, p.steps ?? 2, p.bevel ?? 0), { crease: p.crease ?? "faint", tone: p.tone ?? "mid" }))) : M(p.mat, S(box(p.plan, p.z + oz, p.h, p.steps ?? 2, p.bevel ?? 0), { crease: p.crease ?? "faint", tone: p.tone ?? "mid" })))).join("");
}
const HEAD_DROP = k.axisVector(P, [0, 0, -2.6]);
function cow(x, y, dir, dark = false, eats = false) {
  const body = dark ? "cowDark" : "cow";
  const legs = [-5.6, 4.0].map((lx) => ({ plan: { x: lx, y: -2.6, w: 1.6, d: 5.2, r: 0.3 }, z: 0, h: 7, mat: body, bias: -0.5, crease: "none" }));
  const front = dir === "+x" || dir === "+y";
  const head = { plan: { x: 6.6, y: -2, w: 5.4, d: 4, r: 1 }, z: 9, h: 5, mat: body, crease: "none", bias: front ? 1 : -1, wrap: eats ? (s) => `<g class="fz-head" style="--hx:${HEAD_DROP[0].toFixed(2)}px;--hy:${HEAD_DROP[1].toFixed(2)}px;--hd:${((x * 7 + y * 3) % 17) / 10}s">${s}</g>` : null };
  const parts = [
    ...legs,
    { plan: { x: -7.4, y: -3.4, w: 14.8, d: 6.8, r: 2 }, z: 6, h: 7, mat: body, steps: 3 },
    { plan: { x: 2.2, y: -1.8, w: 3.6, d: 3.6, r: 1.2 }, z: 13, h: 2.6, mat: "cowDark", steps: 3, crease: "none" },
    head,
  ];
  return `<path class="iso-halo fz-shadow" d="${k.cylinder(x + 1, y + 1, 7, 0, 0.1, P, 20).fill}"/>` + assemble(parts, dir, x, y);
}
const HERD = [
  // curral 1
  [48, -36, "+y", false, true], [70, -38, "+y", true, true], [90, -35, "+y", false, true], [58, -92, "+x", false], [84, -130, "-x", true], [52, -150, "+y", false],
  // curral 2
  [122, -36, "+y", false, true], [146, -37, "+y", false, true], [166, -36, "+y", true, true], [130, -100, "-y", false], [158, -84, "+x", false], [140, -146, "+x", true],
  // curral 3
  [198, -36, "+y", false, true], [222, -38, "+y", true, true], [242, -36, "+y", false, true], [206, -110, "+x", false], [234, -76, "-x", false], [218, -150, "+y", true],
];
for (const [x, y, dir, dark, eats] of HERD) put([x, y + (dir === "+y" ? 6 : 0), 0], `<g data-zone="confinamento">${cow(x, y, dir, dark, eats)}</g>`, "confinamento");

// ───────── ESTOQUE (frente, à esquerda) ─────────
const YARD = { x: -258, y: 24, w: 216, d: 160 };
ground.push(`<g data-zone="estoque"><g class="m-dirt"><path class="iso-fill fz-flat" d="${flatPlan(YARD)}"/></g></g>`);
// galpão de insumos com telhado de duas águas
function shed() {
  const out = [];
  const Wp = { x: -244, y: 60, w: 74, d: 108 };
  const top = 30;
  const ridge = 46;
  const rx = Wp.x + Wp.w / 2;
  out.push(`<path class="iso-halo" d="${k.haloOf(Wp, 0, 6, P)}" style="opacity:.25"/>`);
  out.push(M("wall", S(box(Wp, 0, top, 2), { crease: "none", inner: L(k.sideSeam(Wp, 4, P, 2), { tone: "faint" }) })));
  // portão aberto na face +x e janelas altas
  const fx = Wp.x + Wp.w;
  out.push(poly([[fx, 92, 0], [fx, 136, 0], [fx, 136, 22], [fx, 92, 22]], "fz-dark"));
  out.push(M("wall", L(k.pathOf([[fx, 92, 0], [fx, 92, 22], [fx, 136, 22], [fx, 136, 0]].map(at)), { tone: "mid" })));
  for (const y of [70, 148]) out.push(poly([[fx, y, 14], [fx, y + 12, 14], [fx, y + 12, 22], [fx, y, 22]], "fz-glass"));
  // sacaria vista pelo portão
  out.push(M("bag", S(box({ x: fx - 10, y: 98, w: 8, d: 14 }, 0, 8, 2, 0.4))));
  out.push(M("bag", S(box({ x: fx - 10, y: 116, w: 8, d: 14 }, 0, 12, 2, 0.4))));
  // empena (frente +y)
  const fy = Wp.y + Wp.d;
  out.push(`<g class="m-wall">${poly([[Wp.x, fy, top], [fx, fy, top], [rx, fy, ridge]], "iso-shade", ' data-shade="3"')}${L(k.pathOf([[Wp.x, fy, top], [rx, fy, ridge], [fx, fy, top]].map(at)), { tone: "mid" })}</g>`);
  // telhado
  const e = 5;
  const left = [[Wp.x - e, Wp.y - 3, top - 2], [rx, Wp.y - 3, ridge], [rx, fy + 3, ridge], [Wp.x - e, fy + 3, top - 2]];
  const right = [[rx, Wp.y - 3, ridge], [fx + e, Wp.y - 3, top - 2], [fx + e, fy + 3, top - 2], [rx, fy + 3, ridge]];
  const ribs = [];
  for (let y = Wp.y; y <= fy; y += 6) ribs.push(k.pathOf([at([rx, y, ridge]), at([fx + e, y, top - 2])]));
  out.push(`<g class="m-roof">${poly(left, "iso-top")}${poly(right, "iso-shade", ' data-shade="2"')}${L(ribs.join(""), { tone: "faint" })}${L(k.pathOf(left.map(at), true) + k.pathOf(right.map(at), true), { tone: "mid" })}</g>`);
  return out.join("");
}
put([-207, 114, 0], `<g data-zone="estoque">${shed()}</g>`, "estoque");
// paletes de sacaria no pátio
for (const [x, y, n] of [[-156, 140, 2], [-156, 158, 1], [-140, 150, 2]]) {
  put([x, y, 0], `<g data-zone="estoque">${M("wood", S(box({ x, y, w: 12, d: 12 }, 0, 1.6, 2)))}${Array.from({ length: n }, (_, i) => M("bag", S(box({ x: x + 0.6, y: y + 0.6, w: 10.8, d: 10.8, r: 1 }, 1.6 + i * 5, 5, 3, 0.5), { crease: "lo" }))).join("")}</g>`, "estoque");
}
// silos de grãos com escada e telhado cônico
function silo(x, y, r, h) {
  const out = [`<path class="iso-halo" d="${k.cylinder(x, y, r, 0, 4, P, 40).fill}" style="opacity:.25"/>`];
  out.push(M("concrete", S(cyl(x, y, r + 2, 0, 3, 40, 0.4))));
  const rings = [];
  for (let z = 9; z < h; z += 6) rings.push(k.sideArc(x, y, r, z, P, 32));
  out.push(M("silo", S(cyl(x, y, r, 3, h - 3, 48), { inner: L(rings.join(""), { tone: "faint" }) })));
  const F = G.frameAlong([x, y, h], [0, 0, 1]);
  out.push(M("silo", S(G.solidOf([[0, r + 1.2], [9, 3], [11, 3]], F, P, { smooth: false }), { tone: "mid" })));
  // escada na face visível
  const a = Math.PI / 4;
  const lx = x + Math.cos(a) * (r + 0.6);
  const ly = y + Math.sin(a) * (r + 0.6);
  const off = [-Math.sin(a) * 1.6, Math.cos(a) * 1.6];
  const ladder = [k.segment([lx + off[0], ly + off[1], 3], [lx + off[0], ly + off[1], h + 2], P), k.segment([lx - off[0], ly - off[1], 3], [lx - off[0], ly - off[1], h + 2], P)];
  for (let z = 6; z < h; z += 3) ladder.push(k.segment([lx + off[0], ly + off[1], z], [lx - off[0], ly - off[1], z], P));
  out.push(M("steel", L(ladder.join(""), { tone: "mid" })));
  return out.join("");
}
put([-122, 58, 0], `<g data-zone="estoque">${silo(-122, 58, 15, 52)}</g>`, "estoque");
put([-122, 96, 0], `<g data-zone="estoque">${silo(-122, 96, 15, 52)}</g>`, "estoque");
// fábrica de ração com elevador e transportador até a moega de carga
function mill() {
  const out = [];
  const B = { x: -98, y: 118, w: 36, d: 46 };
  out.push(M("wall", S(box(B, 0, 34, 2), { crease: "none", inner: L(k.sideSeam(B, 4, P, 2), { tone: "faint" }) })));
  out.push(M("roofRed", S(box({ x: B.x - 2, y: B.y - 2, w: B.w + 4, d: B.d + 4 }, 34, 3, 2, 0.5), { crease: "lo" })));
  out.push(poly([[B.x + B.w, 130, 0], [B.x + B.w, 146, 0], [B.x + B.w, 146, 18], [B.x + B.w, 130, 18]], "fz-dark"));
  for (const y of [124, 152]) out.push(poly([[B.x + B.w, y, 22], [B.x + B.w, y + 8, 22], [B.x + B.w, y + 8, 28], [B.x + B.w, y, 28]], "fz-glass"));
  // elevador de canecas
  out.push(M("steel", S(box({ x: -100, y: 106, w: 6, d: 6 }, 0, 72, 2, 0.3))));
  out.push(M("steel", S(box({ x: -102, y: 104, w: 10, d: 10 }, 72, 4, 2, 0.4))));
  return out.join("");
}
put([-80, 141, 0], `<g data-zone="estoque">${mill()}</g>`, "estoque");
// transportadores (calhas) do elevador aos silos e à moega
const chutes = [k.segment([-97, 106, 74], [-122, 96, 66], P), k.segment([-97, 104, 74], [-122, 58, 66], P), k.segment([-96, 104, 72], [-84, 30, 40], P)];
put([-100, 70, 0], `<g data-zone="estoque"><path class="fz-pipe" d="${chutes.join("")}"/></g>`, "estoque", 60);
// moega de carga do trato, sobre pernas, com bica sobre a estrada
const BIN = { x: -84, y: 30 };
function bin() {
  const out = [];
  for (const [dx, dy] of [[-6, -6], [6, -6], [-6, 6], [6, 6]].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]))) out.push(M("steel", S(box({ x: BIN.x + dx - 0.8, y: BIN.y + dy - 0.8, w: 1.6, d: 1.6 }, 0, 26, 2), { crease: "none" })));
  const F = G.frameAlong([BIN.x, BIN.y, 18], [0, 0, 1]);
  out.push(M("silo", S(G.solidOf([[0, 2], [8, 9], [24, 9], [27, 6]], F, P, { smooth: false }))));
  out.push(`<path class="fz-pipe" d="${k.segment([BIN.x, BIN.y, 18], [BIN.x, BIN.y - 22, 14.5], P)}"/>`);
  return out.join("");
}
put([BIN.x, BIN.y + 8, 0], `<g data-zone="estoque">${bin()}</g>`, "estoque");

// ───────── SEDE (frente, à direita): escritório em corte ─────────
const FLOOR = { x: 84, y: 64, w: 122, d: 100 };
const WALL_H = 44;
ground.push(`<g data-zone="sede"><g class="m-concrete"><path class="iso-fill fz-flat" d="${flatPlan({ x: 76, y: 56, w: 138, d: 116 })}"/></g></g>`);
const faceY = (yv) => ({
  world: (u, z, d = 0) => [u, yv - d, z],
  matrix: (d = 0) => k.sideMatrix([0, yv - d], 0, P, "left"),
});
const fl = (u0, z0, u1, z1, r = 0) => k.pathOf(k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, 4).map(([u, z]) => [u, -z]), true);
// painel na parede do fundo: 4 blocos, um por setor, com contador
const TV = { u0: 102, u1: 190, z0: 13, z1: 40 };
const TILES = ["lavoura", "confinamento", "estoque", "financeiro"];
const TILE_NAMES = { lavoura: "Lavoura", confinamento: "Confinamento", estoque: "Estoque", financeiro: "Financeiro" };
const TILE_SUB = { lavoura: "apontamentos", confinamento: "tratos", estoque: "saídas", financeiro: "lançamentos" };
const tileCenter = {};
function office() {
  const out = [];
  out.push(M("floor", S(box(FLOOR, 0, 3, 2, 0.6), { crease: "lo", inner: L(Array.from({ length: 9 }, (_, i) => k.onTop([[FLOOR.x + 12 + i * 12, FLOOR.y], [FLOOR.x + 12 + i * 12, FLOOR.y + FLOOR.d]], 3, P)).join(""), { tone: "faint" }) })));
  const back = { x: FLOOR.x, y: FLOOR.y, w: FLOOR.w, d: 4 };
  const left = { x: FLOOR.x, y: FLOOR.y + 4, w: 4, d: FLOOR.d - 4 };
  out.push(M("wall", S(box(back, 3, WALL_H, 2), { crease: "lo" })));
  out.push(M("wall", S(box(left, 3, WALL_H, 2), { crease: "lo" })));
  // janelas na parede da esquerda (face +x)
  for (const y0 of [80, 118]) out.push(poly([[FLOOR.x + 4, y0, 18], [FLOOR.x + 4, y0 + 26, 18], [FLOOR.x + 4, y0 + 26, 36], [FLOOR.x + 4, y0, 36]], "fz-glass") + M("wall", L(k.pathOf([[FLOOR.x + 4, y0, 18], [FLOOR.x + 4, y0 + 26, 18], [FLOOR.x + 4, y0 + 26, 36], [FLOOR.x + 4, y0, 36]].map(at), true) + k.segment([FLOOR.x + 4, y0 + 13, 18], [FLOOR.x + 4, y0 + 13, 36], P), { tone: "mid" })));
  // painel (TV) na face interna da parede do fundo
  const f = faceY(FLOOR.y + 4);
  const tw = (TV.u1 - TV.u0 - 2.4 * 5) / 4;
  const tiles = TILES.map((t, i) => {
    const u0 = TV.u0 + 2.4 + i * (tw + 2.4);
    const z0 = TV.z0 + 2.4;
    const z1 = TV.z1 - 6;
    const [sx, sy] = at(f.world(u0 + tw / 2, (z0 + z1) / 2));
    tileCenter[t] = [+sx.toFixed(1), +sy.toFixed(1)];
    const bars = [0.3, 0.55, 0.42, 0.7, 0.6].map((hh, j) => `<path class="fz-bar" d="${fl(u0 + 2 + j * ((tw - 4) / 5), z0 + 2, u0 + 2 + j * ((tw - 4) / 5) + (tw - 4) / 5 - 1, z0 + 2 + hh * 6)}"/>`).join("");
    return `<g class="fz-tile" data-tile="${t}"><path class="fz-tile-bg" d="${fl(u0, z0, u0 + tw, z1, 1)}"/><text class="fz-tile-t" x="${u0 + 2}" y="${-(z1 - 3.4)}" font-size="2.5">${TILE_NAMES[t]}</text><text class="fz-tile-n" data-count="${t}" x="${u0 + 2}" y="${-(z1 - 10)}" font-size="5.6">0</text><text class="fz-tile-s" x="${u0 + 2}" y="${-(z1 - 13)}" font-size="2">${TILE_SUB[t]}</text>${bars}<path class="fz-tile-flash" data-flash="${t}" d="${fl(u0, z0, u0 + tw, z1, 1)}"/></g>`;
  }).join("");
  const head = `<path class="fz-tv-bar" d="${fl(TV.u0, TV.z1 - 4.4, TV.u1, TV.z1)}"/><text class="fz-tv-h" x="${TV.u0 + 2.4}" y="${-(TV.z1 - 1.2)}" font-size="2.4">Cerne · Visão geral da fazenda</text><circle class="fz-live" cx="${TV.u1 - 3}" cy="${-(TV.z1 - 2.2)}" r="0.9"/>`;
  out.push(M("screen", S(box({ x: TV.u0 - 1.6, y: FLOOR.y + 4, w: TV.u1 - TV.u0 + 3.2, d: 1.2 }, TV.z0 - 1.6, TV.z1 - TV.z0 + 3.2, 2), { tone: "hi" })));
  out.push(`<g transform="${faceY(FLOOR.y + 5.2).matrix(0)}"><path class="fz-tv" d="${fl(TV.u0, TV.z0, TV.u1, TV.z1, 0.6)}"/>${head}${tiles}</g>`);
  // armário e vaso de planta
  out.push(M("desk", S(box({ x: FLOOR.x + 4, y: 140, w: 10, d: 20 }, 3, 20, 2, 0.4), { crease: "lo", inner: L(k.segment([FLOOR.x + 14, 150, 3], [FLOOR.x + 14, 150, 23], P), { tone: "lo" }) })));
  out.push(M("planter", S(cyl(196, 76, 4, 3, 7, 16, 0.3))) + M("leaf", S(G.sphereOf([196, 76, 15], 6, P, { steps: 18 }))));
  // mesa com notebook, cadeira e o gestor de costas, olhando o painel
  out.push(M("desk", S(box({ x: 118, y: 96, w: 52, d: 14 }, 13, 2.4, 2, 0.5), { crease: "lo" })));
  for (const [x, y] of [[119, 97], [167, 97], [119, 107], [167, 107]]) out.push(M("steel", S(box({ x, y, w: 2, d: 2 }, 3, 10, 2), { crease: "none" })));
  out.push(M("steel", S(box({ x: 134, y: 100, w: 16, d: 9, r: 0.6 }, 15.4, 0.8, 2))));
  out.push(M("steel", S(box({ x: 134.4, y: 99.2, w: 15.2, d: 0.8, r: 0.3 }, 15.4, 10, 2))));
  out.push(poly([[135.4, 100, 16.6], [148.6, 100, 16.6], [148.6, 100, 24.6], [135.4, 100, 24.6]], "fz-glow"));
  out.push(M("desk", S(cyl(160, 102, 1.6, 15.4, 3, 14))));
  out.push(M("steel", S(cyl(144, 124, 1, 3, 7, 12))) + M("screen", S(cyl(144, 124, 6, 10, 2, 24, 0.3))) + M("screen", S(box({ x: 138, y: 129, w: 12, d: 2 }, 12, 13, 2, 0.4))));
  out.push(M("shirt", S(box({ x: 137, y: 108, w: 14, d: 8, r: 2 }, 18, 3, 3, 0.4))));
  out.push(M("shirt", S(cyl(144, 121, 5.2, 12, 14, 24, 0.5))));
  out.push(M("skin", S(G.sphereOf([144, 120, 30], 4.2, P, { steps: 18 }))));
  out.push(M("desk", S(cyl(144, 120.4, 4.6, 32.2, 1, 24))));
  return out.join("");
}
put([150, 110, 0], `<g data-zone="sede">${office()}</g>`, "sede");
// caixa d'água e caminhonete
function tank() {
  const out = [];
  for (const [dx, dy] of [[-5, -5], [5, -5], [-5, 5], [5, 5]].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]))) out.push(M("wood", S(box({ x: 236 + dx - 1, y: 60 + dy - 1, w: 2, d: 2 }, 0, 30, 2), { crease: "none" })));
  out.push(M("wood", S(box({ x: 228, y: 52, w: 16, d: 16 }, 30, 2, 2, 0.4))));
  out.push(M("silo", S(cyl(236, 60, 7, 32, 10, 32, 0.5), { inner: L(k.sideArc(236, 60, 7, 37, P, 24), { tone: "faint" }) })));
  return out.join("");
}
put([236, 60, 0], `<g data-zone="sede">${tank()}</g>`, "sede");
const PICKUP = [
  ...[[-7, -5.4], [6, -5.4], [-7, 4], [6, 4]].map(([x, y]) => ({ plan: { x, y, w: 4, d: 1.4, r: 0.4 }, z: 0, h: 4, mat: "tyre" })),
  { plan: { x: -10, y: -4.6, w: 21, d: 9.2, r: 1 }, z: 2, h: 4, mat: "pickup", bevel: 0.4 },
  { plan: { x: 0, y: -4.2, w: 8, d: 8.4, r: 1.2 }, z: 6, h: 5, mat: "glass", bevel: 0.3 },
  { plan: { x: 0.4, y: -4, w: 7.2, d: 8, r: 1 }, z: 11, h: 0.8, mat: "pickup" },
];
put([238, 128, 0], `<g data-zone="sede">${assemble(PICKUP, "-y", 238, 128)}</g>`, "sede");

// ───────── veículos (desenhados na origem; a parte viva os move) ─────────
const TRUCK = [
  ...[[-13, -6.6], [-6, -6.6], [10, -6.6], [-13, 5], [-6, 5], [10, 5]].map(([x, y]) => ({ plan: { x, y, w: 4.6, d: 1.6, r: 0.5 }, z: 0, h: 4.6, mat: "tyre" })),
  { plan: { x: -16, y: -4.4, w: 33, d: 8.8 }, z: 2, h: 2.4, mat: "steel" },
  { plan: { x: -16, y: -6, w: 22, d: 12, r: 0.8 }, z: 4.4, h: 8.6, mat: "wagon", bevel: 0.5 },
  { plan: { x: -4, y: -11, w: 3.6, d: 5 }, z: 8, h: 1.6, mat: "steel", bias: -3 },
  { plan: { x: 8, y: -5.4, w: 9, d: 10.8, r: 1 }, z: 4.4, h: 9.6, mat: "cab", bevel: 0.4 },
  { plan: { x: 14.4, y: -4.6, w: 2.4, d: 9.2, r: 0.4 }, z: 9, h: 4, mat: "glass" },
];
const TRACTOR = [
  ...[[-7, -6.8], [-7, 4.6]].map(([x, y]) => ({ plan: { x, y, w: 7.4, d: 2.2, r: 1 }, z: 0, h: 7.4, mat: "tyre" })),
  ...[[5, -5.4], [5, 3.8]].map(([x, y]) => ({ plan: { x, y, w: 4.2, d: 1.6, r: 0.8 }, z: 0, h: 4.2, mat: "tyre" })),
  { plan: { x: -6, y: -3, w: 15, d: 6, r: 0.6 }, z: 2.6, h: 4.4, mat: "tractor" },
  { plan: { x: 1, y: -2.6, w: 8.6, d: 5.2, r: 1 }, z: 7, h: 4, mat: "tractor", bevel: 0.4 },
  { plan: { x: -6.4, y: -4.2, w: 7.4, d: 8.4, r: 0.6 }, z: 7, h: 9, mat: "glass" },
  { plan: { x: -7, y: -4.8, w: 8.6, d: 9.6, r: 0.8 }, z: 16, h: 1.2, mat: "tractor", bevel: 0.3 },
  { plan: { x: -18, y: -4.7, w: 7, d: 9.4, r: 0.6 }, z: 2, h: 3.6, mat: "planter" },
  { plan: { x: -17, y: -4, w: 4.6, d: 3.4, r: 0.6 }, z: 5.6, h: 3.6, mat: "planter", bevel: 0.3 },
  { plan: { x: -17, y: 0.6, w: 4.6, d: 3.4, r: 0.6 }, z: 5.6, h: 3.6, mat: "planter", bevel: 0.3 },
];
const vehicle = (name, parts, dirs) => `<g class="fz-veh" data-veh="${name}">${dirs.map((d, i) => `<g data-dir="${d}"${i ? ' style="display:none"' : ""}>${assemble(parts, d, 0, 0)}</g>`).join("")}</g>`;
const TRUCK_Y = 1;
const VEH_TRUCK = vehicle("truck", TRUCK, ["+x", "-x"]).replace('class="fz-veh"', `class="fz-veh" transform="${k.translateAlong(P, [BIN.x, TRUCK_Y, 0])}"`);
const VEH_TRACTOR = vehicle("tractor", TRACTOR, ["+x", "-x", "+y"]).replace('class="fz-veh"', `class="fz-veh" data-zone="lavoura" transform="${k.translateAlong(P, [T2.x + 8, T2.y + LANE / 2, 0])}"`);

// ───────── montagem ─────────
// Ordem: o que fica atrás da estrada principal (y < 0), o caminhão, e o que fica na frente.
// Para o mesmo ponto na tela, quem tem y maior está mais perto: a partição é exata para quem está no chão.
// O trator só passa pelo talhão 2, atrás de tudo exceto o talhão 1, então entra logo depois dele.
items.sort((a, b) => a.key - b.key);
const toSvg = (it) => {
  const m = it.svg.match(/^<g data-zone="(\w+)">([\s\S]*)<\/g>$/);
  return m ? `<g data-zone="${m[1]}">${m[2]}</g>` : it.svg;
};
const behind = items.filter((it) => it.y < 0);
const front = items.filter((it) => it.y >= 0);
const placed = [toSvg(behind[0]), VEH_TRACTOR, ...behind.slice(1).map(toSvg), VEH_TRUCK, ...front.map(toSvg)];
// pulsos de dados (campo → sede)
const pulses = `<g class="fz-pulses">${Array.from({ length: 6 }, (_, i) => `<g class="fz-pulse" data-pulse="${i}" style="opacity:0"><circle r="5" class="fz-pulse-halo"/><circle r="2.2" class="fz-pulse-dot"/></g>`).join("")}</g>`;

// áreas de clique: envoltória de cada setor (chão + altura)
const hull = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = [];
  for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const ZONES = {
  lavoura: { plan: { x: -258, y: -184, w: 228, d: 164 }, h: 18 },
  confinamento: { plan: { x: 24, y: -180, w: 236, d: 166 }, h: 20 },
  estoque: { plan: { x: -258, y: 22, w: 220, d: 162 }, h: 76 },
  sede: { plan: { x: 70, y: 40, w: 196, d: 140 }, h: 44 },
};
const zoneBox = {};
const hits = Object.entries(ZONES).map(([z, { plan, h }]) => {
  const pts = hull(k.boxCorners({ ...plan, r: 0 }, 0, h).map(at));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  zoneBox[z] = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map((n) => +n.toFixed(1));
  return `<path class="fz-hit" data-hit="${z}" d="${k.pathOf(pts, true)}"/>`;
});

const label =
  "Maquete de uma fazenda sobre um bloco de terra, em quatro setores ligados por estradas de chão. Ao fundo, a lavoura: um talhão de milho formado e outro sendo plantado por um trator. À direita, o confinamento: três currais com gado Nelore, bebedouros e um cocho de concreto. À frente e à esquerda, o estoque: galpão de insumos, dois silos, fábrica de ração e a moega onde o caminhão de trato carrega. À frente e à direita, a sede em corte: o gestor na mesa olha um painel na parede com um bloco por setor. Cada operação no campo envia um pulso até o painel da sede.";
const svg = k.figureSvg({
  width: W,
  height: H,
  label,
  body: [ground.join(""), `<g class="fz-items">${placed.join("")}</g>`, pulses, `<g class="fz-hits">${hits.join("")}</g>`].join(""),
  className: "fz-svg",
});

const v = (p) => k.axisVector(P, p).map((n) => +n.toFixed(4));
const data = {
  width: W,
  height: H,
  P,
  ux: v([1, 0, 0]),
  uy: v([0, 1, 0]),
  uz: v([0, 0, 1]),
  t2: { x0: T2.x, x1: T2.x + T2.w, y0: T2.y, lane: LANE, lanes: LANES },
  truck: { y: TRUCK_Y, load: BIN.x, start: PEN_X[0] + 4, pens: PEN_X, home: -150 },
  cocho: { y0: COCHO.y + 1.2, y1: COCHO.y + COCHO.d - 1.2, z: 4.4 },
  tiles: tileCenter,
  zones: zoneBox,
  // âncoras das etiquetas de setor, em % da arte
  labels: Object.fromEntries(
    Object.entries({ sede: [168, 66, 52], confinamento: [150, -176, 24], estoque: [-150, 80, 82], lavoura: [-150, -182, 12] }).map(([z, p]) => {
      const [x, y] = at(p);
      return [z, [+((x / W) * 100).toFixed(2), +((y / H) * 100).toFixed(2)]];
    }),
  ),
};

mkdirSync(OUT_TS, { recursive: true });
mkdirSync(OUT_HTML, { recursive: true });
writeFileSync(join(OUT_TS, "art.ts"), `// Gerado por tools/iso/fazenda/build.mjs. Não editar à mão.\n/* eslint-disable */\nexport const SVG = ${JSON.stringify(svg)};\nexport const DATA = ${JSON.stringify(data)} as const;\n`);
writeFileSync(join(OUT_TS, "materials.css"), `/* Gerado por tools/iso/fazenda/build.mjs: cores dos materiais da maquete */\n${MAT_CSS}\n`);
const css = readFileSync(join(HERE, "..", "kit", "iso.css"), "utf8");
const pageCss = readFileSync(join(ROOT, "src", "figures", "fazenda", "fazenda.css"), "utf8");
writeFileSync(
  join(OUT_HTML, "fazenda.html"),
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fazenda no Cerne</title><style>${css}\n${MAT_CSS}\n${pageCss}\nbody{margin:0;background:#f5f8f4;font-family:system-ui}.wrap{width:min(1100px,100% - 24px);margin:30px auto}</style></head><body class="iso fz-figure" data-theme="light"><div class="wrap"><div class="iso-plate">${svg}</div></div></body></html>`,
);
const nodes = (svg.match(/<(path|circle|rect|text|g)\b/g) || []).length;
console.log(`fazenda: ${(svg.length / 1024).toFixed(1)} KB, ${nodes} nós, ${items.length} itens`);
