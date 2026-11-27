"""Paints a cast that is not in the Character Gallery: a portrait and the three chibi views per character, the same
way as the gallery cast (tools/ai_art.py, tools/ai_chibi.py), from a game's own cast list.

    C:/sdenv/Scripts/python tools/ai_cast.py <cast.json> <out dir> [portrait|chibi|both] [ids]
        cast.json: { id: { name, tags, face, chibi } } - tags: who they are and what they wear (subject first; CLIP
                   reads 77 tokens); face: their face, with a leading '!' for someone who must not be painted pretty;
                   chibi: false for a portrait only (the minor people of a big roster)
        <out>/ai/<id>_portrait.png              the portrait painting (896 x 1152)
        <out>/cut/<id>_portrait.webp            cut like the gallery's (384 x 384, transparent)
        <out>/chibi/<id>_{front,side,back}.png  the chibi paintings (832 x 1216, flat green or pink; side looks left)

Work already on disk is skipped, so a run can be stopped and resumed.
"""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ai_art, ai_chibi
from ai_cut import portrait as cut_portrait
from PIL import Image


def prompts(c):
    tags, face = c['tags'], c.get('face', '')
    neg = ai_art.PLAIN_NEG if face.startswith('!') else ''
    face = face.lstrip('!')
    who = tags + (', ' + face if face else '')
    por = f'{who}, solo, upper body, looking at viewer, white background, {ai_art.QUALITY}'
    bg = 'pink' if any(w in tags for w in ('green', 'jade', 'bamboo', 'leaf', 'moss')) else 'green'
    views = {}
    for v, lead in ai_chibi.VIEWS.items():
        w = tags if v == 'back' else who
        n = 'shadow, ' + neg + ('looking at viewer, face, eyes, ' if v == 'back' else '')
        views[v] = (f'chibi, full body, {lead}, {bg} background, simple background, {w}, solo, masterpiece', n)
    return por, neg, views


def main():
    cast = json.load(open(sys.argv[1], encoding='utf-8'))
    out = sys.argv[2]
    what = sys.argv[3] if len(sys.argv) > 3 else 'both'
    if len(sys.argv) > 4:
        cast = {k: v for k, v in cast.items() if k in sys.argv[4].split(',')}
    for d in ('ai', 'cut', 'chibi'):
        os.makedirs(os.path.join(out, d), exist_ok=True)
    t0 = time.time()
    if what in ('portrait', 'both'):
        todo = [k for k in cast if not os.path.exists(os.path.join(out, 'ai', f'{k}_portrait.png'))]
        if todo:
            P = ai_art.pipe(False)
            for i, k in enumerate(todo):
                por, neg, _ = prompts(cast[k])
                img = ai_art.paint(P, por, 896, 1152, 11, False, neg)
                img.save(os.path.join(out, 'ai', f'{k}_portrait.png'))
                cut_portrait(img).save(os.path.join(out, 'cut', f'{k}_portrait.webp'), quality=88)
                print(f'portrait {i + 1}/{len(todo)} {k} {time.time() - t0:.0f}s', flush=True)
            del P
    if what in ('chibi', 'both'):
        todo = [(k, v) for k in cast if cast[k].get('chibi', True) for v in ai_chibi.VIEWS if not os.path.exists(os.path.join(out, 'chibi', f'{k}_{v}.png'))]
        if todo:
            P = ai_art.pipe(False)
            for i, (k, v) in enumerate(todo):
                pr, n = prompts(cast[k])[2][v]
                ai_art.paint(P, pr, 832, 1216, 11, False, n).save(os.path.join(out, 'chibi', f'{k}_{v}.png'))
                print(f'chibi {i + 1}/{len(todo)} {k} {v} {time.time() - t0:.0f}s', flush=True)


if __name__ == '__main__':
    main()
