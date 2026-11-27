"""Paints the detailed map sprites: each character as a chibi illustration (Animagine XL 4.0, no pixel LoRA), once
from the front, once from the side and once from behind, on a flat colour that is easy to cut away, then cuts them
down to sprite size.

    C:/sdenv/Scripts/python tools/ai_chibi.py [ids|all] [paint|cut|both] [seed]
        art/chibi/<id>_<view>.png    the paintings (832 x 1216)
        art/cut/<id>_c<view>.png     the sprites, at most 78 x 88, soft edges; side views all face right

Work already on disk is skipped, so the run can be stopped and resumed.
"""
import os, sys, time
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ai_tags import TAGS, FACES
import ai_cut as C

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'art', 'chibi')
OUT = os.path.join(ROOT, 'art', 'cut')
VIEWS = {'front': 'front view, standing', 'side': 'from side, profile, walking', 'back': 'from behind, facing away, standing'}
H, MAXW = 88, 78


def prompt(cid, view):
    """The view and the background come first: CLIP drops whatever follows the 77th token."""
    tags, face = TAGS[cid], FACES.get(cid, '')
    bg = 'pink' if any(w in tags for w in ('green', 'jade', 'bamboo', 'leaf', 'moss')) else 'green'
    neg = 'shadow, ' + ('bishounen, beautiful, ' if face.startswith('!') else '')
    face = face.lstrip('!')
    if view == 'back':
        face = ''
        neg += 'looking at viewer, face, eyes, '
    if tags.startswith('no humans'):
        side = {'front': 'front view', 'side': 'side view', 'back': 'from behind'}[view]
        return f'full body, {side}, {bg} background, simple background, {tags}, solo, masterpiece', neg
    who = tags + (', ' + face if face else '')
    return f'chibi, full body, {VIEWS[view]}, {bg} background, simple background, {who}, solo, masterpiece', neg


def cut(img):
    """The figure off its flat background, shrunk to sprite size with soft edges."""
    img = img.convert('RGB')
    a = np.asarray(img.resize((img.width // 4, img.height // 4), Image.BOX)).astype(np.int16)
    bg = C.flood_bg(a, 40)
    found, label = C.figures(~bg)
    if not found:
        return None
    m = label == max(found, key=lambda f: (label == f[2]).sum())[2]   # the biggest piece: no specks or props
    ref = np.median(np.array([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]]), axis=0)
    # background showing between the legs or under an arm
    near = (np.abs(a - ref).sum(axis=2) <= 30) & m
    hf, hl = C.figures(near)
    for _, _, k in hf:
        if (hl == k).sum() >= 12:
            m &= hl != k
    # a pixel off the edge, where the background bleeds into the outline
    m = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
    mask = Image.fromarray((m * 255).astype(np.uint8)).resize(img.size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(1.5))
    box = mask.point(lambda v: 255 if v > 128 else 0).getbbox()
    col, mask = img.crop(box), mask.crop(box)
    s = min(H / col.height, MAXW / col.width)
    w, h = max(1, round(col.width * s)), max(1, round(col.height * s))
    out = col.resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1, 60, 2)).convert('RGBA')
    out.putalpha(mask.resize((w, h), Image.LANCZOS))
    return out


def main():
    sel = sys.argv[1] if len(sys.argv) > 1 else 'all'
    what = sys.argv[2] if len(sys.argv) > 2 else 'both'
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 11
    import ai_art
    cs = [c['id'] for c in ai_art.characters()]
    if sel != 'all':
        cs = [c for c in cs if c in sel.split(',')]
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    if what in ('paint', 'both'):
        todo = [(c, v) for c in cs for v in VIEWS if not os.path.exists(os.path.join(RAW, f'{c}_{v}.png'))]
        if todo:
            P, t0 = ai_art.pipe(False), time.time()
            for i, (c, v) in enumerate(todo):
                pr, neg = prompt(c, v)
                ai_art.paint(P, pr, 832, 1216, seed, False, neg).save(os.path.join(RAW, f'{c}_{v}.png'))
                print(f'chibi {i + 1}/{len(todo)} {c} {v} {time.time() - t0:.0f}s', flush=True)
                if what == 'both' and v == 'back':
                    cut_one(c)
    if what in ('cut', 'both'):
        for c in cs:
            cut_one(c)


def faces_left(im):
    """Which way a side view looks. In a chibi's profile the hair at the back of the head outweighs the face, so the
    head's skin (or, with no skin showing, its whole mass) sits towards the back."""
    a = np.asarray(im.convert('RGBA')).astype(int)
    solid = a[:, :, 3] > 128
    ys = np.where(solid.any(axis=1))[0]
    top = solid.copy()
    top[int(ys[0] + (ys[-1] - ys[0]) * 0.42):] = False
    xs = np.where(top)[1]
    mid = (xs.min() + xs.max()) / 2
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    skin = top & (R > 170) & (R > G + 8) & (G > B + 4) & (R - B > 35)
    x = np.where(skin)[1].mean() if skin.sum() > 40 else xs.mean()
    return x >= mid


def cut_one(c):
    for v in VIEWS:
        src = os.path.join(RAW, f'{c}_{v}.png')
        if os.path.exists(src):
            try:
                im = cut(Image.open(src))
            except OSError:   # cut off while being written: paint it again
                os.remove(src)
                continue
            if im and v == 'side' and faces_left(im):   # every side view faces right
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
            if im:
                im.save(os.path.join(OUT, f'{c}_c{v}.png'))


if __name__ == '__main__':
    main()
