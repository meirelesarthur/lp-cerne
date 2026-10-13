"""Exporta ~N quadros WebP para o scrub. Uso: python export_frames.py <desktop|mobile> <largura> [N] [qualidade]"""
import sys, glob, os, shutil
from PIL import Image
variant, width = sys.argv[1], int(sys.argv[2])
N = int(sys.argv[3]) if len(sys.argv) > 3 else 120
Q = int(sys.argv[4]) if len(sys.argv) > 4 else 75
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
src = sorted(glob.glob(f'{ROOT}/video/hero-a/out/{variant}/frames/f_*.png'))
dst = f'{ROOT}/public/frames/hero/{variant}'
shutil.rmtree(dst, ignore_errors=True); os.makedirs(dst)
idx = [round(i * (len(src) - 1) / (N - 1)) for i in range(N)]
total = 0
for k, i in enumerate(idx, 1):
    im = Image.open(src[i]).convert('RGB')
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    p = f'{dst}/{k:03d}.webp'; im.save(p, 'WEBP', quality=Q, method=6); total += os.path.getsize(p)
    if k in (1, N):
        im.save(f'{dst}/poster-{"first" if k == 1 else "last"}.webp', 'WEBP', quality=82, method=6)
print(variant, N, 'quadros', round(total / 1e6, 2), 'MB')
