"""Vetoriza o wordmark do Hefesto: PNG com alfa -> SVG de contornos suaves.

Marching squares sub-pixel no canal alfa (as bordas anti-aliased dao precisao),
Douglas-Peucker para enxugar, e cubicas de Catmull-Rom para suavizar mantendo
os cantos retos do 'h', do 'f' e do 't'.
"""
import math
import numpy as np
from PIL import Image

SRC = r"C:\Users\victo\Downloads\logo-hefesto.png"
LEVEL = 127.5
DP_TOL = 0.30          # px
CORNER_DEG = 38.0      # acima disso o ponto vira canto reto


# ── marching squares ────────────────────────────────────────────────────────
def _interp(level, a, b):
    if b == a:
        return 0.5
    return (level - a) / (b - a)


def segments(V, level):
    h, w = V.shape
    segs = []
    for y in range(h - 1):
        for x in range(w - 1):
            tl, tr = V[y, x], V[y, x + 1]
            bl, br = V[y + 1, x], V[y + 1, x + 1]
            idx = (8 if tl > level else 0) | (4 if tr > level else 0) \
                | (2 if br > level else 0) | (1 if bl > level else 0)
            if idx in (0, 15):
                continue
            top = (x + _interp(level, tl, tr), float(y))
            right = (float(x + 1), y + _interp(level, tr, br))
            bottom = (x + _interp(level, bl, br), float(y + 1))
            left = (float(x), y + _interp(level, tl, bl))
            avg = (tl + tr + bl + br) / 4.0

            if idx == 1:    pairs = [(left, bottom)]
            elif idx == 2:  pairs = [(bottom, right)]
            elif idx == 3:  pairs = [(left, right)]
            elif idx == 4:  pairs = [(right, top)]
            elif idx == 5:  pairs = [(left, bottom), (right, top)] if avg > level \
                                 else [(left, top), (right, bottom)]
            elif idx == 6:  pairs = [(bottom, top)]
            elif idx == 7:  pairs = [(left, top)]
            elif idx == 8:  pairs = [(top, left)]
            elif idx == 9:  pairs = [(top, bottom)]
            elif idx == 10: pairs = [(top, right), (bottom, left)] if avg > level \
                                 else [(top, left), (bottom, right)]
            elif idx == 11: pairs = [(top, right)]
            elif idx == 12: pairs = [(right, left)]
            elif idx == 13: pairs = [(right, bottom)]
            else:           pairs = [(bottom, left)]
            segs.extend(pairs)
    return segs


def key(p):
    return (round(p[0], 5), round(p[1], 5))


def loops(segs):
    """Encadeia os segmentos em contornos fechados, consumindo cada um uma vez."""
    adj = {}
    for a, b in segs:
        adj.setdefault(key(a), []).append(key(b))
    out = []
    while adj:
        k0 = next(iter(adj))
        chain = [k0]
        cur = k0
        while True:
            nxts = adj.get(cur)
            if not nxts:
                break
            nxt = nxts.pop()
            if not nxts:
                del adj[cur]
            if nxt == k0:
                break
            chain.append(nxt)
            cur = nxt
        if len(chain) > 3:
            out.append([(p[0], p[1]) for p in chain])
    return out


# ── Douglas-Peucker ─────────────────────────────────────────────────────────
def dp(pts, tol):
    if len(pts) < 3:
        return pts
    ax, ay = pts[0]
    bx, by = pts[-1]
    dx, dy = bx - ax, by - ay
    n = math.hypot(dx, dy)
    worst, wi = -1.0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dx * (ay - py) - (ax - px) * dy) / n if n else math.hypot(px - ax, py - ay)
        if d > worst:
            worst, wi = d, i
    if worst > tol:
        return dp(pts[:wi + 1], tol)[:-1] + dp(pts[wi:], tol)
    return [pts[0], pts[-1]]


def dp_closed(pts, tol):
    if len(pts) < 8:
        return pts
    half = len(pts) // 2
    a = dp(pts[:half + 1], tol)
    b = dp(pts[half:] + [pts[0]], tol)
    return a[:-1] + b[:-1]


# ── suavizacao ──────────────────────────────────────────────────────────────
def tangents(pts, corner_deg):
    n = len(pts)
    tg = []
    lim = math.cos(math.radians(180 - corner_deg))
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        v1 = (p1[0] - p0[0], p1[1] - p0[1])
        v2 = (p2[0] - p1[0], p2[1] - p1[1])
        n1, n2 = math.hypot(*v1), math.hypot(*v2)
        if n1 < 1e-9 or n2 < 1e-9:
            tg.append((0.0, 0.0))
            continue
        cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)
        if cos < lim:                      # virada brusca -> canto reto
            tg.append((0.0, 0.0))
        else:
            tg.append(((p2[0] - p0[0]) * 0.5, (p2[1] - p0[1]) * 0.5))
    return tg


def path_d(pts, ox, oy, prec=1):
    n = len(pts)
    tg = tangents(pts, CORNER_DEG)
    f = lambda v: f"{round(v, prec):g}"
    d = [f"M{f(pts[0][0]-ox)} {f(pts[0][1]-oy)}"]
    for i in range(n):
        p1, p2 = pts[i], pts[(i + 1) % n]
        t1, t2 = tg[i], tg[(i + 1) % n]
        if t1 == (0.0, 0.0) and t2 == (0.0, 0.0):
            d.append(f"L{f(p2[0]-ox)} {f(p2[1]-oy)}")
        else:
            c1 = (p1[0] + t1[0] / 3, p1[1] + t1[1] / 3)
            c2 = (p2[0] - t2[0] / 3, p2[1] - t2[1] / 3)
            d.append(f"C{f(c1[0]-ox)} {f(c1[1]-oy)} {f(c2[0]-ox)} {f(c2[1]-oy)} "
                     f"{f(p2[0]-ox)} {f(p2[1]-oy)}")
    d.append("Z")
    return "".join(d)


def main():
    alpha = np.array(Image.open(SRC).convert("RGBA"))[..., 3].astype(np.float64)
    alpha = np.pad(alpha, 1, constant_values=0.0)

    segs = segments(alpha, LEVEL)
    ls = [l for l in loops(segs) if len(l) > 12]
    print(f"{len(segs)} segmentos -> {len(ls)} contornos")

    simplified = []
    for l in ls:
        s = dp_closed(l, DP_TOL)
        if len(s) >= 4:
            simplified.append(s)
    print("pontos:", sum(len(s) for s in simplified))

    allpts = [p for s in simplified for p in s]
    xs = [p[0] for p in allpts]
    ys = [p[1] for p in allpts]
    ox, oy = min(xs), min(ys)
    w, h = max(xs) - ox, max(ys) - oy
    print(f"viewBox 0 0 {w:.2f} {h:.2f}")

    d = "".join(path_d(s, ox, oy) for s in simplified)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {round(w,2):g} {round(h,2):g}" '
        f'role="img" aria-label="Hefesto">'
        f'<title>Hefesto</title>'
        f'<path fill="currentColor" fill-rule="evenodd" d="{d}"/>'
        f'</svg>'
    )
    out = r"C:\Users\victo\Desktop\pessoal\hefesto-landing-page\public\assets\hefesto-wordmark.svg"
    import os
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print("svg:", len(svg), "bytes ->", out)


main()
