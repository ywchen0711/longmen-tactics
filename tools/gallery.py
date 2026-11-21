"""Character art for 龍門戰記 Longmen Tactics, taken from the Character Gallery (C:\\CharacterGallery).

    python -P tools/gallery.py            (from C:\\LongmenTactics)

Reads chars/index.json and copies, for every Longmen person, every sect troop (people only, not carts or ships),
every common foe and every big beast, the `nes` portrait and the whole `nes` field sheet into one atlas,
assets/art.png (1x pixels, 1px gaps). Writes js/art.js:

  ART[id] = { k: 'p' | 'm', p: [x, y, w, h], s: [x, y], fw, fh, rows: { idle, walk, side, up, move } , n: [zh, en] }

p is the portrait, s the top-left of the sheet; a frame is (s.x + frame * fw, s.y + row * fh, fw, fh).
"""
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY = r'C:\CharacterGallery'
SKIP = {'sx_rider', 'sx_ironcav', 'sx_caravan', 'sx_ram', 'sx_catapult', 'sx_thunder', 'sx_boat', 'sx_warship', 'sx_qj_escort'}


def main():
    idx = json.load(open(os.path.join(GALLERY, 'chars', 'index.json'), encoding='utf-8'))
    items = []
    for c in idx['characters']:
        fac = c.get('faction')
        if fac not in ('longmen', 'sects', 'foe', 'beast') or c['id'] in SKIP:
            continue
        v = next((v for v in c['variants'] if v['style'] == 'nes'), None)
        if not v:
            continue
        f = v['files']
        por = Image.open(os.path.join(GALLERY, f['portrait'])).convert('RGBA')
        sheet = Image.open(os.path.join(GALLERY, f['sheet'])).convert('RGBA')
        meta = json.load(open(os.path.join(GALLERY, f['sheetJson']), encoding='utf-8'))
        rows = {k: a['row'] for k, a in meta['animations'].items()}
        rows = {('side' if k == 'walk_side' else 'up' if k == 'walk_up' else k): r for k, r in rows.items()}
        items.append((c['id'], 'm' if c['kind'] == 'monster' else 'p', por, sheet, meta['frameWidth'], meta['frameHeight'], rows,
                      [c['name']['zh'], c['name']['en']], c.get('tier', 0), fac))
    W = 1024
    x = y = rowh = 0
    place = []
    for it in items:
        for k, im in ((0, it[2]), (1, it[3])):
            if x + im.width > W:
                x, y, rowh = 0, y + rowh + 1, 0
            place.append((it[0], k, x, y, im))
            x += im.width + 1
            rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
    rects = {}
    for cid, k, px, py, im in place:
        atlas.alpha_composite(im, (px, py))
        rects.setdefault(cid, {})['p' if k == 0 else 's'] = [px, py, im.width, im.height] if k == 0 else [px, py]
    os.makedirs(os.path.join(ROOT, 'assets'), exist_ok=True)
    atlas.save(os.path.join(ROOT, 'assets', 'art.png'), optimize=True)
    art = {}
    for cid, kind, por, sheet, fw, fh, rows, name, tier, fac in items:
        art[cid] = {'k': kind, **rects[cid], 'fw': fw, 'fh': fh, 'rows': rows, 'n': name, 't': tier, 'f': fac}
    with open(os.path.join(ROOT, 'js', 'art.js'), 'w', encoding='utf-8', newline='\n') as fp:
        fp.write('// Made by tools/gallery.py from the Character Gallery: rects into assets/art.png. Do not edit by hand.\n')
        fp.write('export const ART = ' + json.dumps(art, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(len(items), 'characters, atlas', atlas.size)


if __name__ == '__main__':
    main()
