"""Vídeo da seção Perfis v2, tela cheia: campo -> fazenda inteira -> escritório (2 clipes Magnific encadeados).

Clip 1: vaqueiro na leitura de cocho com a OS no celular -> a câmera sobe até a vista aérea da fazenda.
Clip 2: da vista aérea a câmera desce, entra pela fachada de vidro e chega ao gestor com o notebook.
O último quadro do clip 1 e o primeiro do clip 2 são a mesma imagem, então a emenda descarta um deles.

Telas magenta: celular (retrato) recebe a OS real do app Operação; notebook (paisagem) recebe o painel
real de Pecuária de Corte. No mobile o recorte vertical segue o aparelho em foco (pan & scan suavizado).

Uso:  python build_perfis.py desktop|desktop-hd|mobile
Saída: public/frames/perfis/<variante>/NNN.avif + NNN.webp + poster-first/last.webp + manifest.json
"""
import glob
import json
import os
import shutil
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from chroma import composite_soft, crop_to_aspect, components, despill, fit_quad, key  # noqa: E402
from track_screen import smooth  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GEN = f'{ROOT}/assets/gen-v4'
CLIPS = [f'{GEN}/clip-1.mp4', f'{GEN}/clip-2.mp4']
PHONE = f'{ROOT}/assets/capture/app/op-03.png'
LAPTOP = f'{ROOT}/assets/capture/light/pecuaria-full.png'
CFG = {
    'desktop': dict(count=130, width=1280, q=58, aq=45, crop=None),
    'mobile': dict(count=120, width=648, q=58, aq=52, crop=0.6),  # recorte vertical 0,6:1 que acompanha o foco
    # HD: resolução nativa do clip (1920), só AVIF; usada em tela grande com boa conexão (mesma regra do Hero)
    'desktop-hd': dict(count=130, width=1920, q=None, aq=52, crop=None),
}
# AVIF é o formato principal (~30% menor que WebP na mesma qualidade); WebP fica de reserva
FPS = 24
variant = sys.argv[1]
c = CFG[variant]
WORK = f'{ROOT}/video/hero-a/out-perfis'
OUT = f'{ROOT}/../public/frames/perfis/{variant}'

if not glob.glob(f'{WORK}/src/*.png'):
    shutil.rmtree(WORK, ignore_errors=True); os.makedirs(f'{WORK}/src')
    for k, clip in enumerate(CLIPS):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', clip, '-r', str(FPS), f'{WORK}/src/c{k}_%05d.png'], check=True)
    # emenda: o 1º quadro do clip 2 repete o último do clip 1
    os.remove(sorted(glob.glob(f'{WORK}/src/c1_*.png'))[0])
files = sorted(glob.glob(f'{WORK}/src/c*_*.png'))
n = len(files)
H0, W0 = cv2.imread(files[0]).shape[:2]

comps = [components(key(cv2.imread(p))) for p in files]
phone_raw, laptop_raw = [None] * n, [None] * n


def quad_of(group):
    pts = np.vstack([d['pts'] for d in group])
    hull = cv2.convexHull(pts).reshape(-1, 2).astype(np.float32)
    return fit_quad(hull) if len(hull) >= 4 else None


for i, cs in enumerate(comps):
    cs = [d for d in cs if d['area'] > 120]
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
phone = smooth(phone_raw, alpha=0.65, max_gap=3)
laptop = smooth(laptop_raw, alpha=0.6, max_gap=3)
print(f'{variant}: {n} quadros | celular em {sum(q is not None for q in phone)} | notebook em {sum(q is not None for q in laptop)}')

phone_img = cv2.imread(PHONE)
lap_full = cv2.imread(LAPTOP)[16:-16, 16:-16]
lap_screen = crop_to_aspect(lap_full, 16 / 10)

# foco horizontal para o recorte do mobile: o aparelho visível; sem aparelho, volta suave ao centro
focus = np.full(n, W0 / 2, dtype=np.float32)
for i in range(n):
    q = phone[i] if phone[i] is not None else laptop[i]
    if q is not None:
        # notebook: puxa um pouco para a direita para o gestor entrar no quadro
        focus[i] = float(q[:, 0].mean()) + (0 if phone[i] is not None else 0.05 * W0)
k = np.exp(-np.linspace(-2, 2, 49) ** 2); k /= k.sum()  # ~2 s de suavização: câmera virtual sem tranco
focus = np.convolve(np.pad(focus, 24, mode='edge'), k, mode='valid')

os.makedirs(OUT, exist_ok=True); [os.remove(p) for p in glob.glob(f'{OUT}/*')]
idx = [round(j * (n - 1) / (c['count'] - 1)) for j in range(c['count'])]
total = total_a = 0
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
        x0 = int(np.clip(focus[i] - cw / 2, 0, W0 - cw))
        fr = fr[:, x0:x0 + cw]
    oh = round(fr.shape[0] * c['width'] / fr.shape[1])
    im = cv2.resize(fr, (c['width'], oh), interpolation=cv2.INTER_AREA)
    if c['q']:
        pth = f'{OUT}/{j:03d}.webp'
        cv2.imwrite(pth, im, [cv2.IMWRITE_WEBP_QUALITY, c['q']]); total += os.path.getsize(pth)
    pa = f'{OUT}/{j:03d}.avif'
    Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).save(pa, 'AVIF', quality=c['aq'], speed=6); total_a += os.path.getsize(pa)
    if j in (1, c['count']):
        cv2.imwrite(f'{OUT}/poster-{"first" if j == 1 else "last"}.webp', im, [cv2.IMWRITE_WEBP_QUALITY, 80])
with open(f'{OUT}/manifest.json', 'w', encoding='utf-8') as f:
    json.dump({'count': c['count'], 'width': c['width'], 'height': oh}, f)
print(f'{variant}: {c["count"]} quadros, AVIF {total_a / 1e6:.2f} MB | WebP {total / 1e6:.2f} MB')
