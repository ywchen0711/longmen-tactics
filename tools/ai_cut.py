"""Cuts the painted art in art/ai into game-ready pieces.

    C:/sdenv/Scripts/python tools/ai_cut.py [ids|all]
        art/ai/<id>_portrait.png -> art/cut/<id>_portrait.webp   (background removed, 384x384)
        art/ai/<id>_sheet.png    -> art/cut/<id>_front.png, _side.png, _back.png   (64x88 pixel sprites)

A sheet holds the character in three views; the three tallest figures are taken left to right as front,
side and back. When fewer are found, the missing views repeat the front.
"""
import os, sys
from collections import deque
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'ai')
OUT = os.path.join(ROOT, 'art', 'cut')
SW, SH = 64, 88


def flood_bg(a, tol):
    """Background mask: pixels near the corner colour that connect to the border."""
    h, w, _ = a.shape
    ref = np.median(np.array([a[0, 0], a[0, w - 1], a[h - 1, 0], a[h - 1, w - 1]]), axis=0)
    near = np.abs(a - ref).sum(axis=2) <= tol
    bg = np.zeros((h, w), bool)
    q = deque([(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)])
    while q:
        y, x = q.popleft()
        if bg[y, x] or not near[y, x]:
            continue
        bg[y, x] = True
        if y > 0: q.append((y - 1, x))
        if y < h - 1: q.append((y + 1, x))
        if x > 0: q.append((y, x - 1))
        if x < w - 1: q.append((y, x + 1))
    return bg


def portrait(img):
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    bg = flood_bg(a, 22)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    edge = ~bg & (np.roll(bg, 1, 0) | np.roll(bg, -1, 0) | np.roll(bg, 1, 1) | np.roll(bg, -1, 1))
    dist = 765 - a.sum(axis=2)
    alpha[edge] = np.clip(dist[edge] / 120 * 255, 60, 255).astype(np.uint8)
    im = Image.fromarray(np.dstack([a.astype(np.uint8), alpha]), 'RGBA')
    # tall paintings leave room above the head; keep the top square (a little headroom included)
    if im.height > im.width:
        top = min(im.height - im.width, int(im.height * 0.02))
        im = im.crop((0, top, im.width, top + im.width))
    return im.resize((384, 384), Image.LANCZOS)


def blocks(img, n=8):
    """One pixel per n x n block (the Pixel Art XL grid), taking the block's most common colour."""
    a = np.asarray(img.convert('RGB'))
    h, w = a.shape[0] // n, a.shape[1] // n
    out = np.zeros((h, w, 3), np.uint8)
    for y in range(h):
        for x in range(w):
            b = a[y * n:(y + 1) * n, x * n:(x + 1) * n].reshape(-1, 3)
            keys = (b[:, 0] // 8).astype(np.int32) * 1024 + (b[:, 1] // 8) * 32 + b[:, 2] // 8
            vals, counts = np.unique(keys, return_counts=True)
            out[y, x] = b[keys == vals[counts.argmax()]].mean(axis=0)
    return out


def figures(mask):
    h, w = mask.shape
    label = np.zeros((h, w), np.int32)
    found, n = [], 0
    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0, x0] or label[y0, x0]:
                continue
            n += 1
            label[y0, x0] = n
            q, ys, xs = deque([(y0, x0)]), [], []
            while q:
                y, x = q.popleft()
                ys.append(y)
                xs.append(x)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not label[yy, xx]:
                        label[yy, xx] = n
                        q.append((yy, xx))
            if len(ys) > 40:
                found.append((max(ys) + 1 - min(ys), (min(xs), min(ys), max(xs) + 1, max(ys) + 1), n))
    return found, label


def despeckle(a):
    """A lone pixel whose four neighbours (three at least of one colour) all differ from it takes their colour:
    painted noise that reads as dirt at sprite size."""
    out = a.copy()
    sol = a[:, :, 3] > 0
    h, w = sol.shape
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            nb = [(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)]
            if not sol[y, x] or not all(sol[p] for p in nb):
                continue
            cols = [tuple(a[p][:3]) for p in nb]
            if tuple(a[y, x, :3]) not in cols:
                best = max(set(cols), key=cols.count)
                if cols.count(best) >= 3:
                    out[y, x, :3] = best
    return out


def fit(im):
    """Reduce the palette to 16 colours, clear lone noisy pixels, add a dark outline, stand it on the bottom row."""
    im = im.crop(im.getchannel('A').getbbox())
    alpha = im.getchannel('A')
    rgb = im.convert('RGB').quantize(colors=16, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGBA')
    rgb.putalpha(alpha)
    rgb = Image.fromarray(despeckle(despeckle(np.asarray(rgb))), 'RGBA')
    out = Image.new('RGBA', (SW, SH), (0, 0, 0, 0))
    out.alpha_composite(rgb, ((SW - rgb.width) // 2, SH - 1 - rgb.height))
    o = np.asarray(out).copy()
    solid = o[:, :, 3] > 0
    ring = ~solid & (np.roll(solid, 1, 0) | np.roll(solid, -1, 0) | np.roll(solid, 1, 1) | np.roll(solid, -1, 1))
    o[ring] = [34, 24, 36, 255]
    return Image.fromarray(o, 'RGBA')


def half(rgb, mask):
    """Halve a figure on its own pixel grid: each new pixel takes the colour most of its four share, and on a tie
    the darkest, so outlines and eyes survive. Blending or resizing by fractions turns pixel art to mush."""
    h, w = mask.shape[0] // 2, mask.shape[1] // 2
    out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        for x in range(w):
            m = mask[2 * y:2 * y + 2, 2 * x:2 * x + 2].reshape(-1)
            if m.sum() < 2:
                continue
            c = rgb[2 * y:2 * y + 2, 2 * x:2 * x + 2].reshape(-1, 3)[m].astype(int)
            keys = [tuple(v // 16) for v in c]
            i = max(range(len(c)), key=lambda i: (keys.count(keys[i]), -c[i].sum()))
            out[y, x, :3], out[y, x, 3] = c[i], 255
    return out


def strip_lines(mask):
    """Drop thin horizontal strokes (the ground lines and rules many sheets draw), which would otherwise join a
    whole row of figures into one."""
    h, _ = mask.shape
    run = np.zeros(mask.shape, np.int32)
    for y in range(h):
        run[y] = np.where(mask[y], (run[y - 1] if y else 0) + 1, 0)
    for y in range(h - 2, -1, -1):
        run[y] = np.where(mask[y] & mask[y + 1], run[y + 1], run[y])
    return mask & (run > 2)


def sheet(img):
    rgb = blocks(img).astype(np.int16)
    bg = flood_bg(rgb, 38)
    found, label = figures(strip_lines(~bg))
    # Figures only: not swords or bows standing alone, not colour swatches or banners spanning the sheet.
    found = [f for f in found if 0.25 <= (f[1][2] - f[1][0]) / f[0] <= 2.5 and f[0] >= 12]
    found.sort(key=lambda f: f[0], reverse=True)
    if not found:
        return None
    # The tallest figure picks the row; the views are its neighbours of similar height, left to right.
    tall, (_, ty0, _, ty1), _ = found[0]
    row = [f for f in found if ty0 <= (f[1][1] + f[1][3]) / 2 <= ty1 and f[0] >= tall * 0.7]
    # Two views touching each other come out as one blob twice as wide as the rest; leave those out.
    mid = float(np.median([f[1][2] - f[1][0] for f in row]))
    narrow = [f for f in row if f[1][2] - f[1][0] <= mid * 1.6]
    if len(narrow) >= 2:
        row = narrow
    row = sorted(row, key=lambda f: f[1][0])[:3]
    # The painting's own pixel grid (8 screen pixels to a block) is kept: a figure too big for the sprite is
    # halved, one painted very small is doubled, all views alike.
    tall, wide = max(f[0] for f in row), max(f[1][2] - f[1][0] for f in row)
    shrink = tall > SH - 16 or wide > SW - 2
    grow = not shrink and tall < 30 and wide < SW // 2
    rgb = rgb.astype(np.uint8)
    views = []
    for _, (x0, y0, x1, y1), n in row:
        m = label[y0:y1, x0:x1] == n
        if shrink:
            a = half(rgb[y0:y1, x0:x1], m)
        else:
            a = np.dstack([rgb[y0:y1, x0:x1], np.where(m, 255, 0).astype(np.uint8)])
            if grow:
                a = a.repeat(2, 0).repeat(2, 1)
        views.append(fit(Image.fromarray(a, 'RGBA')))
    if len(views) == 2:  # front and back
        views.insert(1, views[0])
    while len(views) < 3:
        views.append(views[0])
    return views


def main():
    sel = sys.argv[1] if len(sys.argv) > 1 else 'all'
    os.makedirs(OUT, exist_ok=True)
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.png'):
            continue
        cid, kind = f[:-4].rsplit('_', 1)
        if sel != 'all' and cid not in sel.split(','):
            continue
        img = Image.open(os.path.join(SRC, f))
        if kind == 'portrait':
            portrait(img).save(os.path.join(OUT, f'{cid}_portrait.webp'), quality=88)
        elif kind == 'sheet':
            views = sheet(img)
            if views:
                for name, v in zip(('front', 'side', 'back'), views):
                    v.save(os.path.join(OUT, f'{cid}_{name}.png'))
        print(f, flush=True)


if __name__ == '__main__':
    main()
