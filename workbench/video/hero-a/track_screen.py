"""Rastreia telas em magenta chroma (#FF00FF) e compõe uma imagem por cima com homografia.

Para cada quadro: máscara chroma -> contornos -> quadrilátero (4 cantos) -> suavização temporal ->
warp da imagem da tela -> composição com borda suave e despill do magenta.

Uso como módulo:
    from track_screen import load_frames, detect_quads, smooth, composite
"""
import glob
import json
import os

import cv2
import numpy as np

MIN_AREA_FRAC = 0.0006  # área mínima do quad em fração do quadro (ignora ruído)


def chroma_mask(bgr):
    """Magenta liso: R e B altos, G baixo (tolerante a compressão do vídeo)."""
    b, g, r = [bgr[..., i].astype(np.int16) for i in range(3)]
    m = (r > 150) & (b > 150) & (g < 110) & (np.minimum(r, b) - g > 70)
    m = m.astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    return m


def order_quad(pts):
    """TL, TR, BR, BL."""
    pts = np.array(pts, dtype=np.float32).reshape(-1, 2)
    s = pts.sum(1); d = (pts[:, 0] - pts[:, 1])
    return np.array([pts[np.argmin(s)], pts[np.argmax(d)], pts[np.argmax(s)], pts[np.argmin(d)]], dtype=np.float32)


def find_quads(bgr):
    """Todos os quadriláteros magenta do quadro, ordenados por área (maior primeiro)."""
    m = chroma_mask(bgr)
    h, w = m.shape
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = []
    for c in cnts:
        a = cv2.contourArea(c)
        if a < MIN_AREA_FRAC * w * h:
            continue
        hull = cv2.convexHull(c)
        peri = cv2.arcLength(hull, True)
        quad = None
        for eps in (0.01, 0.02, 0.03, 0.05, 0.08):
            ap = cv2.approxPolyDP(hull, eps * peri, True)
            if len(ap) == 4:
                quad = ap; break
        if quad is None:
            quad = cv2.boxPoints(cv2.minAreaRect(hull))
        out.append((a, order_quad(quad)))
    out.sort(key=lambda t: -t[0])
    return [q for _, q in out]


def load_frames(pattern):
    return sorted(glob.glob(pattern))


def detect_quads(files, slot_count=1):
    """Por quadro, devolve até `slot_count` quads (ordenados por área). None quando não há."""
    res = []
    for f in files:
        img = cv2.imread(f)
        qs = find_quads(img)[:slot_count]
        res.append(qs)
    return res


def smooth(track, alpha=0.6, max_gap=6):
    """Suavização exponencial dos cantos; preenche lacunas curtas. track: lista de quad|None."""
    out = []; prev = None; gap = 0
    for q in track:
        if q is None:
            gap += 1
            out.append(prev if (prev is not None and gap <= max_gap) else None)
            if gap > max_gap:
                prev = None
            continue
        gap = 0
        prev = q if prev is None else alpha * q + (1 - alpha) * prev
        out.append(prev.copy())
    return out


def _reflection(h, w, strength=0.07):
    yy, xx = np.mgrid[0:h, 0:w]
    g = np.clip(1 - (xx / w + (1 - yy / h)) / 1.1, 0, 1) * strength
    return g[..., None].astype(np.float32)


def composite(bgr, quad, screen_bgr, alpha=1.0, feather=1.2):
    """Cola `screen_bgr` dentro de `quad` (4x2) sobre `bgr`. Retorna novo quadro."""
    if quad is None or alpha <= 0:
        return bgr
    h, w = bgr.shape[:2]
    sh, sw = screen_bgr.shape[:2]
    src = np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]])
    H = cv2.getPerspectiveTransform(src, quad.astype(np.float32))
    scr = screen_bgr.astype(np.float32)
    scr = scr * (1 - _reflection(sh, sw)) + 255 * _reflection(sh, sw)
    warped = cv2.warpPerspective(scr, H, (w, h), flags=cv2.INTER_AREA if sw > 2 * w else cv2.INTER_LINEAR)
    mask = np.zeros((h, w), np.float32)
    cv2.fillConvexPoly(mask, np.round(quad).astype(np.int32), 1.0, lineType=cv2.LINE_AA)
    # expande 1 px para cobrir o halo magenta e suaviza a borda
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
    mask = cv2.GaussianBlur(mask, (0, 0), feather) * alpha
    out = bgr.astype(np.float32) * (1 - mask[..., None]) + warped * mask[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


def despill(bgr, quad_mask=None):
    """Remove magenta residual perto das bordas (reduz R/B quando excedem G)."""
    f = bgr.astype(np.float32)
    g = f[..., 1]
    excess = np.minimum(f[..., 0], f[..., 2]) - g
    spill = np.clip(excess - 20, 0, None) * 0.5
    f[..., 0] -= spill; f[..., 2] -= spill
    return np.clip(f, 0, 255).astype(np.uint8)


def quad_rect(quad, w, h):
    """Retângulo envolvente normalizado (0-1) para posicionar um <video> via CSS."""
    x0, y0 = quad.min(0); x1, y1 = quad.max(0)
    return {'x': float(x0 / w), 'y': float(y0 / h), 'w': float((x1 - x0) / w), 'h': float((y1 - y0) / h)}


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
