"""Remove os ícones de ajuda "?" que o build web do app Administração desenha enormes sobre os rótulos
(o desenho prevê um glifo discreto de 16 px) e reconstrói os rótulos que eles cobriam, com a própria
fonte do app (Outfit SemiBold, 43 px a 3x). Não altera nenhum número nem texto da tela.
Uso: python retouch_adm_confinamento.py"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np, os
F = "C:/Users/Arthur/Desktop/cerne-app-administracao/apps/mobile/assets/fonts/Outfit-SemiBold.ttf"
SRC = os.path.join(os.path.dirname(__file__), "../assets/capture/app/adm-confinamento-vg.png")
OUT = os.path.join(os.path.dirname(__file__), "../assets/capture/app/adm-confinamento-vg-limpo.png")
im = Image.open(SRC).convert("RGB"); A = np.array(im).astype(int); font = ImageFont.truetype(F, 43)
R, G, B = A[..., 0], A[..., 1], A[..., 2]
ring = ((B - R) >= 2) & (R < 249) & (np.abs(R - G) < 24)                       # traço cinza-azulado do ícone
boxes = {"custo": (895, 900, 1060, 1050), "gmd": (270, 1230, 420, 1375), "ocor": (975, 1255, 1135, 1410), "ocup": (555, 1580, 705, 1730)}
mask = np.zeros(A.shape[:2], bool)
for x0, y0, x1, y1 in boxes.values(): mask[y0:y1, x0:x1] = True
mask &= ring
import cv2
mask = cv2.dilate(mask.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
out = cv2.inpaint(A.astype(np.uint8), mask.astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA).astype(int)   # fundo liso: preenche o traço e respeita a borda do cartão

gx0, gy0, gx1, gy1 = boxes["gmd"]; gm = mask.copy(); gm[:] = False; gm[gy0:gy1, gx0:gx1] = mask[gy0:gy1, gx0:gx1]
out[gm] = 255
# valor "1.49 kg/dia" (Outfit SemiBold 54 px, laranja do app): a barra do "/" estava coberta pelo anel
fv = ImageFont.truetype(F, 54); out[1348:1412, 140:425] = 255
cv = Image.new("L", (1170, 2532), 0); ImageDraw.Draw(cv).text((143, 1395), "1.49 kg/dia", font=fv, fill=255, anchor="ls")
av = np.array(cv).astype(float) / 255.0
for c, v in enumerate((180, 83, 9)): out[..., c] = (out[..., c] * (1 - av) + v * av).astype(int)

def fit(text, ref_box, left, mask_w=None):
    """Acha a linha de base que casa com um rótulo limpo e devolve (x_origem, baseline)."""
    x0, y0, x1, y1 = ref_box; ref = (A[y0:y1, x0:x1].max(axis=2) < 120)
    if mask_w: ref[:, int(mask_w * (x1 - x0)):] = False
    best = (-1, None)
    for base in range(y0 + 20, y0 + 50):
        for dx in range(-4, 5):
            cv = Image.new("L", (x1 - x0, y1 - y0), 255); d = ImageDraw.Draw(cv)
            d.text((left + dx - x0, base - y0), text, font=font, fill=0, anchor="ls")
            a = np.array(cv) < 120
            if mask_w: a[:, int(mask_w * (x1 - x0)):] = False
            s = (a & ref).sum() / max((a | ref).sum(), 1)
            if s > best[0]: best = (s, (left + dx, base))
    return best

def draw_label(text, origin, erase_box):
    x0, y0, x1, y1 = erase_box; out[y0:y1, x0:x1] = 255
    cv = Image.new("L", (1170, 2532), 0); d = ImageDraw.Draw(cv); d.text(origin, text, font=font, fill=255, anchor="ls")
    a = np.array(cv).astype(float) / 255.0
    for c in range(3): out[..., c] = (out[..., c] * (1 - a) + 20 * a).astype(int)

# linha 1 (Cabeças / Custo): referência limpa = "Cabeças confinadas"
s1, (x1o, base1) = fit("Cabeças confinadas", (80, 950, 490, 1010), 86); print("ajuste linha 1", round(s1, 3), base1)
# linha 2 (GMD / Ocorrências): referência limpa = "Ocorrências"
s2, (x2o, base2) = fit("Ocorrências", (630, 1270, 890, 1340), 638); print("ajuste linha 2", round(s2, 3), base2)
dx2 = x2o - 638
# título do gráfico: referência = parte limpa de "Ocupação e desempenho"
s3, (x3o, base3) = fit("Ocupação e desempenho", (100, 1625, 570, 1700), 110, mask_w=0.78); print("ajuste título", round(s3, 3), base3)
draw_label("Custo médio/kg", (638 + (x1o - 86), base1), (630, 950, 935, 1008))
draw_label("GMD médio", (86 + dx2, base2), (80, 1275, 330, 1330))
draw_label("Ocupação e desempenho", (x3o, base3), (100, 1630, 640, 1690))
for bx0, by0, bx1, by1 in boxes.values():                                         # restos quase invisíveis do traço (AA): puxa para o branco do cartão
    sub = out[max(by0, 905):by1, bx0:min(bx1, 1114)]
    near = (sub.min(axis=2) >= 238) & (sub.min(axis=2) < 255) & ((sub.max(axis=2) - sub.min(axis=2)) <= 8)
    sub[near] = 255
out[1245:1425, 1114:] = 239                                                      # margem cinza ao lado do cartão (o anel passava por ela)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT); print("ok", OUT)
