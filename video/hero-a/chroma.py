"""Funções de chroma (magenta #FF00FF) e composição de telas, compartilhadas pelos pipelines de vídeo.
Extraídas de build_v2.py (Hero)."""
import cv2
import numpy as np


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
