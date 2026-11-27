"""Packs the cut AI art (art/cut, from tools/ai_cut.py) into the game: two atlases and their index.

    C:/sdenv/Scripts/python tools/ai_pack.py
        assets/ai/portraits.webp   128 x 128 busts, 13 to a row
        assets/ai/sprites.png      64 x 88 sprites, one character per row of front, side, back
        js/ai_art.js               { id: { p: [x, y], s: [x, y] } }  (p or s missing when there is none)

Sprites listed in tools/ai_bad.txt (a cut that failed, waiting for a redraw) are left out; those characters keep
their Character Gallery sprites.
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = os.path.join(ROOT, 'art', 'cut')
OUT = os.path.join(ROOT, 'assets', 'ai')
P, SW, SH, PCOLS, SCOLS = 128, 64, 88, 13, 6


def main():
    bad = set(open(os.path.join(ROOT, 'tools', 'ai_bad.txt'), encoding='utf-8').read().split())
    files = os.listdir(CUT)
    por = sorted(f[:-len('_portrait.webp')] for f in files if f.endswith('_portrait.webp'))
    spr = sorted({f[:-len('_front.png')] for f in files if f.endswith('_front.png')} - bad)
    idx = {}
    sheet = Image.new('RGBA', (P * PCOLS, P * ((len(por) + PCOLS - 1) // PCOLS)))
    for i, k in enumerate(por):
        x, y = (i % PCOLS) * P, (i // PCOLS) * P
        sheet.alpha_composite(Image.open(os.path.join(CUT, k + '_portrait.webp')).convert('RGBA').resize((P, P), Image.LANCZOS), (x, y))
        idx.setdefault(k, {})['p'] = [x, y]
    os.makedirs(OUT, exist_ok=True)
    sheet.save(os.path.join(OUT, 'portraits.webp'), quality=86, method=6)
    atlas = Image.new('RGBA', (SW * 3 * SCOLS, SH * ((len(spr) + SCOLS - 1) // SCOLS)))
    for i, k in enumerate(spr):
        x, y = (i % SCOLS) * SW * 3, (i // SCOLS) * SH
        for j, v in enumerate(('front', 'side', 'back')):
            atlas.alpha_composite(Image.open(os.path.join(CUT, f'{k}_{v}.png')).convert('RGBA'), (x + j * SW, y))
        idx.setdefault(k, {})['s'] = [x, y]
    atlas.save(os.path.join(OUT, 'sprites.png'), optimize=True)
    with open(os.path.join(ROOT, 'js', 'ai_art.js'), 'w', encoding='utf-8') as f:
        f.write('// Made by tools/ai_pack.py from the AI-painted art: rects into assets/ai/. Do not edit by hand.\n')
        f.write(f'export const AI = {json.dumps(idx, separators=(",", ":"))};\n')
    print(len(por), 'portraits,', len(spr), 'sprites')


if __name__ == '__main__':
    main()
