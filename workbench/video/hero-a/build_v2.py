"""Hero v2: clip contínuo (Magnific) -> telas magenta rastreadas -> composição -> quadros WebP + cena final + chão.

Uso:  python build_v2.py desktop      |      python build_v2.py mobile

Entradas (assets/gen-v2):  clip, still do último quadro (K3), plantação vertical (chão da 2ª seção).
Saídas (public/frames/hero/<variante>):
  NNN.webp, poster-first/last.webp       sequência do scroll
  final.webp                             still em alta do último quadro, tela já composta (base)
  final-fg.webp                          primeiro plano recortado (morros/neblina na frente da tela), RGBA
  ground.webp                            still + plantação abaixo (fundo fixo da 2ª seção, emenda exata)
  manifest.json                          {count,width,height, final:{src,fg,tablet}, ground:{src,w,h,frame}}
"""
import glob
import json
import os
import shutil
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from track_screen import smooth  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GEN = f'{ROOT}/assets/gen-v2'
CFG = {
    'desktop': dict(clip='clip-v2.mp4', still='K3-b.png', ground='P2-plantacao-9x16.png', count=160, width=1280, still_w=2560, q=66,
                    hd=dict(count=128, width=1920, q=50)),  # versão HD em AVIF (desktop grande + boa conexão)
    'mobile': dict(clip='clip-mobile-v2.mp4', still='K3-9x16.png', ground='P2-plantacao-9x16.png', count=150, width=608, still_w=1080, q=70),
}
SCREEN_ASPECT = 1.45            # tela do tablet (largura/altura); a base fica escondida pelos morros
HAND_SCREEN = f'{ROOT}/assets/capture/light/visao-geral.png'
APP_FULL = f'{ROOT}/../public/app/visao-geral-full.webp'
FPS = 24

variant = sys.argv[1]
c = CFG[variant]
WORK = f'{ROOT}/video/hero-a/out-v2/{variant}'
OUT = f'{ROOT}/../public/frames/hero/{variant}'
shutil.rmtree(WORK, ignore_errors=True); os.makedirs(f'{WORK}/src')


# ---------- chroma ----------
def key(bgr):
    """Quão magenta é cada pixel (0-1), tolerante a brilho/neblina."""
    f = bgr.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    k = np.clip((np.minimum(r, b) - g - 25) / 90, 0, 1)
    k[(r < 110) | (b < 110)] = 0
    return k


def despill(bgr, k=None):
    """Tira o rosa residual: remove o quanto min(R,B) passa de G (só onde há tom magenta)."""
    f = bgr.astype(np.float32)
    g = f[..., 1]
    m = np.clip(np.minimum(f[..., 0], f[..., 2]) - g, 0, None)
    if k is not None:
        m = m * np.clip(k * 4 + 0.35, 0, 1)
    f[..., 0] -= m; f[..., 2] -= m
    return np.clip(f, 0, 255).astype(np.uint8)


def hand_quad(k):
    """Tablet na mão: cantos = pontos extremos do contorno convexo do maior componente (robusto a dedos na borda)."""
    m = (k > 0.35).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None
    big = max(cv2.contourArea(x) for x in cnts)
    if big < 250:
        return None
    # dedos podem dividir a tela em pedaços: une todos os pedaços relevantes
    pts = np.vstack([x.reshape(-1, 2) for x in cnts if cv2.contourArea(x) > big * 0.02])
    hull = cv2.convexHull(pts).reshape(-1, 2).astype(np.float32)
    return fit_quad(hull)


def _order(q):
    s_, d = q.sum(1), q[:, 0] - q[:, 1]
    return np.float32([q[np.argmin(s_)], q[np.argmax(d)], q[np.argmax(s_)], q[np.argmin(d)]])


def fit_quad(hull):
    """4 retas ajustadas às bordas do contorno convexo (sem a região dos cantos) e intersectadas.
    Reconstrói cantos escondidos por dedos, mantendo a perspectiva."""
    box = _order(cv2.boxPoints(cv2.minAreaRect(hull)).astype(np.float32))
    # amostra densa ao longo das arestas do contorno convexo
    pts = []
    for a, b in zip(hull, np.roll(hull, -1, 0)):
        n_ = max(2, int(np.linalg.norm(b - a) / 2))
        pts.append(np.linspace(a, b, n_, endpoint=False))
    pts = np.vstack(pts)
    lines = []
    for i in range(4):
        a, b = box[i], box[(i + 1) % 4]
        ab = b - a; L = np.linalg.norm(ab); u = ab / L; nrm = np.array([-u[1], u[0]])
        t = (pts - a) @ u / L
        dist = np.abs((pts - a) @ nrm)
        sel = pts[(t > 0.15) & (t < 0.85) & (dist < max(4.0, 0.06 * L))]
        if len(sel) < 6:
            return box
        vx, vy, x0, y0 = cv2.fitLine(sel.astype(np.float32), cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        lines.append((np.array([x0, y0]), np.array([vx, vy])))
    out = []
    for i in range(4):
        (p1, d1), (p2, d2) = lines[i - 1], lines[i]
        A = np.array([d1, -d2]).T
        if abs(np.linalg.det(A)) < 1e-6:
            return box
        t_ = np.linalg.solve(A, p2 - p1)
        out.append(p1 + t_[0] * d1)
    q = _order(np.float32(out))
    # sanidade: não pode fugir muito do retângulo mínimo
    return q if np.abs(q - box).max() < 0.25 * np.linalg.norm(box[1] - box[0]) else box


def crop_to_aspect(img, aspect):
    h, w = img.shape[:2]
    if w / h > aspect:
        nw = int(h * aspect); x = (w - nw) // 2; return img[:, x:x + nw]
    return img[: int(w / aspect), :]


def warp(screen, quad, size):
    sh, sw = screen.shape[:2]
    H = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), quad.astype(np.float32))
    return cv2.warpPerspective(screen, H, size, flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)


def composite_soft(frame, quad, screen):
    """Tela por homografia, recortada pelo próprio magenta (dedos, morros e neblina ficam na frente)."""
    h, w = frame.shape[:2]
    region = np.zeros((h, w), np.uint8)
    cv2.fillConvexPoly(region, np.round(quad).astype(np.int32), 255)
    region = cv2.dilate(region, np.ones((9, 9), np.uint8)) > 0
    k = key(frame) * region
    k = cv2.GaussianBlur(k, (0, 0), 0.8)
    scr = warp(screen, quad, (w, h)).astype(np.float32)
    out = (frame.astype(np.float32) * (1 - k[..., None]) + scr * k[..., None]).astype(np.uint8)
    # resto de rosa (borda/brilho/neblina) vira neutro dentro da área da tela
    return np.where(region[..., None], despill(out), out)


def giant_quad(mask, aspect):
    """Tablet gigante de frente: lados e topo pelo magenta; a base sai da proporção."""
    ys, xs = np.where(mask > 0.5)
    if len(xs) < 200:
        return None
    x0, x1 = np.percentile(xs, 0.3), np.percentile(xs, 99.7)
    y0 = np.percentile(ys, 0.3)
    hh = (x1 - x0) / aspect
    return np.float32([[x0, y0], [x1, y0], [x1, y0 + hh], [x0, y0 + hh]])


# ---------- 1) quadros de origem ----------
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f"{GEN}/{c['clip']}", '-r', str(FPS), f'{WORK}/src/f_%05d.png'], check=True)
files = sorted(glob.glob(f'{WORK}/src/f_*.png'))
n = len(files)
H0, W0 = cv2.imread(files[0]).shape[:2]

# ---------- 2) detecção ----------
def components(k):
    """Componentes magenta do quadro: (área, centroide, pontos do contorno convexo, bbox)."""
    m = (k > 0.3).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for c_ in cnts:
        ar = cv2.contourArea(c_)
        if ar < 40:
            continue
        x, y, w_, h_ = cv2.boundingRect(c_)
        mm = cv2.moments(c_)
        cen = np.array([mm['m10'] / (mm['m00'] or 1), mm['m01'] / (mm['m00'] or 1)])
        out.append({'area': ar, 'c': cen, 'pts': c_.reshape(-1, 2), 'bbox': (x, y, x + w_, y + h_)})
    return out


all_comps = [components(key(cv2.imread(p))) for p in files]
# divisor: o maior trecho sem tela magenta separa o tablet da mão (antes) do tablet gigante (depois)
best, run, split = (0, 0), 0, n
for i, cs in enumerate(all_comps + [[{}]]):
    if not cs:
        run += 1
    else:
        if run > best[0]:
            best = (run, i)
        run = 0
split = best[1] if best[0] >= 3 else int(n * 0.6)
print(f'divisor mão/gigante no quadro {split} (vazio de {best[0]} quadros)')

hand_raw, giant_raw = [None] * n, [None] * n
for i, cs in enumerate(all_comps):
    if not cs:
        continue
    if i < split:
        pts = np.vstack([d['pts'] for d in cs])
        hull = cv2.convexHull(pts).reshape(-1, 2).astype(np.float32)
        hand_raw[i] = fit_quad(hull) if len(hull) >= 4 else None
    else:
        x0 = min(d['bbox'][0] for d in cs); x1 = max(d['bbox'][2] for d in cs)
        y0 = min(d['bbox'][1] for d in cs)
        giant_raw[i] = (np.float32([[x0, y0], [x1, y0], [x1, y0 + (x1 - x0) / SCREEN_ASPECT], [x0, y0 + (x1 - x0) / SCREEN_ASPECT]]), 0)

# tablet gigante, de trás para frente: quando o brilho/os morros escondem parte da tela, herda a largura do quadro seguinte
nxt = None
for i in range(n - 1, -1, -1):
    item = giant_raw[i]
    if item is None:
        giant_raw[i] = None
        continue
    q, _ = item
    if nxt is not None:
        wq, wn = q[1][0] - q[0][0], nxt[1][0] - nxt[0][0]
        if wq < 0.92 * wn:
            x0, x1 = nxt[0][0], nxt[1][0]
            y0 = max(q[0][1], nxt[0][1])  # subindo: antes ele estava mais baixo
            hh = (x1 - x0) / SCREEN_ASPECT
            q = np.float32([[x0, y0], [x1, y0], [x1, y0 + hh], [x0, y0 + hh]])
    giant_raw[i] = q
    nxt = q
hand = smooth(hand_raw, alpha=0.65, max_gap=3)
giant = smooth(giant_raw, alpha=0.5, max_gap=3)
print(f'{variant}: {n} quadros | tablet da mão em {sum(q is not None for q in hand)} | gigante em {sum(q is not None for q in giant)}')

app = cv2.imread(APP_FULL)
app_top = crop_to_aspect(app, SCREEN_ASPECT)  # topo da Visão Geral (o que a página mostra antes de rolar)
hand_img = app_top  # tablet da mão: mesmo topo da página inteira (largura total, sem corte lateral)


def screen_for(img, quad):
    wq = (np.linalg.norm(quad[1] - quad[0]) + np.linalg.norm(quad[2] - quad[3])) / 2
    hq = (np.linalg.norm(quad[3] - quad[0]) + np.linalg.norm(quad[2] - quad[1])) / 2
    return crop_to_aspect(img, wq / hq)


# ---------- 3) composição + exportação da sequência (WebP base e, no desktop, AVIF HD) ----------
from PIL import Image  # noqa: E402

os.makedirs(OUT, exist_ok=True); [os.remove(p) for p in glob.glob(f'{OUT}/*')]
idx = [round(j * (n - 1) / (c['count'] - 1)) for j in range(c['count'])]
hd = c.get('hd')
OUT_HD = f'{OUT}-hd'
idx_hd = [round(j * (n - 1) / (hd['count'] - 1)) for j in range(hd['count'])] if hd else []
if hd:
    os.makedirs(OUT_HD, exist_ok=True); [os.remove(p) for p in glob.glob(f'{OUT_HD}/*')]
pos = {i: j for j, i in enumerate(idx, 1)}
pos_hd = {i: j for j, i in enumerate(idx_hd, 1)}
total = total_hd = 0
for i in sorted(set(idx) | set(idx_hd)):
    fr = cv2.imread(files[i])
    if hand[i] is not None:
        fr = composite_soft(fr, hand[i], screen_for(hand_img, hand[i]))
    if giant[i] is not None:
        fr = composite_soft(fr, giant[i], app_top)
    if i in pos:
        j = pos[i]
        ow = c['width']; oh = round(H0 * ow / W0)
        im = cv2.resize(fr, (ow, oh), interpolation=cv2.INTER_AREA)
        pth = f'{OUT}/{j:03d}.webp'
        cv2.imwrite(pth, im, [cv2.IMWRITE_WEBP_QUALITY, c['q']]); total += os.path.getsize(pth)
        if j == 1:
            cv2.imwrite(f'{OUT}/poster-first.webp', im, [cv2.IMWRITE_WEBP_QUALITY, 82])
    if i in pos_hd:
        j = pos_hd[i]
        ow = hd['width']; oh = round(H0 * ow / W0)
        im = cv2.resize(fr, (ow, oh), interpolation=cv2.INTER_AREA if ow <= W0 else cv2.INTER_LANCZOS4)
        pth = f'{OUT_HD}/{j:03d}.avif'
        Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).save(pth, 'AVIF', quality=hd['q'], speed=6); total_hd += os.path.getsize(pth)
print(f'sequência: {c["count"]} quadros, {total / 1e6:.2f} MB' + (f' | HD AVIF: {hd["count"]} quadros, {total_hd / 1e6:.2f} MB' if hd else ''))

# ---------- 4) still final em alta, alinhado ao último quadro ----------
last = cv2.imread(files[-1])
still = cv2.imread(f"{GEN}/{c['still']}")
SW = c['still_w']; SH = round(still.shape[0] * SW / still.shape[1])
still = cv2.resize(still, (SW, SH), interpolation=cv2.INTER_AREA)
sc = SW / W0
qa = giant_quad(key(last), SCREEN_ASPECT)
qb = giant_quad(key(still), SCREEN_ASPECT)
dx, dy = (qa[0] * sc - qb[0])  # deslocamento entre o still e o último quadro
if max(abs(dx), abs(dy)) > 8:  # abaixo disso o crossfade do site absorve (e evita bordas replicadas)
    still = cv2.warpAffine(still, np.float32([[1, 0, dx], [0, 1, dy]]), (SW, SH), borderMode=cv2.BORDER_REFLECT)
print(f'still x último quadro: dx={dx:.1f}px dy={dy:.1f}px')
qs = giant_quad(key(still), SCREEN_ASPECT)
kst = key(still)
final = composite_soft(still, qs, app_top)
cv2.imwrite(f'{OUT}/final.webp', final, [cv2.IMWRITE_WEBP_QUALITY, 84])
cv2.imwrite(f'{OUT}/poster-last.webp', cv2.resize(final, (c['width'], round(SH * c['width'] / SW)), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 82])

# primeiro plano: o que fica NA FRENTE da tela (morros, neblina, brilho) dentro da área do tablet
region = np.zeros((SH, SW), np.uint8)
cv2.fillConvexPoly(region, np.round(qs).astype(np.int32), 255)
region = cv2.dilate(region, np.ones((7, 7), np.uint8)) > 0
alpha = (1 - cv2.GaussianBlur(kst, (0, 0), 2.2)) * region   # alfa suave: sem pontilhado na neblina
fg = despill(still)
bgra = np.dstack([fg, (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
cv2.imwrite(f'{OUT}/final-fg.webp', bgra, [cv2.IMWRITE_WEBP_QUALITY, 88])

tablet = {'x': float(qs[0][0] / SW), 'y': float(qs[0][1] / SH), 'w': float((qs[1][0] - qs[0][0]) / SW), 'h': float((qs[3][1] - qs[0][1]) / SH)}

# ---------- 5) chão da 2ª seção: still + plantação abaixo, emenda exata no rodapé ----------
def fit_w(img):
    return cv2.resize(img, (SW, round(img.shape[0] * SW / img.shape[1])), interpolation=cv2.INTER_AREA).astype(np.float32)


def smoothstep(n):
    r = np.linspace(0, 1, n, dtype=np.float32)
    return (r * r * (3 - 2 * r))[:, None, None]


# P: plantação 16:9 (perto do horizonte as linhas têm a escala do rodapé e crescem descendo = câmera inclinando)
P1 = fit_w(cv2.imread(f"{GEN}/P-plantacao.png"))
P2 = fit_w(cv2.imread(f"{GEN}/{c['ground']}"))
y0 = round(P1.shape[0] * 0.40)      # linha da plantação que encosta no rodapé
B = round(SH * 0.07)                # faixa de fusão ACIMA da emenda (no próprio quadro final)
f32 = final.astype(np.float32)
w = smoothstep(B)
f32[SH - B:] = f32[SH - B:] * (1 - w) + P1[y0 - B:y0] * w
final = f32.clip(0, 255).astype(np.uint8)
cv2.imwrite(f'{OUT}/final.webp', final, [cv2.IMWRITE_WEBP_QUALITY, 84])
cv2.imwrite(f'{OUT}/poster-last.webp', cv2.resize(final, (c['width'], round(SH * c['width'] / SW)), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, 82])
# abaixo da emenda: P1 continua exatamente de onde parou; depois funde na plantação próxima (P2) com neblina leve
rest1 = P1[y0:]
J = min(round(SH * 0.3), rest1.shape[0] // 2)
wj = smoothstep(J)
mist = np.array([230, 238, 242], np.float32)
haze = (np.sin(np.pi * np.linspace(0, 1, J, dtype=np.float32)) * 0.22)[:, None, None]
p2o = round(P2.shape[0] * 0.12)     # pula a neblina do topo de P2
join = rest1[-J:] * (1 - wj) + P2[p2o:p2o + J] * wj
join = join * (1 - haze) + mist * haze
G = np.vstack([final.astype(np.float32), rest1[:-J], join, P2[p2o + J:]]).clip(0, 255).astype(np.uint8)
GW = min(SW, 1920)
G = cv2.resize(G, (GW, round(G.shape[0] * GW / SW)), interpolation=cv2.INTER_AREA)
cv2.imwrite(f'{OUT}/ground.webp', G, [cv2.IMWRITE_WEBP_QUALITY, 78])

manifest = {
    'count': c['count'], 'width': c['width'], 'height': round(H0 * c['width'] / W0),
    'final': {'src': f'/frames/hero/{variant}/final.webp', 'fg': f'/frames/hero/{variant}/final-fg.webp', 'tablet': tablet},
    'ground': {'src': f'/frames/hero/{variant}/ground.webp', 'w': G.shape[1], 'h': G.shape[0],
               'frame': {'x': 0, 'y': 0, 'w': 1, 'h': (SH * GW / SW) / G.shape[0]}},
}
with open(f'{OUT}/manifest.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=1)
if hd:
    with open(f'{OUT_HD}/manifest.json', 'w', encoding='utf-8') as f:
        json.dump({**manifest, 'count': hd['count'], 'width': hd['width'], 'height': round(H0 * hd['width'] / W0), 'ext': 'avif',
                   'poster': f'/frames/hero/{variant}/poster-first.webp'}, f, indent=1)
sizes = {os.path.basename(p): round(os.path.getsize(p) / 1024) for p in glob.glob(f'{OUT}/*') if not os.path.basename(p)[0].isdigit()}
print('extras (KB):', sizes)
print('tablet:', tablet)
