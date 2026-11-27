"""Paints portraits and pixel-art map sprites for every Longmen Tactics character with open models on this
machine's GPU: SDXL with Animagine XL 4.0, plus the Pixel Art XL LoRA for the sprites. The prompts come from each
character's appearance tags in tools/ai_tags.py, written from the Character Gallery bios.

    C:/sdenv/Scripts/python tools/ai_art.py [ids|all] [what] [seed]
        what: portrait | sheet | both (default)        -> art/ai/<id>_portrait.png, art/ai/<id>_sheet.png
    Portraits are all painted first, then the LoRA is fused in for the sprite sheets.

Work already on disk is skipped, so the run can be stopped and resumed.
"""
import json, os, re, sys, time, torch
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ai_tags import TAGS, FACES
from diffusers import StableDiffusionXLPipeline, AutoencoderKL, EulerAncestralDiscreteScheduler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY = 'C:/CharacterGallery'
MODELS = 'C:/sdmodels'
OUT = os.path.join(ROOT, 'art', 'ai')
SKIP = {'sx_rider', 'sx_ironcav', 'sx_caravan', 'sx_ram', 'sx_catapult', 'sx_thunder', 'sx_boat', 'sx_warship', 'sx_qj_escort'}
ORDER = {'longmen': 0, 'sects': 1, 'foe': 2, 'beast': 3, 'west': 4, 'sango': 5, 'shu': 6}

QUALITY = 'masterpiece, high score, absurdres'
# Most important first: CLIP drops whatever comes after 77 tokens.
NEG = ('head out of frame, cropped head, close-up, multiple girls, multiple boys, crowd, lowres, bad anatomy, bad hands, text, worst quality, low quality, '
       'low score, bad score, signature, watermark, blurry, 3d, realistic, cleavage, modern clothes, scenery, frame')


def characters():
    idx = json.load(open(os.path.join(GALLERY, 'chars', 'index.json'), encoding='utf-8'))
    cs = [c for c in idx['characters'] if c.get('faction') in ORDER and c['id'] not in SKIP]
    cs.sort(key=lambda c: ORDER[c['faction']])
    return cs


PLAIN_NEG = 'bishounen, beautiful, pretty face, '


def prompts(c):
    """(portrait prompt, sheet prompt, extra negative). The who-is-this part comes first, because CLIP drops
    whatever follows the 77th token; at worst a quality tag at the end is lost."""
    tags = TAGS[c['id']]
    face = FACES.get(c['id'], '')
    neg = PLAIN_NEG if face.startswith('!') else ''
    face = face.lstrip('!')
    if tags.startswith('no humans'):
        portrait = f'{tags}, solo, full body, white background, {QUALITY}'
        sheet = f'pixel art, {tags}, solo, character sheet, front view, side view, back view, white background, masterpiece'
    else:
        who = tags + (', ' + face if face else '')
        portrait = f'{who}, solo, upper body, looking at viewer, white background, ancient china, {QUALITY}'
        sheet = (f'pixel art, chibi, {who}, solo, character sheet, front view, side view, back view, full body, '
                 'white background, masterpiece')
    return portrait, sheet, neg


def pipe(pixel):
    vae = AutoencoderKL.from_single_file(f'{MODELS}/sdxl-vae-fp16-fix.safetensors', torch_dtype=torch.float16)
    p = StableDiffusionXLPipeline.from_single_file(f'{MODELS}/animagine-xl-4.0-opt.safetensors', vae=vae,
                                                   torch_dtype=torch.float16, use_safetensors=True)
    p.scheduler = EulerAncestralDiscreteScheduler.from_config(p.scheduler.config)
    if pixel:
        p.load_lora_weights(MODELS, weight_name='pixel-art-xl.safetensors')
        p.fuse_lora(lora_scale=1.0)
        p.unload_lora_weights()
    p.enable_model_cpu_offload()
    p.vae.enable_slicing()
    return p


def chunks(P, text, size=70):
    """Split a prompt into pieces of at most `size` CLIP tokens, breaking at commas or spaces."""
    words = re.split(r'(?<=,)\s*|\s+', text)
    out, cur = [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if len(P.tokenizer(trial).input_ids) - 2 > size and cur:
            out.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        out.append(cur)
    return out


def encode_long(P, prompt, negative):
    """CLIP reads 77 tokens at a time, so long prompts are encoded in pieces and joined along the sequence."""
    pos, neg = chunks(P, prompt), chunks(P, negative)
    n = max(len(pos), len(neg))
    pos += [''] * (n - len(pos))
    neg += [''] * (n - len(neg))
    pe, ne, pp, npool = [], [], None, None
    for a, b in zip(pos, neg):
        e, ng, pl, npl = P.encode_prompt(prompt=a, negative_prompt=b, device='cuda', num_images_per_prompt=1,
                                         do_classifier_free_guidance=True)
        pe.append(e)
        ne.append(ng)
        if pp is None:
            pp, npool = pl, npl
    return torch.cat(pe, 1), torch.cat(ne, 1), pp, npool


def paint(P, prompt, w, h, seed, pixel, neg=''):
    # Long prompts go through the ordinary path and are cut at 77 tokens: encoding them in pieces (encode_long)
    # makes the context too large for an 8 GB card and runs several times slower.
    g = torch.Generator('cuda').manual_seed(seed)
    return P(prompt=prompt, negative_prompt=neg + NEG, width=w, height=h, num_inference_steps=28,
             guidance_scale=6 if pixel else 5.5, generator=g).images[0]


def main():
    sel = sys.argv[1] if len(sys.argv) > 1 else 'all'
    what = sys.argv[2] if len(sys.argv) > 2 else 'both'
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 11
    cs = characters()
    if sel != 'all':
        want = sel.split(',')
        cs = [c for c in cs if c['id'] in want]
    os.makedirs(OUT, exist_ok=True)
    t0 = time.time()
    for kind in ('portrait', 'sheet'):
        if what not in (kind, 'both'):
            continue
        todo = [c for c in cs if not os.path.exists(target(c, kind, seed))]
        if not todo:
            continue
        P = pipe(kind == 'sheet')
        for i, c in enumerate(todo):
            portrait, sheet, neg = prompts(c)
            if kind == 'portrait':
                img = paint(P, portrait, 896, 1152, seed, False, neg)
            else:
                img = paint(P, sheet, 1216, 832, seed, True, neg)
            img.save(target(c, kind, seed))
            print(f'{kind} {i + 1}/{len(todo)} {c["id"]} {time.time() - t0:.0f}s', flush=True)
        del P
        torch.cuda.empty_cache()


def target(c, kind, seed):
    return os.path.join(OUT, f"{c['id']}_{kind}.png" if seed == 11 else f"{c['id']}_{kind}_{seed}.png")


if __name__ == '__main__':
    main()
