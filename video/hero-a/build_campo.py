"""Vídeo "do campo ao escritório" (seção Perfis): clip contínuo (Magnific) -> telas magenta rastreadas -> quadros WebP.

Início: celular do vaqueiro (retrato) recebe a OS real do app Operação.
Fim: notebook do gestor recebe o painel real de Pecuária de Corte (web, modo claro).

Uso:  python build_campo.py desktop      (mobile usa os mesmos quadros recortados ao centro)
Saída: public/frames/campo/<variante>/NNN.webp + poster-first/last.webp + manifest.json
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
from chroma import composite_soft, crop_to_aspect, components, despill, fit_quad, key  # noqa: E402
from track_screen import smooth  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GEN = f'{ROOT}/assets/gen-v3'
PHONE = f'{ROOT}/assets/capture/app/op-03.png'
LAPTOP = f'{ROOT}/assets/capture/light/pecuaria-full.png'
CFG = {
    'desktop': dict(count=110, width=1280, q=68, crop=None),
    'mobile': dict(count=96, width=720, q=68, crop=0.8),  # recorte central 4:5 do mesmo plano
}
FPS = 24
variant = sys.argv[1]
c = CFG[variant]
WORK = f'{ROOT}/video/hero-a/out-campo'
OUT = f'{ROOT}/public/frames/campo/{variant}'

if not os.path.isdir(f'{WORK}/src') or not glob.glob(f'{WORK}/src/*.png'):
    shutil.rmtree(WORK, ignore_errors=True); os.makedirs(f'{WORK}/src')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{GEN}/clip-campo.mp4', '-r', str(FPS), f'{WORK}/src/f_%05d.png'], check=True)
files = sorted(glob.glob(f'{WORK}/src/f_*.png'))
n = len(files)
H0, W0 = cv2.imread(files[0]).shape[:2]

# telas: celular (retrato) e notebook (paisagem) podem aparecer juntos no meio do plano -> classifica pela orientação
comps = [components(key(cv2.imread(p))) for p in files]
phone_raw, laptop_raw = [None] * n, [None] * n


def quad_of(group):
    pts = np.vstack([d['pts'] for d in group])
    hull = cv2.convexHull(pts).reshape(-1, 2).astype(np.float32)
    return fit_quad(hull) if len(hull) >= 4 else None


for i, cs in enumerate(comps):
    port, land = [], []
    for d in cs:
        x0, y0, x1, y1 = d['bbox']
        (port if (y1 - y0) > 1.25 * (x1 - x0) else land).append(d)
    if port:
        main = max(port, key=lambda d: d['area'])
        # pedaços do mesmo celular (dedos dividem a tela) ficam próximos do maior
        grp = [d for d in port + land if np.linalg.norm(d['c'] - main['c']) < 1.2 * (main['bbox'][3] - main['bbox'][1])
               and (d in port or d['area'] < main['area'] * 0.3)]
        phone_raw[i] = quad_of(grp)
        land = [d for d in land if all(d is not g for g in grp)]
    if land:
        main = max(land, key=lambda d: d['area'])
        grp = [d for d in land if np.linalg.norm(d['c'] - main['c']) < 1.0 * (main['bbox'][2] - main['bbox'][0])]
        laptop_raw[i] = quad_of(grp)
split = -1
phone = smooth(phone_raw, alpha=0.65, max_gap=3)
laptop = smooth(laptop_raw, alpha=0.6, max_gap=3)
print(f'{variant}: {n} quadros | celular em {sum(q is not None for q in phone)} | notebook em {sum(q is not None for q in laptop)}')

phone_img = cv2.imread(PHONE)
lap_full = cv2.imread(LAPTOP)
lap_full = lap_full[16:-16, 16:-16]
# telas rígidas: a homografia cuida da perspectiva, então a imagem entra inteira na proporção real do aparelho
lap_screen = crop_to_aspect(lap_full, 16 / 10)


def screen_for(img, quad):
    wq = (np.linalg.norm(quad[1] - quad[0]) + np.linalg.norm(quad[2] - quad[3])) / 2
    hq = (np.linalg.norm(quad[3] - quad[0]) + np.linalg.norm(quad[2] - quad[1])) / 2
    return crop_to_aspect(img, wq / hq)


os.makedirs(OUT, exist_ok=True); [os.remove(p) for p in glob.glob(f'{OUT}/*')]
idx = [round(j * (n - 1) / (c['count'] - 1)) for j in range(c['count'])]
total = 0
for j, i in enumerate(idx, 1):
    fr = cv2.imread(files[i])
    if phone[i] is not None:
        fr = composite_soft(fr, phone[i], phone_img)
    if laptop[i] is not None:
        fr = composite_soft(fr, laptop[i], lap_screen)
    # resto de magenta (aparelho entrando/saindo do quadro) vira neutro
    if key(fr).max() > 0.2:
        fr = despill(fr)
    if c['crop']:
        cw = round(H0 * c['crop'])
        x0 = (W0 - cw) // 2
        fr = fr[:, x0:x0 + cw]
    oh = round(fr.shape[0] * c['width'] / fr.shape[1])
    im = cv2.resize(fr, (c['width'], oh), interpolation=cv2.INTER_AREA)
    pth = f'{OUT}/{j:03d}.webp'
    cv2.imwrite(pth, im, [cv2.IMWRITE_WEBP_QUALITY, c['q']]); total += os.path.getsize(pth)
    if j in (1, c['count']):
        cv2.imwrite(f'{OUT}/poster-{"first" if j == 1 else "last"}.webp', im, [cv2.IMWRITE_WEBP_QUALITY, 80])
with open(f'{OUT}/manifest.json', 'w', encoding='utf-8') as f:
    json.dump({'count': c['count'], 'width': c['width'], 'height': oh}, f)
print(f'{variant}: {c["count"]} quadros, {total / 1e6:.2f} MB')
