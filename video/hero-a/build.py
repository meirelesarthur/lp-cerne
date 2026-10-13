"""Composição do Hero: base (Magnific) + tela real do web + zoom final + transição para #051008.

Uso: python build.py <desktop|mobile>
Saída: video/hero-a/out/<variante>/f_0001.png ... e hero-<variante>.mp4
"""
import sys, subprocess, shutil, glob, os
import numpy as np
from PIL import Image, ImageFilter

variant = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GEN = f'{ROOT}/assets/gen'
OUT = f'{ROOT}/video/hero-a/out/{variant}'
CAPTURE = f'{ROOT}/assets/capture/visao-geral-' + ('2560x1440' if variant == 'desktop' else '1680x1050') + '.png'
BG_END = (5, 16, 8)  # #051008
FPS = 24
FADE_IN, ZOOM, HOLD = 12, 40, 12  # quadros do trecho final

shutil.rmtree(OUT, ignore_errors=True); os.makedirs(f'{OUT}/base'); os.makedirs(f'{OUT}/frames')
base = f'{GEN}/base.mp4' if variant == 'desktop' else f'{GEN}/base-mobile.mp4'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', base, '-r', str(FPS), f'{OUT}/base/b_%04d.png'], check=True)
bf = sorted(glob.glob(f'{OUT}/base/b_*.png'))
last = Image.open(bf[-1]).convert('RGB')
W, H = last.size

def detect_screen(im):
    g = np.array(im.convert('L')).astype(int) < 32
    cx0, cx1 = int(W * .3), int(W * .7)
    cy0, cy1 = int(H * .2), int(H * .6)
    cols = np.where(g[cy0:cy1].mean(0) > .85)[0]
    rows = np.where(g[:, cx0:cx1].mean(1) > .85)[0]
    return cols.min(), rows.min(), cols.max(), rows.max()

if variant == 'desktop':
    rx, ry, rw, rh = 438, 203, 980, 551  # medido no último quadro
else:
    rx, ry, rw, rh = 72, 465, 478, 300  # medido no último quadro mobile (16:10)
print('tela', rx, ry, rw, rh, 'frame', W, H)

cap = Image.open(CAPTURE).convert('RGB')
# cover-crop para a proporção da tela
tr = rw / rh; cr = cap.width / cap.height
if cr > tr:
    nw = int(cap.height * tr); cap = cap.crop(((cap.width - nw) // 2, 0, (cap.width - nw) // 2 + nw, cap.height))
else:
    nh = int(cap.width / tr); cap = cap.crop((0, 0, cap.width, nh))
# reflexo diagonal sutil
yy, xx = np.mgrid[0:cap.height, 0:cap.width]
gr = np.clip(1 - (xx / cap.width + (1 - yy / cap.height)) / 1.1, 0, 1) * 0.07
arr = np.array(cap).astype(float) * (1 - gr[..., None]) + 255 * gr[..., None]
cap = Image.fromarray(arr.astype('uint8'))

scx, scy = rx + rw / 2, ry + rh / 2
# desktop: a tela preenche o quadro; mobile: a tela cabe na área visível após o cover do canvas (~470 px)
s_end = (W if variant == 'desktop' else 470) / rw
ease = lambda t: t * t * (3 - 2 * t)
solid = Image.new('RGB', (W, H), BG_END)

def compose(k_fade, e, dark):
    s = 1 + (s_end - 1) * e
    # centro do zoom: do centro do quadro para o centro da tela (desktop) / centro da tela (mobile)
    tx, ty = (W / 2, H / 2) if variant == 'desktop' else (W / 2, H / 2)
    cx = W / 2 + (scx - W / 2) * e
    cy = H / 2 + (scy - H / 2) * e
    a = 1 / s
    warped = last.transform((W, H), Image.AFFINE, (a, 0, cx - (W / 2) * a, 0, a, cy - (H / 2) * a), Image.BICUBIC)
    # fundo escurece para #051008 ao longo do zoom
    frame = Image.blend(warped, solid, min(1, e * 1.0)) if variant == 'mobile' else warped
    # tela
    ox = (rx - cx) * s + W / 2; oy = (ry - cy) * s + H / 2
    ow, oh = max(1, round(rw * s)), max(1, round(rh * s))
    scr = cap.resize((ow, oh), Image.LANCZOS)
    if k_fade < 1:
        black = Image.new('RGB', (ow, oh), (4, 6, 5))
        scr = Image.blend(black, scr, k_fade)
    frame.paste(scr, (round(ox), round(oy)))
    if dark > 0:
        frame = Image.blend(frame, solid, dark)
    return frame

n = 0
def save(im):
    global n; n += 1; im.save(f'{OUT}/frames/f_{n:04d}.png')

for p in bf:
    save(Image.open(p).convert('RGB'))
for i in range(FADE_IN):
    save(compose(ease((i + 1) / FADE_IN), 0, 0))
for i in range(ZOOM):
    save(compose(1, ease((i + 1) / ZOOM), 0))
for i in range(HOLD):
    save(compose(1, 1, 0.30 * ease((i + 1) / HOLD)))
print('quadros', n)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', f'{OUT}/frames/f_%04d.png',
                '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', f'{OUT}/hero-{variant}.mp4'], check=True)
