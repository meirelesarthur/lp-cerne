"""Refaz o chão da 2ª seção (ground.webp) com UMA plantação contínua, sem neblina e sem trocar de textura no meio.
P2 é escolhida na altura em que o espaçamento das fileiras é igual ao do rodapé de P1, deslocada para as fileiras se alinharem,
com a cor ajustada a P1 e fundida numa zona longa. Lê final.webp (já com o quadro final fundido) e reescreve ground.webp + manifest.
Uso: python ground_v5.py desktop|mobile"""
import sys, os, json
import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GEN = f'{ROOT}/assets/gen-v2'
variant = sys.argv[1]
OUT = f'{ROOT}/../public/frames/hero/{variant}'
CFG = {'desktop': dict(ground='P2-plantacao-9x16.png'), 'mobile': dict(ground='P2-plantacao-9x16.png')}
c = CFG[variant]

final = cv2.imread(f'{OUT}/final.webp')
SH, SW = final.shape[:2]
fit_w = lambda img: cv2.resize(img, (SW, round(img.shape[0] * SW / img.shape[1])), interpolation=cv2.INTER_AREA)
P1 = fit_w(cv2.imread(f'{GEN}/P-plantacao.png')).astype(np.float32)
P2 = fit_w(cv2.imread(f'{GEN}/{c["ground"]}')).astype(np.float32)
y0 = round(P1.shape[0] * 0.40)

def period(img, y, win=90):
    """Espaçamento dominante das fileiras (px) numa faixa horizontal, pela autocorrelação do perfil de luminância no centro."""
    g = cv2.cvtColor(img[max(0, y - win):y].clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    x0, x1 = int(SW * 0.3), int(SW * 0.7)
    prof = g[:, x0:x1].mean(axis=0)
    prof = prof - cv2.GaussianBlur(prof[None, :], (0, 0), 40)[0]
    ac = np.correlate(prof, prof, 'full')[len(prof) - 1:]
    ac /= ac[0] + 1e-6
    lo, hi = int(SW * 0.012), int(SW * 0.2)
    k = lo + int(np.argmax(ac[lo:hi]))
    return k, float(ac[k])

pb, sb = period(P1, P1.shape[0])
print('P1 rodapé: período', pb, 'força', round(sb, 2))
best = None
for o in range(int(P2.shape[0] * 0.10), int(P2.shape[0] * 0.75), 20):
    p, s = period(P2, o)
    d = abs(p - pb)
    if best is None or (d, -s) < (best[0], -best[1]): best = (d, s, o, p)
print('P2 melhor offset', best)
_, _, p2o, p2p = best

# alinhamento lateral: desloca P2 para casar o perfil de P1 no rodapé
def prof_of(img, y, win=60):
    g = cv2.cvtColor(img[y - win:y].clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32).mean(axis=0)
    return g - cv2.GaussianBlur(g[None, :], (0, 0), 40)[0]
a, b = prof_of(P1, P1.shape[0]), prof_of(P2, p2o + 60)
best_s, best_c = 0, -1
for s in range(-pb, pb + 1, 2):
    cc = float(np.dot(a[200:-200], np.roll(b, s)[200:-200]))
    if cc > best_c: best_c, best_s = cc, s
print('deslocamento lateral', best_s)
M = np.float32([[1, 0, best_s], [0, 1, 0]])
P2 = cv2.warpAffine(P2, M, (SW, P2.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

# cor: ajusta P2 às estatísticas de P1 (LAB, região do rodapé de P1)
def lab(img): return cv2.cvtColor(img.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
ref = lab(P1[P1.shape[0] - 300:]); src = lab(P2[p2o:p2o + 1200])
m1, s1 = ref.reshape(-1, 3).mean(0), ref.reshape(-1, 3).std(0)
m2, s2 = src.reshape(-1, 3).mean(0), src.reshape(-1, 3).std(0)
P2l = lab(P2); P2l = (P2l - m2) / (s2 + 1e-6) * s1 + m1
P2 = cv2.cvtColor(P2l.clip(0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)

rest1 = P1[y0:]
J = min(round(SH * 0.55), rest1.shape[0], p2o)       # zona de fusão longa (limitada ao que existe)
r = np.linspace(0, 1, J, dtype=np.float32); w = (r * r * (3 - 2 * r))[:, None, None]
join = rest1[-J:] * (1 - w) + P2[p2o - J:p2o] * w if p2o >= J else rest1[-J:] * (1 - w) + P2[:J] * w
# mantém o final do quadro fundido como veio e emenda exatamente no y0
f32 = final.astype(np.float32)
G = np.vstack([f32, rest1[:-J], join, P2[p2o:]]).clip(0, 255).astype(np.uint8)
GW = min(SW, 1920)
G = cv2.resize(G, (GW, round(G.shape[0] * GW / SW)), interpolation=cv2.INTER_AREA)
cv2.imwrite(f'{OUT}/ground.webp', G, [cv2.IMWRITE_WEBP_QUALITY, 78])
mf = json.load(open(f'{OUT}/manifest.json'))
mf['ground'] = {'src': f'/frames/hero/{variant}/ground.webp', 'w': G.shape[1], 'h': G.shape[0], 'frame': {'x': 0, 'y': 0, 'w': 1, 'h': (SH * GW / SW) / G.shape[0]}}
json.dump(mf, open(f'{OUT}/manifest.json', 'w'))
print('ok', G.shape)
