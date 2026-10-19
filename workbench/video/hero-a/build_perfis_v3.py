"""Vídeo da seção Perfis v3: campo -> corredor de trato -> escritório, num plano contínuo (2 clipes Magnific encadeados).

Clip 1 (5 s): ombro do vaqueiro com a OS no celular -> o drone sobe acima do mesmo corredor de trato.
Clip 2 (10 s): o drone segue pelo corredor até a fachada de vidro, entra e chega ao gestor com o notebook.
O último quadro do clip 1 e o primeiro do clip 2 são a mesma imagem, então a emenda descarta um deles.

Desktop sai dos clipes 16:9 (1080p); mobile, dos clipes 9:16 nativos (sem recorte). As telas magenta recebem os
prints reais (OS do app Operação no celular, painel de Pecuária de Corte no notebook) DEPOIS de levar o quadro
à largura final, então a interface fica nítida mesmo quando o fundo é ampliado (variante 2k, 2560 px).

Uso:  python build_perfis_v3.py desktop|desktop-hd|desktop-2k|mobile
Saída: public/frames/perfis-v4/<variante>/NNN.avif (+ .webp nas variantes leves) + poster-first/last.webp + manifest.json
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
GEN = f'{ROOT}/assets/gen-v6'
# c16-1c: o vaqueiro fica parado e sai pela direita enquanto a câmera avança pelo corredor (no c16-1 ele "afundava")
CLIPS = {'16x9': [f'{GEN}/c16-1c.mp4', f'{GEN}/c16-2.mp4'], '9x16': [f'{GEN}/c916-1.mp4', f'{GEN}/c916-2.mp4']}
PHONE = f'{ROOT}/assets/capture/app/op-03.png'
LAPTOP = f'{ROOT}/assets/capture/light/pecuaria-full.png'
CFG = {
    'desktop': dict(src='16x9', count=130, width=1280, q=58, aq=45),
    # HD: resolução nativa do clip (1920), só AVIF; tela grande com boa conexão (mesma regra do Hero)
    'desktop-hd': dict(src='16x9', count=130, width=1920, q=None, aq=52),
    # 2k: fundo ampliado de 1920 para 2560 e telas compostas já em 2560, para ler o app e o painel em monitor grande
    'desktop-2k': dict(src='16x9', count=130, width=2560, q=None, aq=50),
    'mobile': dict(src='9x16', count=120, width=608, q=58, aq=52),
}
FPS = 24
variant = sys.argv[1]
c = CFG[variant]
WORK = f'{ROOT}/video/hero-a/out-perfis-v3-{c["src"]}'
OUT = f'{ROOT}/../public/frames/perfis-v4/{variant}'  # pasta nova a cada plano: o R2 serve os quadros como immutable

if not glob.glob(f'{WORK}/src/*.png'):
    shutil.rmtree(WORK, ignore_errors=True); os.makedirs(f'{WORK}/src')
    for k, clip in enumerate(CLIPS[c['src']]):
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

s = c['width'] / W0  # escala do quadro do clip até a largura final
os.makedirs(OUT, exist_ok=True); [os.remove(p) for p in glob.glob(f'{OUT}/*')]
idx = [round(j * (n - 1) / (c['count'] - 1)) for j in range(c['count'])]
total = total_a = 0
for j, i in enumerate(idx, 1):
    fr = cv2.imread(files[i])
    ow, oh = c['width'], round(H0 * s)
    # amplia (Lanczos) ou reduz (área) o fundo ANTES da composição: a tela entra na resolução final
    fr = cv2.resize(fr, (ow, oh), interpolation=cv2.INTER_LANCZOS4 if s > 1 else cv2.INTER_AREA)
    if phone[i] is not None:
        fr = composite_soft(fr, phone[i] * s, phone_img)
    if laptop[i] is not None:
        fr = composite_soft(fr, laptop[i] * s, lap_screen)
    # resto de magenta (aparelho entrando/saindo do quadro) vira neutro
    if key(fr).max() > 0.2:
        fr = despill(fr)
    if c['q']:
        pth = f'{OUT}/{j:03d}.webp'
        cv2.imwrite(pth, fr, [cv2.IMWRITE_WEBP_QUALITY, c['q']]); total += os.path.getsize(pth)
    pa = f'{OUT}/{j:03d}.avif'
    Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)).save(pa, 'AVIF', quality=c['aq'], speed=6); total_a += os.path.getsize(pa)
    if j in (1, c['count']):
        cv2.imwrite(f'{OUT}/poster-{"first" if j == 1 else "last"}.webp', fr, [cv2.IMWRITE_WEBP_QUALITY, 80])
with open(f'{OUT}/manifest.json', 'w', encoding='utf-8') as f:
    json.dump({'count': c['count'], 'width': c['width'], 'height': oh}, f)
print(f'{variant}: {c["count"]} quadros, AVIF {total_a / 1e6:.2f} MB | WebP {total / 1e6:.2f} MB')
