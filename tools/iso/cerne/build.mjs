// Figura isométrica "Eixo do Cerne" (skill Anatomy, kit em tools/iso/kit, MIT).
// Gera a arte estática das duas composições (desktop e mobile) como módulos TS em src/figures/cerne/,
// mais páginas de conferência em tools/iso/cerne/out/ para os checks da skill (capture/lines).
// Uso: node tools/iso/cerne/build.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const OUT_TS = join(ROOT, "src", "figures", "cerne");
const OUT_HTML = join(HERE, "out");

// Quem faz cada passo da OS (espelha STEPS em src/figures/cerne/model.ts)
const STEP_OWNERS = ["web", "op", "op", "adm"];
const DEVICES = ["web", "adm", "op"];

function build(layout) {
  const mobile = layout === "mobile";
  const id = mobile ? "cnm" : "cnd";

  // ───────── mundo ─────────
  const LOG_R = mobile ? 84 : 122;
  const LOG_H = mobile ? 14 : 18;
  const FOOT_H = 5;
  const BARK = mobile ? 6 : 8;
  const HEART_R = mobile ? 26 : 30;

  // eixo: colar de base, haste de madeira (o cerne), mancal e mostrador no topo
  const COLLAR_Z = 4;
  const COLLAR_TOP = 16;
  const SHAFT_R = 8;
  const DIAL_Z = mobile ? 236 : 68;
  const DIAL_R = mobile ? 36 : 40;
  const DIAL_H = 10;
  const DIAL_TOP = DIAL_Z + DIAL_H;

  // aparelhos: origem local de cada um
  const O = mobile
    ? { web: [-32, 30, 160], adm: [34, -30, 86], op: [-30, 30, 0] }
    : { web: [-70, 4, 0], adm: [44, -58, 0], op: [6, 66, 0] };

  const extremes = [
    ...k.boxCorners({ x: -LOG_R, y: -LOG_R, w: LOG_R * 2, d: LOG_R * 2, r: 0 }, -LOG_H - FOOT_H, 0),
    [0, 0, DIAL_TOP + 4],
    [O.web[0] - 26, O.web[1] - 8, O.web[2] + 50],
    [O.adm[0] + 20, O.adm[1] - 30, O.adm[2] + 56],
    [O.op[0] + 34, O.op[1] + 30, O.op[2] + 54],
  ];
  // o log é redondo: só os pontos do círculo contam para o enquadramento
  const circle = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return [[Math.cos(a) * LOG_R, Math.sin(a) * LOG_R, 0], [Math.cos(a) * LOG_R, Math.sin(a) * LOG_R, -LOG_H - FOOT_H]];
  }).flat();
  const WIDTH = mobile ? 360 : 640;
  const HEIGHT = mobile ? 470 : 430;
  const P = k.fitProjection([...circle, ...extremes.slice(8)], WIDTH, HEIGHT, { pad: mobile ? 18 : 26, azimuth: 45, elevation: 30 });

  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const depth = (p) => k.depthOf(p, P);
  const byDepth = (pts) => [...pts].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
  const add = (o, plan) => ({ ...plan, x: plan.x + o[0], y: plan.y + o[1] });
  const box = (o, plan, z, h, steps = 3, bevel = 0) => k.slabOf(add(o, plan), z + o[2], h, P, steps, bevel);
  const cyl = (o, x, y, r, z, h, steps = 20, bevel = 0) => k.cylinder(x + o[0], y + o[1], r, z + o[2], h, P, steps, bevel);
  const wobble = (r, seed, amp = 0.012) => Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    const rr = r * (1 + amp * Math.sin(3 * a + seed) + amp * 0.6 * Math.sin(5 * a + seed * 2.3));
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  const ellipse = (ring, z) => k.onTop(ring, z, P, true);

  // ───────── telas em faces verticais ─────────
  // face "y": plano y = at, voltado para +y (local u = x); face "x": plano x = at, voltado para +x (local u = −y)
  const faceOf = (kind, atv) => ({
    kind,
    world: (u, z, d = 0) => (kind === "y" ? [u, atv - d, z] : [atv - d, -u, z]),
    matrix: (d = 0) => (kind === "y" ? k.sideMatrix([0, atv - d], 0, P, "left") : k.sideMatrix([atv - d, 0], 0, P, "right")),
    normal: (nu) => (kind === "y" ? [nu, 0] : [0, -nu]),
  });
  const flat = (u0, z0, u1, z1, r, steps = 5) => k.pathOf(k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
  let clips = 0;
  function recess(face, { u0, u1, z0, z1, r, depth: dd }, back = "", backClass = "cn-well", inside = "") {
    const cid = `${id}-clip-${clips++}`;
    const ring = k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, 5);
    const cu = (u0 + u1) / 2;
    const cz = (z0 + z1) / 2;
    const { sinA, cosA } = k.cameraOf(P);
    const [vx, vy] = k.towardViewer(P);
    const tops = [];
    const sides = [[], [], [], []];
    ring.forEach(([au, az], i) => {
      const [bu, bz] = ring[(i + 1) % ring.length];
      const len = Math.hypot(bu - au, bz - az) || 1;
      let [nu, nz] = [(bz - az) / len, -(bu - au) / len];
      if (nu * (cu - (au + bu) / 2) + nz * (cz - (az + bz) / 2) < 0) [nu, nz] = [-nu, -nz];
      const [px, py] = face.normal(nu);
      if (px * vx + py * vy <= 1e-6 && nz <= 0) return;
      const quad = k.pathOf([at(face.world(au, az)), at(face.world(bu, bz)), at(face.world(bu, bz, dd)), at(face.world(au, az, dd))], true);
      if (nz >= Math.abs(nu)) tops.push(quad);
      else {
        const lit = ((px * -sinA + py * cosA) + 1) / 2;
        sides[Math.min(3, Math.max(0, Math.floor(lit * 4)))].push(quad);
      }
    });
    const shape = flat(u0, z0, u1, z1, r);
    return [
      `<clipPath id="${cid}"><path transform="${face.matrix(0)}" d="${shape}"/></clipPath>`,
      `<g clip-path="url(#${cid})">`,
      tops.length ? `<path class="iso-top" d="${tops.join("")}"/>` : "",
      ...sides.map((d, s) => (d.length ? `<path class="iso-shade" data-shade="${s}" d="${d.join("")}"/>` : "")),
      `<g transform="${face.matrix(dd)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
      inside,
      `</g>`,
      `<g transform="${face.matrix(0)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
    ].join("");
  }

  // Conteúdo comum das telas: barra de status com os 4 passos da OS e o rótulo do passo atual.
  // Coordenadas locais da face (u à direita, v = −z para baixo).
  function pips(dev, u0, v, w, h) {
    const gap = w * 0.06;
    const each = (w - gap * 3) / 4;
    const cells = Array.from({ length: 4 }, (_, i) => `<rect class="cn-pip" data-pip="${i}" x="${(u0 + i * (each + gap)).toFixed(2)}" y="${v.toFixed(2)}" width="${each.toFixed(2)}" height="${h}" rx="${(h / 2).toFixed(2)}"/>`).join("");
    return `<g data-part="pips-${dev}">${cells}</g>`;
  }
  const status = (dev, u, v, size) => `<text class="cn-status" data-part="status-${dev}" x="${u}" y="${v}" font-size="${size}">Nova OS</text>`;
  const rule = (u0, u1, v, tone = "faint") => `<path class="iso-line" data-tone="${tone}" data-free="" d="M${u0} ${v}H${u1}"/>`;
  const flash = (dev, u0, z0, u1, z1, r) => `<path class="cn-flash" data-part="flash-${dev}" d="${flat(u0, z0, u1, z1, r)}"/>`;

  // ───────── base: rodela de tronco ─────────
  function log() {
    const out = [`<path class="iso-halo" d="${k.cylinder(0, 0, LOG_R * 0.98, -LOG_H - FOOT_H, LOG_H, P, 72).fill}"/>`];
    for (const [x, y] of byDepth([0, 1, 2, 3].map((i) => [Math.cos(Math.PI / 4 + (i * Math.PI) / 2) * LOG_R * 0.72, Math.sin(Math.PI / 4 + (i * Math.PI) / 2) * LOG_R * 0.72]))) {
      out.push(S(k.cylinder(x, y, 9, -LOG_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
    }
    const side = k.cylinder(0, 0, LOG_R, -LOG_H, LOG_H, P, 120, 1.2);
    // casca: estrias verticais irregulares no costado, terminando nas bordas de cima e de baixo
    const bark = [];
    for (let i = 0; i < (mobile ? 70 : 130); i++) {
      const a = (i / (mobile ? 70 : 130)) * Math.PI * 2 + Math.sin(i * 7.3) * 0.02;
      const [vx, vy] = k.towardViewer(P);
      if (Math.cos(a) * vx + Math.sin(a) * vy < 0.08) continue;
      const x = Math.cos(a) * LOG_R;
      const y = Math.sin(a) * LOG_R;
      const z1 = -LOG_H * (0.15 + 0.85 * (0.5 + 0.5 * Math.sin(i * 2.17)));
      bark.push(k.segment([x, y, -LOG_H], [x, y, i % 3 === 0 ? 0 : z1], P));
    }
    out.push(S(side, { tone: "mid", crease: "lo", inner: L(bark.join(""), { tone: "faint", free: "end" }) }));
    // anel da casca no topo (mais escuro) e alburno
    const outer = k.circleRing(0, 0, LOG_R, 120);
    const inner = wobble(LOG_R - BARK, 1.1, 0.006);
    out.push(`<path class="cn-bark" fill-rule="evenodd" d="${ellipse(outer, 0)}${ellipse(inner, 0)}"/>`);
    out.push(L(ellipse(inner, 0), { tone: "lo" }));
    // anéis de crescimento: cada vez mais próximos perto da casca
    const rings = [];
    const count = mobile ? 6 : 10;
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const r = HEART_R + (LOG_R - BARK - 6 - HEART_R) * Math.sqrt(t);
      rings.push(ellipse(wobble(r, i * 0.9), 0));
    }
    out.push(L(rings.join(""), { tone: "faint" }));
    // o cerne: miolo escuro do tronco
    const heart = wobble(HEART_R, 0.4, 0.02);
    out.push(`<path class="cn-heart" d="${ellipse(heart, 0)}"/>`);
    out.push(L(ellipse(heart, 0) + ellipse(wobble(HEART_R * 0.62, 2.2, 0.02), 0), { tone: "lo" }));
    // rachadura radial (fenda de secagem): forma fechada, sem pontas soltas
    const ca = mobile ? 0.5 : 0.42;
    const crack = [];
    for (let s = 0; s <= 1.0001; s += 0.1) { const r = LOG_R * 0.5 + s * (LOG_R * 0.5 - BARK); crack.push([Math.cos(ca + s * 0.03) * r, Math.sin(ca + s * 0.03) * r]); }
    const back = [...crack].reverse().map(([x, y], i) => {
      const w = 0.7 * Math.sin((i / (crack.length - 1)) * Math.PI) ** 0.8;
      const n = [-Math.sin(ca), Math.cos(ca)];
      return [x + n[0] * w, y + n[1] * w];
    });
    out.push(`<path class="cn-crack" d="${k.onTop([...crack, ...back], 0, P, true)}"/>`);
    return out.join("");
  }

  // plaquinha gravada na rodela (o único rótulo no desenho)
  function nameplate() {
    if (mobile) return "";
    const plan = { x: -66, y: 80, w: 34, d: 11, r: 1.4 };
    return [
      S(k.slabOf(plan, 0, 0.9, P, 3), { tone: "lo", crease: "none" }),
      L(k.planOutline(k.insetPlan(plan, 1.4), 0.9, P, 3), { tone: "faint" }),
      k.faceTextSvg(k.topMatrix([plan.x + plan.w / 2, plan.y + plan.d / 2 + 1.4], 0.9, P, "x"), "CERNE", { size: 4, tone: "mid", anchor: "middle" }),
      D([at([plan.x + 2.6, plan.y + plan.d / 2, 0.9]), at([plan.x + plan.w - 2.6, plan.y + plan.d / 2, 0.9])], { size: 0.45 }),
    ].join("");
  }

  // ───────── cabos: do colar do eixo até cada aparelho ─────────
  const PORT_R = 15;
  const PORT_LEN = 6;
  const cable = {};
  const angleOf = {};
  function routes() {
    const z = 0.7;
    const def = mobile
      ? {
          // no mobile os cabos sobem pelos braços: saem do colar do braço e correm sobre ele
          web: { from: [0, SHAFT_R + 4, O.web[2] + 3], via: [], to: [0, 28, O.web[2] + 3] },
          adm: { from: [SHAFT_R + 4, 0, O.adm[2] + 3], via: [], to: [30, 0, O.adm[2] + 3] },
          op: { from: [-Math.SQRT1_2 * (PORT_R + PORT_LEN), Math.SQRT1_2 * (PORT_R + PORT_LEN), 9], via: [[-30, 30, z]], to: [-30, O.op[1] + 3, z + 3.3] },
        }
      : {
          web: { via: [[-36, 22, z]], to: [O.web[0] + 39.4, O.web[1] + 36, 1.6] },
          adm: { via: [[34, -16, z]], to: [O.adm[0] + 7.5, O.adm[1] + 33.4, 1.8] },
          op: { via: [[16, 36, z], [O.op[0] + 14, O.op[1] - 1, z]], to: [O.op[0] + 14, O.op[1] + 1, 4.6] },
        };
    for (const dev of DEVICES) {
      const r = def[dev];
      let from = r.from;
      if (!from) {
        r.dir = Math.atan2(r.via[0][1], r.via[0][0]);
        angleOf[dev] = r.dir;
        from = [Math.cos(r.dir) * (PORT_R + PORT_LEN), Math.sin(r.dir) * (PORT_R + PORT_LEN), 9];
      }
      const drop = mobile && dev !== "op" ? [] : [[from[0] + Math.cos(Math.atan2(from[1], from[0])) * 3, from[1] + Math.sin(Math.atan2(from[1], from[0])) * 3, z]];
      const pts = [from, ...drop, ...r.via, r.to];
      cable[dev] = pts.map(at);
    }
    if (mobile) {
      angleOf.web = Math.PI / 2;
      angleOf.adm = 0;
      angleOf.op = (Math.PI * 3) / 4;
    }
  }
  routes();
  const cableSvg = (dev) =>
    `<g class="iso-wire cn-cable" data-cable="${dev}" data-tone="mid">${L(k.pathOf(cable[dev]), { tone: "mid", className: "cn-cord" })}${L(k.pathOf(cable[dev]), { tone: "faint", className: "cn-core" })}<circle class="iso-wire-end" cx="${cable[dev][cable[dev].length - 1][0].toFixed(1)}" cy="${cable[dev][cable[dev].length - 1][1].toFixed(1)}" r="1.1"/></g>`;

  // ───────── o eixo ─────────
  function ports(front) {
    // um bloco de saída por aparelho no colar; os de trás antes do colar, os da frente depois
    const out = [];
    const [vx, vy] = k.towardViewer(P);
    const list = (mobile ? ["op"] : DEVICES).filter((dev) => (Math.cos(angleOf[dev]) * vx + Math.sin(angleOf[dev]) * vy > 0) === front);
    for (const dev of list) {
      const a = angleOf[dev];
      const c = Math.cos(a);
      const s = Math.sin(a);
      const ring = [[-3.2, PORT_R - 2], [3.2, PORT_R - 2], [3.2, PORT_R + PORT_LEN], [-3.2, PORT_R + PORT_LEN]].map(([u, r]) => [c * r - s * u, s * r + c * u]);
      out.push(S(k.extrude(ring, 6, 6, P, { bevel: 0.4 }), { tone: "mid" }));
      out.push(D([at([c * (PORT_R + 2.4), s * (PORT_R + 2.4), 12])], { size: 0.45 }));
    }
    return out.join("");
  }

  function axle() {
    const out = [];
    // flange de base aparafusada no cerne
    out.push(S(k.cylinder(0, 0, 22, 0, COLLAR_Z, P, 56, 0.6), { tone: "mid" }));
    const bolts = Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2 + 0.2) * 18.5, Math.sin((i / 8) * Math.PI * 2 + 0.2) * 18.5]);
    out.push(L(bolts.map(([x, y]) => k.ring(x, y, 1.5, COLLAR_Z, P, 12)).join(""), { tone: "lo" }));
    out.push(D(bolts.map(([x, y]) => at([x, y, COLLAR_Z])), { size: 0.45 }));
    out.push(ports(false));
    // colar de junção, de onde saem os cabos
    out.push(S(k.cylinder(0, 0, PORT_R, COLLAR_Z, COLLAR_TOP - COLLAR_Z, P, 48, 0.6), { tone: "mid", inner: L(k.sideArc(0, 0, PORT_R, 10, P, 32), { tone: "faint" }) }));
    out.push(ports(true));
    out.push(L(k.ring(0, 0, PORT_R - 3, COLLAR_TOP, P, 40), { tone: "faint" }));
    // haste: madeira do cerne, com veios verticais (terminam nas emendas) e duas cintas de metal
    const segs = mobile ? [[COLLAR_TOP, 70], [74, 150], [154, DIAL_Z - 6]] : [[COLLAR_TOP, 38], [42, DIAL_Z - 6]];
    segs.forEach(([z0, z1], i) => {
      const grain = k.knurl(0, 0, SHAFT_R, z0, z1, 9, P, 0);
      out.push(S(k.cylinder(0, 0, SHAFT_R, z0, z1 - z0, P, 32), { tone: "hi", crease: "none", className: "cn-wood", inner: L(grain, { tone: "faint" }) }));
      if (i < segs.length - 1) {
        out.push(S(k.cylinder(0, 0, SHAFT_R + 1.4, z1, 4, P, 32, 0.3), { tone: "mid" }));
        out.push(D([at([SHAFT_R * 0.9, SHAFT_R * 0.9, z1 + 2])], { size: 0.4 }));
      }
    });
    // mancal superior
    out.push(S(k.cylinder(0, 0, 12, DIAL_Z - 6, 6, P, 40, 0.4), { tone: "mid" }));
    out.push(D([0, 1, 2].map((i) => at([Math.cos(0.4 + i * 0.6) * 10.6, Math.sin(0.4 + i * 0.6) * 10.6, DIAL_Z])), { size: 0.4 }));
    // mostrador: o registro único da OS
    const band = DIAL_TOP - 3.4;
    out.push(S(k.cylinder(0, 0, DIAL_R, DIAL_Z, DIAL_H, P, 96, 0.8), { tone: "hi", crease: "lo", inner: L(k.knurl(0, 0, DIAL_R, band, DIAL_TOP, 120, P, 0.3), { tone: "lo" }) + L(k.sideArc(0, 0, DIAL_R, band, P, 60), { tone: "faint" }) }));
    out.push(L(k.ring(0, 0, DIAL_R - 2.6, DIAL_TOP, P, 96), { tone: "lo" }));
    const ticks = k.radialTicks(0, 0, DIAL_R - 3, 60, 5, DIAL_TOP, [1.4, 2.8], P);
    out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
    out.push(L(k.ring(0, 0, DIAL_R - 9, DIAL_TOP, P, 72), { tone: "faint" }));
    return out.join("");
  }

  // marcas dos 4 passos no mostrador, cada uma apontando para quem age no passo
  const STEP_ANGLES = STEP_OWNERS.map((dev, i) => {
    const base = angleOf[dev];
    if (dev === "op") return base + (i === 1 ? -0.26 : 0.26);
    return base;
  });
  const MARK_R = DIAL_R - 6;
  function marks() {
    return STEP_ANGLES.map((a, i) => {
      const [x, y] = at([Math.cos(a) * MARK_R, Math.sin(a) * MARK_R, DIAL_TOP]);
      return `<circle class="cn-mark" data-mark="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5"/>`;
    }).join("");
  }
  const POINTER_R = DIAL_R - 10;
  const pointerAt = (a) => k.onTop([[-Math.cos(a) * 5, -Math.sin(a) * 5], [Math.cos(a) * POINTER_R, Math.sin(a) * POINTER_R]], DIAL_TOP + 0.2, P);
  const hub = () => S(k.cylinder(0, 0, 4.2, DIAL_TOP, 2.6, P, 24, 0.3), { tone: "mid" }) + D([at([0, 0, DIAL_TOP + 2.6])], { size: 0.6, tone: "hi" });

  // ───────── aparelhos ─────────
  // Notebook (Cerne Web): tampa de pé com a tela voltada para +y
  function laptop(o) {
    const out = [];
    const deck = { x: -26, y: 8, w: 64, d: 42, r: 3 };
    const lidY = deck.y - 0.4;
    out.push(`<path class="iso-halo" d="${box(o, k.insetPlan(deck, 2), 0, 1).fill}" style="opacity:.22"/>`);
    // tampa (atrás) com a tela
    out.push(S(box(o, { x: deck.x + 1, y: lidY - 2.6, w: deck.w - 2, d: 2.6, r: 1.2 }, 1.6, 44, 3, 0.4), { tone: "mid" }));
    const face = faceOf("y", o[1] + lidY);
    const scr = { u0: o[0] + deck.x + 4.5, u1: o[0] + deck.x + deck.w - 4.5, z0: o[2] + 7, z1: o[2] + 42.5, r: 1.6, depth: 0.7 };
    const W = scr.u1 - scr.u0;
    const v = (z) => -(o[2] + z);
    const u = (t) => scr.u0 + W * t;
    const content = [
      `<path class="cn-bar" d="${flat(scr.u0, o[2] + 38.6, scr.u1, scr.z1, 0, 2)}"/>`,
      `<path class="cn-side" d="${flat(scr.u0, scr.z0, u(0.17), o[2] + 38.6, 0, 2)}"/>`,
      ...[0, 1, 2, 3].map((i) => rule(u(0.04), u(0.13), v(35.4 - i * 3.4))),
      `<text class="cn-label" x="${u(0.22)}" y="${v(34.4)}" font-size="2.6">Ordens de serviço</text>`,
      status("web", u(0.22), v(29.6), 3.4),
      pips("web", u(0.22), v(26.4), W * 0.5, 1.8),
      ...[0, 1, 2].map((i) => `<path class="cn-row" d="${flat(u(0.22), o[2] + 9.6 + i * 4.4, u(0.96), o[2] + 12.6 + i * 4.4, 0.6, 2)}"/>`),
      `<rect class="cn-chip" x="${u(0.82).toFixed(1)}" y="${v(34.8).toFixed(1)}" width="${(W * 0.13).toFixed(1)}" height="2.4" rx="1.2"/>`,
      flash("web", scr.u0, scr.z0, scr.u1, scr.z1, scr.r),
    ].join("");
    out.push(recess(face, { u0: scr.u0 - 1.6, u1: scr.u1 + 1.6, z0: scr.z0 - 1.6, z1: scr.z1 + 1.6, r: 2.4, depth: 0.3 }, "", "cn-bezel", recess(face, { ...scr }, content, "cn-glass")));
    out.push(D([at([o[0] + deck.x + deck.w / 2, o[1] + lidY, o[2] + 43.6])], { size: 0.45, tone: "lo" }));
    // base: teclado, trackpad, dobradiça
    out.push(S(box(o, deck, 0, 3.2, 4, 0.6), { tone: "mid" }));
    const keys = [];
    const KX = deck.x + 5, KY = deck.y + 4.4, KU = 4.55;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
      const wide = r === 3 && c >= 3 && c <= 8;
      if (r === 3 && c > 3 && c <= 8) continue;
      keys.push(k.planOutline(add(o, { x: KX + c * KU + 0.35, y: KY + r * KU + 0.35, w: (wide ? KU * 6 : KU) - 0.7, d: KU - 0.7, r: 0.6 }), o[2] + 3.2, P, 2));
    }
    out.push(L(keys.join(""), { tone: "lo" }));
    out.push(L(k.planOutline(add(o, { x: deck.x + 22, y: deck.y + 24.6, w: 20, d: 12.4, r: 1.4 }), o[2] + 3.2, P, 3), { tone: "lo" }));
    // dobradiça: corre de borda a borda do tampo
    out.push(L(k.onTop([[o[0] + deck.x + 1.2, o[1] + deck.y + 2.2], [o[0] + deck.x + deck.w - 1.2, o[1] + deck.y + 2.2]], o[2] + 3.2, P), { tone: "faint" }));
    // porta lateral onde o cabo chega
    out.push(S(box(o, { x: deck.x + deck.w - 0.2, y: deck.y + 25, w: 1.4, d: 6, r: 0.6 }, 0.6, 2, 2), { tone: "lo" }));
    out.push(D([at([o[0] + deck.x + deck.w - 8, o[1] + deck.y + deck.d - 3, o[2] + 3.2])], { size: 0.55, tone: "hi" }));
    return out.join("");
  }

  // Tablet (Cerne Administração): num suporte, tela voltada para +x
  function tablet(o) {
    const out = [];
    const base = { x: -6, y: -32, w: 26, d: 64, r: 4 };
    out.push(`<path class="iso-halo" d="${box(o, k.insetPlan(base, 2), 0, 1).fill}" style="opacity:.25"/>`);
    out.push(S(box(o, base, 0, 4, 5, 0.6), { tone: "mid" }));
    out.push(L(k.planOutline(add(o, k.insetPlan(base, 3)), o[2] + 4, P, 4), { tone: "faint" }));
    out.push(D(k.corners(base, 4).map(([x, y]) => at([x + o[0], y + o[1], o[2] + 4])), { size: 0.45 }));
    // apoio traseiro (escora) e trava frontal
    out.push(S(box(o, { x: -2, y: -6, w: 5, d: 12, r: 1.2 }, 4, 30, 2, 0.3), { tone: "lo" }));
    const T = { x: 3, y: -30, w: 3.2, d: 60, r: 1.4 };
    out.push(S(box(o, T, 7, 48, 3, 0.4), { tone: "mid" }));
    const face = faceOf("x", o[0] + T.x + T.w);
    // local u = −y: a tela vai de u = −(y+d) a u = −y
    const uA = -(o[1] + T.y + T.d) + 3.6;
    const uB = -(o[1] + T.y) - 3.6;
    const scr = { u0: uA, u1: uB, z0: o[2] + 11, z1: o[2] + 51.4, r: 1.8, depth: 0.7 };
    const W = scr.u1 - scr.u0;
    const u = (t) => scr.u0 + W * t;
    const v = (z) => -(o[2] + z);
    const bars = [0.44, 0.7, 0.52, 0.86, 0.64].map((h, i) => `<path class="cn-col" d="${flat(u(0.08 + i * 0.17), o[2] + 14, u(0.2 + i * 0.17), o[2] + 14 + h * 13, 0.4, 2)}"/>`);
    const content = [
      `<text class="cn-label" x="${u(0.08)}" y="${v(47)}" font-size="2.7">Resultado</text>`,
      `<rect class="cn-chip" x="${u(0.7).toFixed(1)}" y="${v(48.6).toFixed(1)}" width="${(W * 0.22).toFixed(1)}" height="2.4" rx="1.2"/>`,
      status("adm", u(0.08), v(41.2), 3.6),
      pips("adm", u(0.08), v(38), W * 0.84, 1.9),
      ...bars,
      rule(u(0.06), u(0.94), v(13.6), "lo"),
      flash("adm", scr.u0, scr.z0, scr.u1, scr.z1, scr.r),
    ].join("");
    out.push(recess(face, { u0: scr.u0 - 1.8, u1: scr.u1 + 1.8, z0: scr.z0 - 1.8, z1: scr.z1 + 1.8, r: 2.6, depth: 0.3 }, "", "cn-bezel", recess(face, scr, content, "cn-glass")));
    out.push(D([at(face.world(-(o[1]), o[2] + 9.2))], { size: 0.55, tone: "lo" }));
    out.push(S(box(o, { x: 6.2, y: -32, w: 6, d: 64, r: 1.4 }, 4, 4.4, 3, 0.4), { tone: "mid" }));
    // porta onde o cabo chega (face da base voltada para o eixo)
    out.push(S(box(o, { x: 4, y: 32, w: 7, d: 1.4, r: 0.6 }, 0.6, 2.4, 2), { tone: "lo" }));
    return out.join("");
  }

  // Celular robusto (Cerne Operação) num berço, com cerca de curral atrás
  function fence(o) {
    if (mobile) return "";
    // um vão de cerca de curral correndo de trás para a frente, à esquerda do berço
    const out = [];
    const X = -14;
    const posts = [[X, -14], [X, 30]];
    for (const [x, y] of posts) {
      out.push(S(cyl(o, x, y, 3.2, 0, 40, 20), { tone: "mid", crease: "none", inner: L(k.sideArc(x + o[0], y + o[1], 3.2, o[2] + 33, P, 12), { tone: "faint" }) }));
      out.push(S(cyl(o, x, y, 3.6, 40, 1.4, 20), { tone: "lo" }));
    }
    for (const z of [12, 24]) {
      out.push(S(box(o, { x: X + 3.2, y: posts[0][1] - 4, w: 2.4, d: posts[1][1] - posts[0][1] + 8, r: 0.6 }, z, 5, 2, 0.3), { tone: "mid", crease: "lo" }));
      out.push(D(posts.map(([x, y]) => at([x + o[0] + 5.6, y + o[1], z + o[2] + 2.5])), { size: 0.5 }));
    }
    return out.join("");
  }

  function phone(o) {
    const out = [];
    const dock = { x: -2, y: 0, w: 32, d: 16, r: 3 };
    out.push(`<path class="iso-halo" d="${box(o, k.insetPlan(dock, 2), 0, 1).fill}" style="opacity:.25"/>`);
    out.push(S(box(o, dock, 0, 4.6, 5, 0.6), { tone: "mid" }));
    out.push(D(k.corners(dock, 3.2).map(([x, y]) => at([x + o[0], y + o[1], o[2] + 4.6])), { size: 0.45 }));
    // escora traseira
    out.push(S(box(o, { x: 10, y: 3, w: 8, d: 4, r: 1 }, 4.6, 26, 2, 0.3), { tone: "lo" }));
    // capa robusta com cantos reforçados
    const C = { x: 1.5, y: 7, w: 25, d: 4, r: 2.6 };
    out.push(S(box(o, C, 6.4, 46, 5, 0.5), { tone: "mid" }));
    const face = faceOf("y", o[1] + C.y + C.d);
    const scr = { u0: o[0] + C.x + 2.6, u1: o[0] + C.x + C.w - 2.6, z0: o[2] + 11.6, z1: o[2] + 47.4, r: 2, depth: 0.7 };
    const W = scr.u1 - scr.u0;
    const u = (t) => scr.u0 + W * t;
    const v = (z) => -(o[2] + z);
    const content = [
      `<text class="cn-label" x="${u(0.1)}" y="${v(44)}" font-size="2.4">Minhas ordens</text>`,
      status("op", u(0.1), v(39), 3.2),
      pips("op", u(0.1), v(36.2), W * 0.8, 1.7),
      `<path class="cn-row" d="${flat(u(0.1), o[2] + 26.4, u(0.9), o[2] + 32, 1, 2)}"/>`,
      rule(u(0.18), u(0.72), v(29.6), "lo"),
      `<path class="cn-btn" d="${flat(u(0.1), o[2] + 14, u(0.9), o[2] + 19.4, 2.4, 3)}"/>`,
      `<path class="cn-row" d="${flat(u(0.1), o[2] + 21, u(0.9), o[2] + 24.4, 1, 2)}"/>`,
      flash("op", scr.u0, scr.z0, scr.u1, scr.z1, scr.r),
    ].join("");
    out.push(recess(face, { u0: scr.u0 - 1, u1: scr.u1 + 1, z0: scr.z0 - 1, z1: scr.z1 + 1, r: 2.6, depth: 0.3 }, "", "cn-bezel", recess(face, scr, content, "cn-glass")));
    // cantoneiras de borracha
    for (const [cx, cz] of [[C.x + 1.6, 8.2], [C.x + C.w - 1.6, 8.2], [C.x + 1.6, 50.6], [C.x + C.w - 1.6, 50.6]]) out.push(D([at([o[0] + cx, o[1] + C.y + C.d, o[2] + cz])], { size: 0.5, tone: "lo" }));
    // trava frontal do berço
    out.push(S(box(o, { x: 0, y: 11.2, w: 28, d: 4, r: 1.4 }, 4.6, 5.2, 3, 0.4), { tone: "mid" }));
    out.push(D([at([o[0] + 14, o[1] + 15.2, o[2] + 7.2])], { size: 0.6, tone: "hi" }));
    return out.join("");
  }

  // braço do mobile: viga do eixo até a plataforma do aparelho
  function arm(dir, z, len, plat) {
    const out = [];
    const beam = dir === "y" ? { x: -4, y: SHAFT_R - 1, w: 8, d: len, r: 1 } : { x: SHAFT_R - 1, y: -4, w: len, d: 8, r: 1 };
    out.push(S(k.cylinder(0, 0, SHAFT_R + 2.4, z - 2, 9, P, 32, 0.4), { tone: "mid" }));
    out.push(S(k.slabOf(beam, z - 1, 4, P, 2, 0.3), { tone: "mid" }));
    out.push(S(k.slabOf(plat, z + 3, 2.4, P, 4, 0.6), { tone: "mid" }));
    out.push(D(k.corners(plat, 3).map(([x, y]) => at([x, y, z + 5.4])), { size: 0.45 }));
    // mão-francesa sob a viga
    const brace = dir === "y" ? [[-1.5, SHAFT_R + 1], [1.5, SHAFT_R + 1], [1.5, SHAFT_R + len * 0.55], [-1.5, SHAFT_R + len * 0.55]] : [[SHAFT_R + 1, -1.5], [SHAFT_R + len * 0.55, -1.5], [SHAFT_R + len * 0.55, 1.5], [SHAFT_R + 1, 1.5]];
    out.push(S(k.extrude(brace, z - 9, 8, P, { bevel: 0 }), { tone: "lo" }));
    return out.join("");
  }

  // ───────── montagem em ordem de pintura ─────────
  const dev = (name, svg) => `<g class="cn-dev" data-dev="${name}" tabindex="-1">${svg}</g>`;
  const body = [log(), nameplate()];
  if (mobile) body.push(cableSvg("op"));
  else body.push(...DEVICES.map(cableSvg));

  if (!mobile) {
    // de trás para frente: tablet e notebook (profundidade ~0) junto do eixo; celular e cerca na frente
    const items = [
      { key: depth([O.adm[0], O.adm[1], 0]) - 0.01, svg: dev("adm", tablet(O.adm)) },
      { key: depth([O.web[0] + 10, O.web[1] + 30, 0]), svg: dev("web", laptop(O.web)) },
      { key: 0, svg: axle() + `<g data-part="marks">${marks()}</g><path class="iso-line cn-pointer" data-tone="lit" data-free="" data-part="pointer" d="${pointerAt(STEP_ANGLES[0])}"/>` + hub() },
      { key: depth([O.op[0] - 14, O.op[1] + 8, 0]), svg: fence(O.op) },
      { key: depth([O.op[0], O.op[1] + 8, 0]) + 0.01, svg: dev("op", phone(O.op)) },
    ].sort((a, b) => a.key - b.key);
    body.push(...items.map((it) => it.svg));
  } else {
    // mobile: celular no chão (campo), eixo alto com braços para o tablet e o notebook
    const shaftSvg = axle();
    body.push(shaftSvg);
    body.push(arm("x", O.adm[2], 30, { x: SHAFT_R + 24, y: -36, w: 26, d: 70, r: 3 }));
    body.push(cableSvg("adm"));
    body.push(dev("adm", tablet([O.adm[0], O.adm[1] + 30, O.adm[2] + 5.4])));
    body.push(arm("y", O.web[2], 24, { x: -36, y: SHAFT_R + 18, w: 72, d: 52, r: 3 }));
    body.push(cableSvg("web"));
    body.push(dev("web", laptop([O.web[0] + 4, O.web[1] - 4, O.web[2] + 5.4])));
    body.push(`<g data-part="marks">${marks()}</g><path class="iso-line cn-pointer" data-tone="lit" data-free="" data-part="pointer" d="${pointerAt(STEP_ANGLES[0])}"/>` + hub());
    body.push(dev("op", phone(O.op)));
  }

  // pulsos: um ponto aceso por cabo, escondido até haver sincronização
  body.push(`<g class="cn-pulses">${DEVICES.map((d) => `<circle class="cn-pulse" data-pulse="${d}" r="2.1" cx="-99" cy="-99"/>`).join("")}</g>`);

  const label = mobile
    ? "Rodela de tronco com o cerne escuro no centro. Dele sobe um eixo de madeira com um mostrador no topo; dois braços levam um notebook (Cerne Web) e um tablet (Cerne Administração), e um celular robusto (Cerne Operação) fica na base. Cabos ligam os três ao eixo: todos leem a mesma ordem de serviço."
    : "Rodela de tronco com o cerne escuro no centro. Dele sobe um eixo de madeira com um mostrador no topo. Três cabos saem da base do eixo até um notebook (Cerne Web), um tablet num suporte (Cerne Administração) e um celular robusto num berço junto a uma cerca de curral (Cerne Operação). O ponteiro do mostrador indica o passo da ordem de serviço e as três telas mostram o mesmo estado.";
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label, body: body.join(""), className: `cn-svg cn-${layout}` });

  const data = {
    layout,
    width: WIDTH,
    height: HEIGHT,
    P,
    dialTop: DIAL_TOP + 0.2,
    pointerR: POINTER_R,
    stepAngles: STEP_ANGLES,
    cables: Object.fromEntries(DEVICES.map((d) => [d, cable[d].map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)])])),
    press: k.axisVector(P, [0, 0, -1.6]).map((n) => +n.toFixed(3)),
  };
  return { svg, data };
}

mkdirSync(OUT_HTML, { recursive: true });
const css = (await import("node:fs")).readFileSync(join(HERE, "..", "kit", "iso.css"), "utf8");
for (const layout of ["desktop", "mobile"]) {
  const { svg, data } = build(layout);
  const ts = `// Gerado por tools/iso/cerne/build.mjs. Não editar à mão.\n/* eslint-disable */\nexport const SVG = ${JSON.stringify(svg)};\nexport const DATA = ${JSON.stringify(data)} as const;\n`;
  writeFileSync(join(OUT_TS, `art.${layout}.ts`), ts);
  const page = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Eixo do Cerne · ${layout}</title><style>${css}
body{margin:0;background:#f5f8f4}.wrap{width:min(${data.width + 60}px,100% - 24px);margin:40px auto}.iso-plate{--anatomy-card:#fff}
.cn-bark{fill:var(--cn-bark)}.cn-heart{fill:var(--cn-heart)}.cn-crack{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:.5}
.cn-well{fill:var(--anatomy-shade-1)}.cn-bezel{fill:#2b2f2c}.cn-glass{fill:#f7faf8}.cn-bar{fill:#e7efe9}.cn-side{fill:#eef4f0}.cn-row,.cn-col{fill:#e3ebe5}.cn-btn{fill:#059669}.cn-chip{fill:#d1fae5}
.cn-label{fill:#4a5b50;font-family:system-ui}.cn-status{fill:#171717;font-family:system-ui;font-weight:600}.cn-pip{fill:#d3dfd6}.cn-pip[data-on]{fill:#059669}.cn-flash{fill:#059669;opacity:0}
.cn-mark{fill:var(--anatomy-paper);stroke:var(--anatomy-mid);stroke-width:.6}.iso-line.cn-pointer{stroke:#047857;stroke-width:1.6px}.iso-line.cn-cord{stroke:#8f9a93;stroke-width:2.6px}.iso-line.cn-core{stroke:#eef3ef;stroke-width:1px}.cn-pulse{fill:#059669}
.iso{--cn-bark:#d9d6cf;--cn-heart:#e8efe7}
</style></head><body class="iso" data-theme="light"><div class="wrap"><div class="iso-plate">${svg}</div></div></body></html>`;
  writeFileSync(join(OUT_HTML, `cerne-${layout}.html`), page);
  const nodes = (svg.match(/<(path|circle|rect|text|g)\b/g) || []).length;
  console.log(`${layout}: ${(svg.length / 1024).toFixed(1)} KB, ${nodes} nós`);
}
