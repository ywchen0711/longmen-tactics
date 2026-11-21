# -*- coding: utf-8 -*-
"""
龍門戰記 Longmen Tactics - the original score (every melody, bass line, chord and drum pattern).

The game's music is rendered from this score by tools/orch.py with recorded instruments. Running this file
only renders a quick sketch with the old built-in chip synth, into ../audio/_sketch (the game never uses it).

Sketch synth: a small 2A03-like model - two pulse channels (12.5/25/50 % duty, 4-bit volume
envelopes, NES period-quantised pitch), a 4-bit stepped 32-step triangle for bass, and a
15-bit LFSR noise channel (long + short "metallic" mode) for drums, gongs and woodblocks.
Ornaments give the wuxia flavour: grace notes, erhu-style slides and vibrato, falls.

Score format (one string per channel, tokens separated by spaces):
  NOTE[:dur]   e.g.  A4:4   C#5:2   Bb3     (dur in 16th-note steps; sticky)
  r[:dur]      rest          -[:dur]  tie (extends the previous note)
  prefixes     ^ grace note from above   / slide up into the note   \\ fall at the end
               ~ strong vibrato          ! accent                    * staccato
  |            bar line - the parser checks that every bar is exactly one bar long
  [ ... ]*N    repeat
Drum strings: one character per 16th step: k kick  s snare  h hat  o open hat  c crash
  g gong  w woodblock high  v woodblock low  t tom  .  rest   (| and spaces ignored)

Run:  python tools/music.py            (sketches every track into ../audio/_sketch)
      python tools/music.py battle     (just one)
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt

SR = 32000
CPU = 1789773.0
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'audio', '_sketch'))
TMP = os.environ.get('LQ_MUSIC_TMP', os.path.join(OUT, '_wav'))

NOTE_PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def midi_of(name):
    m = re.fullmatch(r'([A-G])([#b]?)(-?\d)', name)
    if not m:
        raise ValueError('bad note ' + name)
    pc = NOTE_PC[m.group(1)] + (1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0)
    return 12 * (int(m.group(3)) + 1) + pc


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


# --------------------------------------------------------------------------- parsing
def expand(s):
    pat = re.compile(r'\[([^\[\]]*)\]\*(\d+)')
    while True:
        n = pat.sub(lambda mm: ' '.join([mm.group(1)] * int(mm.group(2))), s)
        if n == s:
            return s
        s = n


def parse(s, bar=16, name='?'):
    """-> (events [(step, dur, midi, orn)], total_steps)"""
    s = expand(s).replace('|', ' | ')
    ev, t, dur, last_bar, barno = [], 0.0, 4.0, 0.0, 0
    for tok in s.split():
        if tok == '|':
            barno += 1
            if abs((t - last_bar) - bar) > 1e-6:
                raise ValueError('%s: bar %d is %g steps' % (name, barno, t - last_bar))
            last_bar = t
            continue
        orn = ''
        while tok and tok[0] in '^/\\~!*':
            orn += tok[0]
            tok = tok[1:]
        if ':' in tok:
            tok, d = tok.split(':')
            dur = float(d)
        if tok == 'r':
            t += dur
            continue
        if tok == '-':
            st, d0, m0, o0 = ev[-1]
            ev[-1] = (st, d0 + dur, m0, o0)
            t += dur
            continue
        ev.append((t, dur, midi_of(tok), orn))
        t += dur
    return ev, t


def parse_drums(s):
    s = expand(s).replace('|', '').replace(' ', '')
    return [(i, c) for i, c in enumerate(s) if c != '.'], len(s)


# ----------------------------------------------------------------- chord helpers
QUAL = {'': (0, 4, 7), 'm': (0, 3, 7), 's2': (0, 2, 7), 's4': (0, 5, 7), 'p': (0, 7, 12),
        'q': (0, 5, 10), '6': (0, 4, 9), 'm7': (0, 3, 10)}


def chord_pcs(ch):
    m = re.fullmatch(r'([A-G][#b]?)(.*)', ch)
    root = NOTE_PC[m.group(1)[0]] + (1 if '#' in m.group(1) else -1 if 'b' in m.group(1)[1:] else 0)
    return root % 12, QUAL[m.group(2)]


def place(pc, lo, transpose):
    """midi number with pitch class pc whose transposed value lies in [lo, lo+12)."""
    m = pc
    while m + transpose < lo:
        m += 12
    while m + transpose >= lo + 12:
        m -= 12
    return m


def nn(m):
    names = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    return '%s%d' % (names[m % 12], m // 12 - 1)


BASS = {  # R root, F fifth, O octave, r rest  (dur in steps)
    'drive': 'R:2 R:2 O:2 R:2 R:2 R:2 O:2 F:2',
    'gallop': 'R:3 R:1 R:2 F:2 O:3 R:1 F:2 R:2',
    'oompah': 'R:2 r:2 F:2 r:2 R:2 r:2 O:2 r:2',
    'walk': 'R:4 F:4 O:4 F:4',
    'stride': 'R:6 F:2 O:4 F:4',
    'heartbeat': 'R:2 R:3 r:11',
    'drone': 'R:16',
    'halfs': 'R:8 R:8',
    'pulse8': 'R:2 R:2 R:2 R:2 R:2 R:2 R:2 R:2',
    'toll': 'R:12 F:4',
}

ARP = {  # tone index 0..3 (root, mid, top, octave), r rest
    'up16': '0:1 1:1 2:1 3:1 0:1 1:1 2:1 3:1 0:1 1:1 2:1 3:1 0:1 1:1 2:1 3:1',
    'roll16': '0:1 2:1 3:1 2:1 1:1 2:1 3:1 2:1 0:1 2:1 3:1 2:1 1:1 2:1 3:1 2:1',
    'broken8': '0:2 1:2 2:2 3:2 2:2 1:2 2:2 1:2',
    'off': 'r:2 1:2 r:2 2:2 r:2 1:2 r:2 2:2',
    'hold': '1:8 2:8',
    'stab': '2:3 2:3 1:2 2:3 2:3 1:2',
    'pluck4': '0:4 2:4 3:4 1:4',
}


def bass_line(chords, style, transpose, lo=33):
    out = []
    for ch in chords:
        pc, q = chord_pcs(ch)
        R = place(pc, lo, transpose)
        tones = {'R': R, 'F': R + 7, 'O': R + 12}
        for tok in BASS[style].split():
            k, d = tok.split(':')
            out.append('r:' + d if k == 'r' else nn(tones[k]) + ':' + d)
        out.append('|')
    return ' '.join(out)


def arp_line(chords, style, transpose, lo=55):
    out = []
    for ch in chords:
        pc, q = chord_pcs(ch)
        R = place(pc, lo, transpose)
        tones = [R + q[0], R + q[1], R + q[2], R + 12]
        for tok in ARP[style].split():
            k, d = tok.split(':')
            out.append('r:' + d if k == 'r' else nn(tones[int(k)]) + ':' + d)
        out.append('|')
    return ' '.join(out)


# ------------------------------------------------------------------------ synth
def nes_pulse_hz(f):
    p = max(8, round(CPU / (16 * f)) - 1)
    return CPU / (16 * (p + 1))


def nes_tri_hz(f):
    p = max(2, round(CPU / (32 * f)) - 1)
    return CPU / (32 * (p + 1))


def q4(env):
    return np.round(np.clip(env, 0, 1) * 15) / 15.0


def freq_curve(f, n, orn, vib, dur_s):
    t = np.arange(n) / SR
    cents = np.zeros(n)
    if '^' in orn:                       # grace note: a whole step above, ~45 ms
        g = int(0.045 * SR)
        cents[:g] += 200
    if '/' in orn:                       # erhu slide up from a whole step below
        g = int(0.09 * SR)
        cents[:g] += -200 * (1 - np.arange(min(g, n)) / g)[:n] if g <= n else -200
    if '\\' in orn:                      # fall off the end
        s0 = int(n * 0.65)
        cents[s0:] -= 400 * ((np.arange(n - s0) / max(1, n - s0)) ** 2)
    if vib:
        depth = 40 if '~' in orn else vib
        if dur_s > 0.32 or '~' in orn:
            ramp = np.clip((t - 0.18) / 0.35, 0, 1)
            cents += depth * ramp * np.sin(2 * np.pi * 5.6 * t)
    return f * 2 ** (cents / 1200.0)


def envelope(kind, n, dur_s, gate):
    t = np.arange(n) / SR
    if kind == 'lead':
        env = 0.72 + 0.28 * np.exp(-t / 0.09)
    elif kind == 'pad':
        env = np.minimum(1, t / 0.07) * (0.8 + 0.2 * np.exp(-t / 0.3))
    elif kind == 'pluck':
        env = 0.08 + 0.92 * np.exp(-t / 0.13)
    elif kind == 'bell':
        env = np.exp(-t / 0.75)
    else:
        env = np.ones(n)
    g = int(n * gate)
    rel = int(0.02 * SR)
    env[g:] *= np.exp(-np.arange(n - g) / max(1, rel * 0.5))
    return env


def render_pulse(events, step_s, total_samples, duty=0.5, vol=1.0, kind='lead', vib=22,
                 transpose=0, gate=0.9, tail=2.0):
    buf = np.zeros(total_samples + int(tail * SR), dtype=np.float64)
    for st, d, m, orn in events:
        dur_s = d * step_s
        g = 0.5 if '*' in orn else gate
        extra = 0.03 if kind in ('lead', 'pad') else (1.2 if kind == 'bell' else 0.25)
        n = int((dur_s + extra) * SR)
        f = nes_pulse_hz(hz(m + transpose))
        fc = freq_curve(f, n, orn, vib if kind in ('lead', 'pad') else 0, dur_s)
        ph = np.cumsum(fc) / SR
        wave = np.where((ph % 1.0) < duty, 1.0, -1.0)
        nn_ = int(dur_s * SR)
        env = envelope(kind, n, dur_s, g * nn_ / n)
        a = (1.25 if '!' in orn else 1.0) * vol
        x = wave * q4(env) * a
        x[:16] *= np.linspace(0, 1, 16)
        x[-32:] *= np.linspace(1, 0, 32)
        s0 = int(round(st * step_s * SR))
        buf[s0:s0 + n] += x[:len(buf) - s0]
    return buf


TRI_TABLE = np.concatenate([np.arange(15, -1, -1), np.arange(0, 16)]) / 7.5 - 1.0


def render_tri(events, step_s, total_samples, vol=1.0, transpose=0, gate=0.88, tail=2.0):
    buf = np.zeros(total_samples + int(tail * SR))
    for st, d, m, orn in events:
        dur_s = d * step_s * (0.5 if '*' in orn else gate)
        n = int(dur_s * SR)
        f = nes_tri_hz(hz(m + transpose))
        fc = freq_curve(f, n, orn, 0, dur_s)
        ph = np.cumsum(fc) / SR
        x = TRI_TABLE[(np.floor(ph * 32).astype(np.int64)) % 32] * vol
        fade = min(64, n // 2)
        x[:fade] *= np.linspace(0, 1, fade)
        x[-fade:] *= np.linspace(1, 0, fade)
        s0 = int(round(st * step_s * SR))
        buf[s0:s0 + n] += x[:len(buf) - s0]
    return buf


def _lfsr(short):
    reg, out = 1, []
    tap = 6 if short else 1
    for _ in range(93 if short else 32767):
        fb = (reg & 1) ^ ((reg >> tap) & 1)
        reg = (reg >> 1) | (fb << 14)
        out.append(1.0 if reg & 1 else -1.0)
    return np.array(out)


NOISE_LONG = _lfsr(False)
NOISE_SHORT = _lfsr(True)
NOISE_PER = [4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068]


def noise(n, idx, short=False):
    rate = CPU / NOISE_PER[idx]
    tab = NOISE_SHORT if short else NOISE_LONG
    i = (np.arange(n) * rate / SR).astype(np.int64) % len(tab)
    return tab[i]


def tri_sweep(f0, f1, dur):
    n = int(dur * SR)
    f = f0 * (f1 / f0) ** (np.arange(n) / n)
    ph = np.cumsum(f) / SR
    return TRI_TABLE[(np.floor(ph * 32).astype(np.int64)) % 32]


def drum(c):
    def dec(n, tau):
        return q4(np.exp(-np.arange(n) / (tau * SR)))
    if c == 'k':
        a = tri_sweep(170, 45, 0.11) * 1.1
        b = noise(len(a), 11) * dec(len(a), 0.012) * 0.5
        return a + b
    if c == 's':
        n = int(0.16 * SR)
        x = noise(n, 5) * dec(n, 0.05) * 0.75
        x[:int(0.03 * SR)] += tri_sweep(240, 140, 0.03) * 0.6
        return x
    if c == 't':
        a = tri_sweep(220, 90, 0.16)
        return a * dec(len(a), 0.08) * 1.2
    if c == 'h':
        n = int(0.04 * SR)
        return noise(n, 0) * dec(n, 0.012) * 0.33
    if c == 'o':
        n = int(0.18 * SR)
        return noise(n, 1) * dec(n, 0.06) * 0.3
    if c == 'c':
        n = int(1.1 * SR)
        return noise(n, 2) * dec(n, 0.35) * 0.42
    if c == 'g':                          # gong: metallic short-mode noise + low pulse hum
        n = int(2.4 * SR)
        e = dec(n, 0.7)
        x = noise(n, 8, True) * e * 0.28 + noise(n, 11, True) * e * 0.22
        ph = np.arange(n) * 98.0 / SR
        x += np.where(ph % 1 < 0.25, 1, -1) * q4(np.exp(-np.arange(n) / (0.9 * SR))) * 0.12
        x[:int(0.02 * SR)] += noise(int(0.02 * SR), 3) * 0.4
        return x
    if c == 'T':                          # taiko: a deep, long triangle drop + a low noise thump
        a = tri_sweep(115, 34, 0.36)
        n = len(a)
        x = a * dec(n, 0.17) * 1.35
        x += noise(n, 12) * dec(n, 0.035) * 0.5
        x[:int(0.012 * SR)] += noise(int(0.012 * SR), 4) * 0.45
        return x
    if c == 'R':                          # rim shot: a tight metallic click
        n = int(0.05 * SR)
        x = noise(n, 2, True) * dec(n, 0.011) * 0.5
        x[:int(0.01 * SR)] += tri_sweep(900, 600, 0.01) * 0.35
        return x
    if c in 'wv':                         # woodblock / muyu: a short hollow pulse blip
        f = 1250.0 if c == 'w' else 820.0
        n = int(0.06 * SR)
        ph = np.arange(n) * f / SR
        return np.where(ph % 1 < 0.5, 1, -1) * dec(n, 0.014) * 0.55
    raise ValueError(c)


DRUM_CACHE = {}


def render_noise(hits, step_s, total_samples, vol=1.0, tail=2.5):
    buf = np.zeros(total_samples + int(tail * SR))
    for st, c in hits:
        if c not in DRUM_CACHE:
            DRUM_CACHE[c] = drum(c)
        x = DRUM_CACHE[c] * vol
        s0 = int(round(st * step_s * SR))
        buf[s0:s0 + len(x)] += x[:len(buf) - s0]
    return buf


# ---------------------------------------------------------------- track render
MIX = {'p1': 0.20, 'p2': 0.15, 'tri': 0.30, 'noise': 0.22}


def render_section(sec, loop):
    bar = sec.get('bar', 16)
    tr = sec.get('transpose', 0)
    step_s = 60.0 / sec['bpm'] / 4
    parts = {}
    lens = {}
    for ch in ('p1', 'p2', 'tri'):
        if isinstance(sec.get(ch), str) and sec[ch] != 'echo':
            parts[ch], lens[ch] = parse(sec[ch], bar, sec['name'] + '.' + ch)
    if 'noise' in sec:
        parts['noise'], lens['noise'] = parse_drums(sec['noise'])
    steps = sec.get('steps') or max(lens.values())
    if loop:
        for ch, L in lens.items():
            if abs(L - steps) > 1e-6:
                raise ValueError('%s.%s is %g steps, expected %g' % (sec['name'], ch, L, steps))
    total = int(round(steps * step_s * SR))
    if sec.get('p2') == 'echo':
        dly, ev = sec.get('echo_delay', 3), []
        for st, d, m, o in parts['p1']:
            s2 = st + dly
            if loop and s2 >= steps:
                s2 -= steps
            ev.append((s2, d, m, o.replace('!', '')))
        parts['p2'] = ev
    mix = np.zeros(total + int(3.0 * SR))
    p1 = sec.get('p1o', {})
    p2 = sec.get('p2o', {})
    if 'p1' in parts:
        x = render_pulse(parts['p1'], step_s, total, transpose=tr, tail=3.0,
                         **{'duty': 0.25, 'kind': 'lead', **p1})
        mix[:len(x)] += x * MIX['p1']
    if 'p2' in parts:
        x = render_pulse(parts['p2'], step_s, total, transpose=tr, tail=3.0,
                         **{'duty': 0.5, 'kind': 'pluck', 'vol': 0.8, **p2})
        mix[:len(x)] += x * MIX['p2']
    if 'tri' in parts:
        x = render_tri(parts['tri'], step_s, total, transpose=tr, tail=3.0, **sec.get('trio', {}))
        mix[:len(x)] += x * MIX['tri']
    if 'noise' in parts:
        x = render_noise(parts['noise'], step_s, total, tail=3.0, vol=sec.get('nvol', 1.0))
        mix[:len(x)] += x * MIX['noise']
    return mix, total


HP = butter(2, 38, 'highpass', fs=SR, output='sos')
LP = butter(2, 11500, 'lowpass', fs=SR, output='sos')


def nes_filter(x, loop):
    if loop:                                  # filter circularly so the loop seam is clean
        L = len(x)
        y = np.concatenate([x, x, x])
        y = sosfilt(LP, sosfilt(HP, y))
        return y[L:2 * L]
    return sosfilt(LP, sosfilt(HP, x))


def gated_rms(x):
    w = int(0.05 * SR)
    n = len(x) // w
    p = (x[:n * w].reshape(n, w) ** 2).mean(1)
    keep = p[p > p.max() * 0.01]
    return np.sqrt(keep.mean())


TARGET_RMS = 0.16
PEAK = 10 ** (-1.0 / 20)


def render_track(name, tr):
    loop = tr.get('loop', True)
    secs = tr['sections']
    if loop:
        mix, total = render_section({'name': name, **secs[0]}, True)
        y = mix[:total].copy()
        rest = mix[total:]
        k = 0
        while k < len(rest):                  # wrap the ringing tail onto the start
            seg = rest[k:k + total]
            y[:len(seg)] += seg
            k += total
    else:
        pieces, pos = [], 0
        for s in secs:
            m, total = render_section({'name': name, **s}, False)
            pieces.append((pos, m))
            pos += total
        y = np.zeros(pos + int(3.0 * SR))
        for p, m in pieces:
            y[p:p + len(m)] += m[:len(y) - p]
        nz = np.nonzero(np.abs(y) > 1e-4)[0]
        y = y[:nz[-1] + int(0.05 * SR)]
    y = nes_filter(y, loop)
    y -= y.mean()
    g = min(TARGET_RMS / gated_rms(y), PEAK / np.abs(y).max())
    y *= g
    f = int(0.003 * SR)                       # tiny fades: no click at the seam/ends
    y[:f] *= np.linspace(0, 1, f)
    fo = f if loop else int(0.08 * SR)
    y[-fo:] *= np.linspace(1, 0, fo)
    return y.astype(np.float32), loop


def write_wav(path, y):
    import wave
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def encode(wav, name):
    base = os.path.join(OUT, name)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-c:a', 'aac',
                    '-b:a', '64k', '-movflags', '+faststart', base + '.m4a'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-c:a', 'libvorbis',
                    '-b:a', '64k', base + '.ogg'], check=True)


# =========================================================================== SCORES
# Longmen Quest II - all melodies original, on Chinese pentatonic modes (gong C D E G A, yu A C D E G,
# shang D E G A C, zhi G A C D E), transposed per track. A recurring bell motif (E-A-E, a falling fourth answered)
# runs through the title, the tower and the final battle.
# score helpers (from Longmen Quest II)
_PCN = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
_NOTE_TOK = re.compile(r'^([\^/\\~!*]*)([A-G][#b]?-?\d)(:[\d.]+)?$')


def _map_notes(s, fn):
    out = []
    for tok in s.split():
        m = _NOTE_TOK.match(tok)
        if not m:
            out.append(tok)
            continue
        r = fn(midi_of(m.group(2)), m.group(1))
        if r is None:
            out.append('r' + (m.group(3) or ''))
        else:
            mm, orn = r
            out.append(orn + nn(mm) + (m.group(3) or ''))
    return ' '.join(out)


def shift(s, semi):
    return _map_notes(s, lambda m, o: (m + semi, o))


def harm(s, scale, deg=-2, drop=0):
    """a diatonic line `deg` scale steps from the melody (a third below by default); accents removed"""
    sc = sorted(_PCN[x] for x in scale)
    def f(m, o):
        pc = m % 12
        if pc not in sc:
            return (m - 3 - drop, o.replace('!', ''))
        i = sc.index(pc)
        j = i + deg
        octs, j = divmod(j, len(sc))
        return (m - pc + sc[j] + 12 * octs - drop, o.replace('!', '').replace('~', ''))
    return _map_notes(s, f)


_OST = {  # (interval, dur) figures for the triangle: A the steady one, B the turn at the end of a phrase
    'A': [(0, 2), (0, 1), (0, 1), (12, 2), (0, 2), (3, 2), (0, 1), (0, 1), (5, 2), (3, 2)],
    'B': [(0, 2), (0, 1), (0, 1), (12, 2), (0, 2), (7, 2), (5, 2), (3, 2), (-2, 2)],
    'C': [(0, 1), (0, 1), (12, 1), (0, 1), (0, 1), (0, 1), (10, 1), (0, 1),
          (0, 1), (0, 1), (7, 1), (0, 1), (5, 1), (0, 1), (3, 1), (12, 1)],    # 16ths: the climax drive
}


def ostinato(spec, lo=36):
    """spec 'E E F E/B ...' -> a triangle line, one bar per root (/X picks the figure)"""
    out = []
    for b in spec.split():
        root, fig = (b.split('/') + ['A'])[:2]
        R = place(_PCN[root], lo, 0)
        out += [nn(R + iv) + ':' + str(d) for iv, d in _OST[fig]] + ['|']
    return ' '.join(out)


_STAB = {  # R root, F fifth, O octave
    'a': 'R:1 r:1 r:2 O:1 r:1 F:1 r:1 r:2 R:1 r:1 O:2 F:2',
    'b': 'r:2 R:1 R:1 r:2 F:2 r:2 O:1 O:1 r:2 F:2',
    'c': 'O:1 r:1 F:1 r:1 R:1 r:1 F:1 r:1 O:1 r:1 F:1 r:1 R:2 F:2',
    'p': 'O:1 R:1 R:1 R:1 F:1 R:1 R:1 R:1 O:1 R:1 R:1 R:1 F:1 R:1 F:1 O:1',   # 16th pulse
    'x': 'r:16',
}


def stabs(spec, lo=52):
    out = []
    for b in spec.split():
        root, pat = (b.split('/') + ['a'])[:2]
        R = place(_PCN[root], lo, 0)
        tones = {'R': R, 'F': R + 7, 'O': R + 12}
        for tok in _STAB[pat].split():
            k, d = tok.split(':')
            out.append('r:' + d if k == 'r' else nn(tones[k]) + ':' + d)
        out.append('|')
    return ' '.join(out)




T = {}

def D(*bars):
    """drum bars (16 chars each) joined"""
    return '|'.join(bars) + '|'

# ---- title 「龍門戰旗」: the brothers set out under the carp banner (A yu, heroic; dizi over strings)
_ti = '''
A4:4 C5:2 D5:2 E5:8 | G5:4 E5:2 D5:2 C5:4 D5:4 | E5:4 G5:4 A5:6 G5:2 | ~E5:12 r:4 |
A5:4 G5:2 E5:2 D5:4 E5:4 | C5:4 D5:2 C5:2 A4:8 | G4:4 A4:4 C5:4 D5:4 | ~E5:12 r:4 |
A5:6 C6:2 D6:4 C6:4 | A5:4 G5:4 E5:8 | D5:4 E5:2 G5:2 A5:4 C6:4 | !D6:12 r:4 |
E6:4 D6:2 C6:2 A5:4 G5:4 | A5:4 C6:4 G5:4 E5:4 | D5:2 E5:2 G5:4 E5:4 D5:4 | A4:12 r:4 |'''
_ti_ch = ['Am', 'C', 'Am', 'Em', 'Am', 'F', 'C', 'Em', 'F', 'C', 'G', 'Dm', 'Am', 'F', 'G', 'Am']
_ti_dr = D('g...........ssss', 'k.......s.s.sss.', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.k.s.ssss',
           'c.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.k.s.ssss',
           'c.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.kkt.t.tt',
           'c.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'g...k...s.ssssss')
T['title'] = dict(loop=True, sections=[dict(bpm=104, transpose=0, p1=_ti, p2=arp_line(_ti_ch, 'up16', 0), tri=bass_line(_ti_ch, 'gallop', 0), noise=_ti_dr)])

# ---- world 「江湖行」: walking the roads of the jianghu (G gong, striding)
_wo = '''
G4:4 B4:2 D5:2 E5:4 D5:4 | B4:4 A4:2 G4:2 A4:8 | D5:4 E5:2 G5:2 A5:4 G5:4 | E5:8 D5:8 |
G5:4 A5:2 G5:2 E5:4 D5:4 | E5:4 G5:4 D5:8 | B4:2 D5:2 E5:4 D5:4 B4:4 | A4:12 r:4 |
E5:4 G5:4 A5:4 B5:4 | D6:6 B5:2 A5:8 | G5:4 A5:2 B5:2 A5:4 G5:4 | E5:8 G5:8 |
A5:4 G5:2 E5:2 D5:4 E5:4 | G5:6 E5:2 D5:4 B4:4 | A4:2 B4:2 D5:4 E5:4 A4:4 | G4:12 r:4 |'''
_wo_ch = ['G', 'Em', 'C', 'G', 'C', 'Em', 'G', 'D', 'Em', 'D', 'C', 'G', 'Am', 'Em', 'D', 'G']
T['world'] = dict(loop=True, sections=[dict(bpm=116, transpose=0, p1=_wo, p2=arp_line(_wo_ch, 'broken8', 0, lo=52), tri=bass_line(_wo_ch, 'stride', 0, lo=31),
    noise=D(*(['k...h...s...h...', 'k...h...s...h.h.', 'k...h...s...h...', 'k...h...s.k.s.h.'] * 4)))])

# ---- town 「茶館閒話」: gossip over tea in a canal town (D shang, erhu slides over guzheng)
_tw = '''
D5:4 E5:2 G5:2 A5:4 G5:4 | E5:2 D5:2 C5:4 D5:8 | A4:4 C5:2 D5:2 E5:4 G5:4 | /A5:12 r:4 |
C6:4 A5:2 G5:2 A5:4 E5:4 | G5:4 E5:2 D5:2 C5:8 | D5:2 E5:2 G5:4 E5:2 D5:2 C5:4 | ~D5:12 r:4 |'''
_tw_ch = ['Dm', 'C', 'Am', 'Dm', 'F', 'C', 'Am', 'Dm']
T['town'] = dict(loop=True, sections=[dict(bpm=100, transpose=0, p1=_tw + _tw.replace('/A5:12 r:4', 'A5:8 G5:4 E5:4'), p2=arp_line(_tw_ch * 2, 'pluck4', 0, lo=55),
    tri=bass_line(_tw_ch * 2, 'walk', 0), noise=D(*(['w.......v...w...', 'w.......v.v.w...'] * 8)))])

# ---- calm 「說書人」: the storyteller's block, quiet scenes between battles (C gong, guzheng and flute)
_ca = '''
E5:6 D5:2 C5:8 | D5:4 E5:4 G5:8 | A5:6 G5:2 E5:4 D5:4 | ~E5:16 |
G5:6 A5:2 G5:4 E5:4 | D5:4 C5:4 A4:8 | C5:4 D5:2 E5:2 D5:4 A4:4 | ~C5:16 |'''
_ca_ch = ['C', 'G', 'Am', 'Em', 'C', 'Am', 'F', 'C']
T['calm'] = dict(loop=True, sections=[dict(bpm=88, transpose=0, p1=_ca, p2=arp_line(_ca_ch, 'pluck4', 0, lo=52), tri=bass_line(_ca_ch, 'halfs', 0, lo=31),
    noise=D(*(['v...............', '........w.......'] * 4)))])

# ---- tense 「黑旗」: the black banner in the shadows (E yu, low, sparse; tremolo strings)
_te = '''
E4:2 r:2 E4:2 G4:2 A4:8 | B4:4 A4:2 G4:2 E4:8 | r:4 D5:2 B4:2 A4:4 G4:4 | ~A4:12 r:4 |
E4:2 r:2 E4:2 G4:2 B4:8 | D5:4 B4:2 A4:2 G4:8 | r:4 A4:2 G4:2 E4:4 D4:4 | ~E4:12 r:4 |'''
_te_ch = ['Em', 'Em', 'G', 'Am', 'Em', 'G', 'Am', 'Em']
T['tense'] = dict(loop=True, sections=[dict(bpm=92, transpose=0, p1=_te, p2='echo', echo_delay=3, tri=bass_line(_te_ch, 'heartbeat', 0, lo=28),
    noise=D(*(['g.......v.......', '....v.......v...'] * 4)))])

# ---- sad 「寒江雪」: snow falling on the Cold River (A yu, slow erhu)
_sa = '''
E5:6 D5:2 C5:4 A4:4 | /C5:4 D5:4 E5:8 | G5:6 E5:2 D5:4 C5:4 | ~D5:12 r:4 |
E5:4 G5:4 A5:6 G5:2 | E5:4 D5:2 C5:2 D5:8 | C5:4 A4:2 G4:2 A4:4 C5:4 | ~A4:12 r:4 |'''
_sa_ch = ['Am', 'F', 'C', 'G', 'Am', 'Em', 'F', 'Am']
T['sad'] = dict(loop=True, sections=[dict(bpm=72, transpose=0, p1=_sa, p2=arp_line(_sa_ch, 'hold', 0, lo=52), tri=bass_line(_sa_ch, 'halfs', 0, lo=31),
    noise=D(*(['v...............', '................'] * 4)))])

# ---- battle 「八方風雨」: storm from eight directions (A yu, driving)
_b1 = '''
A4:2 A4:1 A4:1 C5:2 D5:2 E5:4 D5:2 C5:2 | D5:2 D5:1 D5:1 E5:2 G5:2 A5:4 G5:2 E5:2 | A5:2 G5:2 E5:2 D5:2 E5:2 G5:2 A5:2 C6:2 | !D6:8 C6:4 A5:4 |
A4:2 A4:1 A4:1 C5:2 D5:2 E5:4 G5:2 E5:2 | D5:2 C5:2 A4:2 G4:2 A4:8 | C5:2 D5:2 E5:2 G5:2 A5:2 G5:2 E5:2 D5:2 | !E5:12 r:4 |
E5:4 A5:4 G5:2 E5:2 D5:4 | C5:4 D5:2 E5:2 A4:8 | G5:4 C6:4 A5:2 G5:2 E5:4 | D5:4 E5:2 G5:2 A5:8 |
C6:2 A5:2 G5:2 A5:2 C6:4 D6:4 | E6:4 D6:2 C6:2 A5:8 | G5:2 A5:2 G5:2 E5:2 D5:2 E5:2 G5:2 D5:2 | ~A5:12 r:4 |'''
_b1_ch = ['Am', 'Am', 'C', 'G', 'Am', 'Em', 'C', 'Em', 'Am', 'Am', 'C', 'G', 'F', 'Am', 'G', 'Am']
_b1_dr = D(*(['k.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.k.s.ssss'] * 3 +
             ['c.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hh', 'k.h.s.h.k.k.s.h.', 'k.h.s.h.kkt.t.tt']))
T['battle'] = dict(loop=True, sections=[dict(bpm=168, transpose=0, p1=_b1, p2=arp_line(_b1_ch, 'stab', 0, lo=52), tri=bass_line(_b1_ch, 'drive', 0), noise=_b1_dr)])

# ---- battle2 「刀光劍影」: flashing blades on the water and the rooftops (D yu, quick)
_b2 = '''
D5:2 r:1 D5:1 F5:2 G5:2 A5:4 G5:2 F5:2 | G5:2 A5:2 C6:4 A5:4 G5:4 | F5:2 G5:2 A5:2 F5:2 D5:4 C5:4 | D5:8 r:4 A4:4 |
D5:2 r:1 D5:1 F5:2 G5:2 A5:4 C6:2 A5:2 | D6:4 C6:2 A5:2 G5:8 | A5:2 G5:2 F5:2 G5:2 A5:2 C6:2 D6:4 | !D6:12 r:4 |
A5:4 A5:2 G5:2 F5:4 G5:4 | A5:4 C6:4 D6:8 | C6:2 A5:2 G5:2 F5:2 G5:4 A5:4 | F5:4 D5:4 C5:8 |
D5:2 F5:2 G5:2 A5:2 C6:2 A5:2 G5:2 F5:2 | G5:4 A5:4 C6:4 D6:4 | C6:2 A5:2 G5:2 A5:2 F5:4 G5:4 | ~D5:12 r:4 |'''
_b2_ch = ['Dm', 'C', 'F', 'Dm', 'Dm', 'Gm', 'F', 'Dm', 'Dm', 'F', 'C', 'F', 'Dm', 'Gm', 'C', 'Dm']
T['battle2'] = dict(loop=True, sections=[dict(bpm=176, transpose=0, p1=_b2, p2=arp_line(_b2_ch, 'roll16', 0, lo=52), tri=bass_line(_b2_ch, 'gallop', 0),
    noise=D(*(['k.h.s.hkk.h.s.h.', 'k.h.s.h.k.hks.hh'] * 7 + ['c.h.s.h.k.k.s.h.', 'k.h.s.h.kkt.tttt'])))])

# ---- battle3 「過關斬將」: through the passes, deeper into the labyrinths (E yu, march)
_b3 = '''
E5:4 E5:2 G5:2 A5:4 B5:4 | A5:2 G5:2 E5:4 D5:8 | E5:4 G5:2 A5:2 B5:4 D6:4 | !B5:12 r:4 |
D6:4 B5:2 A5:2 G5:4 A5:4 | B5:4 A5:2 G5:2 E5:8 | D5:2 E5:2 G5:4 A5:2 G5:2 E5:4 | ~E5:12 r:4 |'''
_b3_ch = ['Em', 'Em', 'G', 'Bm', 'D', 'Em', 'G', 'Em']
T['battle3'] = dict(loop=True, sections=[dict(bpm=160, transpose=0, p1=_b3 + _b3.replace('!B5:12 r:4', 'B5:8 A5:4 G5:4'), p2=arp_line(_b3_ch * 2, 'stab', 0, lo=52),
    tri=bass_line(_b3_ch * 2, 'walk', 0, lo=31), noise=D(*(['k...s...k.k.s...', 'k...s...k...s.ss'] * 8)))])

# ---- boss 「幽冥殿」: the masters of the Netherworld (A minor with its dark F and E)
_bo = '''
A4:2 A4:2 r:2 A4:1 A4:1 C5:4 B4:4 | A4:2 A4:2 r:2 A4:1 A4:1 E5:4 D5:4 | C5:2 D5:2 E5:2 F5:2 E5:4 D5:2 C5:2 | !B4:12 r:4 |
A5:4 G5:2 F5:2 E5:4 F5:4 | E5:2 D5:2 C5:2 B4:2 A4:8 | F5:4 E5:2 D5:2 C5:4 D5:4 | ~E5:12 r:4 |
A5:2 r:2 A5:2 C6:2 B5:4 A5:4 | G5:4 F5:2 E5:2 F5:8 | E5:2 F5:2 G5:2 A5:2 B5:4 C6:4 | !B5:12 r:4 |
C6:4 B5:2 A5:2 G5:4 F5:4 | E5:4 F5:2 E5:2 D5:4 C5:4 | D5:2 C5:2 B4:2 C5:2 D5:4 B4:4 | ~A4:12 r:4 |'''
_bo_ch = ['Am', 'Am', 'F', 'E', 'F', 'Am', 'Dm', 'E', 'Am', 'F', 'C', 'E', 'F', 'Am', 'Dm', 'Am']
T['boss'] = dict(loop=True, sections=[dict(bpm=150, transpose=0, p1=_bo, p2=arp_line(_bo_ch, 'stab', 0, lo=50), tri=bass_line(_bo_ch, 'drive', 0, lo=28),
    noise=D(*(['k...s...k.k.s...', 'k...s...k.kks.ss', 'k...s...k.k.s...', 'g...s...k.k.ssss'] * 4)))])

# ---- victory and defeat (jingles)
T['victory'] = dict(loop=False, sections=[dict(bpm=150, transpose=0, p1='A4:2 C5:2 E5:2 A5:2 G5:2 A5:1 G5:1 ~A5:20',
    p2='E4:2 A4:2 C5:2 E5:2 D5:2 E5:2 ~E5:20', tri='A2:4 r:4 E2:4 A2:20', noise='k.......s.s.ssssc...............')])
T['defeat'] = dict(loop=False, sections=[dict(bpm=70, transpose=0, p1='E5:4 D5:4 C5:4 \\A4:8 r:12', p2='C5:4 B4:4 A4:4 E4:8 r:12', tri='A2:8 F2:4 E2:8 r:12', noise='g...............................')])

# ---- ending 「八旗同風」: the title in triumph, then slow and gentle, the bell to close
_en_slow = '''
E5:8 D5:4 C5:4 | D5:4 E5:4 G5:8 | A5:8 G5:4 E5:4 | ~D5:16 |
C5:4 D5:4 E5:4 G5:4 | A5:6 G5:2 E5:8 | D5:4 C5:2 A4:2 C5:4 D5:4 | ~A4:16 |'''
_en_ch = ['Am', 'G', 'F', 'G', 'C', 'Am', 'Dm', 'Am']
T['ending'] = dict(loop=False, sections=[
    dict(bpm=104, transpose=0, p1=_ti, p2=arp_line(_ti_ch, 'up16', 0), tri=bass_line(_ti_ch, 'gallop', 0), noise=_ti_dr),
    dict(bpm=76, transpose=0, p1=_en_slow, p2=arp_line(_en_ch, 'pluck4', 0, lo=50), tri=bass_line(_en_ch, 'halfs', 0, lo=31), noise=D(*(['v...............'] * 8))),
    dict(bpm=70, transpose=0, p1='E5:4 A5:4 E5:8 | D5:4 G5:4 D5:8 | C5:4 D5:4 E5:4 G5:4 | ~A5:16 | r:16 |', tri='A2:16 | G2:16 | F2:16 | A2:16 | r:16 |',
         noise=D('g...............', '................', '................', 'g...............', '................')),
])

NAMES = {
    'title': ('龍門戰旗', 'The Banners of Longmen'),
    'world': ('江湖行', 'Walking the Jianghu'),
    'town': ('茶館閒話', 'Gossip over Tea'),
    'calm': ('說書人', 'The Storyteller'),
    'tense': ('黑旗', 'The Black Banner'),
    'sad': ('寒江雪', 'Snow on the Cold River'),
    'battle': ('八方風雨', 'Storm from Eight Directions'),
    'battle2': ('刀光劍影', 'Flashing Blades'),
    'battle3': ('過關斬將', 'Through the Passes'),
    'boss': ('幽冥殿', 'The Netherworld Hall'),
    'victory': ('旗開得勝', 'Victory at the First Banner'),
    'defeat': ('壯志未酬', 'Ambition Unfulfilled'),
    'ending': ('八旗同風', 'Eight Banners in One Wind'),
}


def main(which):
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    meta_path = os.path.join(OUT, 'tracks.json')
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path, encoding='utf-8') as f:
            meta = json.load(f)
    for name in which:
        y, loop = render_track(name, T[name])
        wav = os.path.join(TMP, name + '.wav')
        write_wav(wav, y)
        encode(wav, name)
        dur = round(len(y) / SR, 3)
        zh, en = NAMES[name]
        meta[name] = {'zh': zh, 'en': en, 'loop': loop, 'dur': dur}
        pk = 20 * np.log10(np.abs(y).max())
        print('%-8s %6.2fs loop=%-5s peak %.2f dBFS rms %.1f dB dc %.1e' % (
            name, dur, loop, pk, 20 * np.log10(gated_rms(y)), y.mean()))
    meta = {k: meta[k] for k in NAMES if k in meta}
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(sys.argv[1:] or list(T))
