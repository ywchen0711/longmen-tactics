// Character art from the Character Gallery's 8-bit `nes` style (assets/art.png, rects in art.js):
// 16 x 24 field sprites for people, 16 x 16 (or 16 x 24) ones for beasts, and the 48 x 56 portraits.
// Each pose is cut once onto a small canvas and cached; the map scales it up with crisp pixels.
import { ART } from '../art.js';
import { AI } from '../ai_art.js';
import { JOBS } from '../data/jobs.js';
import { MONSTERS } from '../data/monsters.js';
import { CAST } from '../data/story.js';

export const SPR_W = 16, SPR_H = 24, SPR_SCALE = 2.25, MON_W = 16, MON_H = 16;
const cache = new Map();
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let atlas = null;
export const artReady = new Promise((resolve) => {
  if (typeof Image === 'undefined') return resolve();
  const img = new Image();
  img.onload = () => { atlas = img; cache.clear(); resolve(); };
  img.onerror = () => resolve();
  img.src = 'assets/art.png?v=4';
});
// The AI-painted art (tools/ai_pack.py) takes over wherever it exists: 64 x 88 sprites in front, side and back
// views, and 128 x 128 busts. Drawn canvases carry `res`, how many of their pixels make one of the 16 x 24 grid.
let aiSpr = null, aiPor = null;
const AI_RES = 2.9, AI_MON_RES = 3.3, AW = 64, AH = 88, AP = 128;
const load = (src, set) => new Promise((resolve) => {
  if (typeof Image === 'undefined') return resolve();
  const img = new Image();
  img.onload = () => { set(img); cache.clear(); resolve(); };
  img.onerror = () => resolve();
  img.src = src;
});
export const aiReady = Promise.all([load('assets/ai/sprites.png?v=1', (i) => { aiSpr = i; }), load('assets/ai/portraits.webp?v=1', (i) => { aiPor = i; })]);
// view 0 front, 1 side, 2 back; breath draws it a pixel shorter, for the second idle frame
function aiFrame(id, view, breath = false) {
  const key = `ai|${id}|${view}|${breath}`;
  if (cache.has(key)) return cache.get(key);
  const [x, y] = AI[id].s, c = mk(AW, AH);
  c.getContext('2d').drawImage(aiSpr, x + view * AW, y, AW, AH, 0, breath ? 1 : 0, AW, breath ? AH - 1 : AH);
  c.res = ART[id] && ART[id].k === 'm' ? AI_MON_RES : AI_RES;
  cache.set(key, c);
  return c;
}
function aiPose(id, back, pose) {
  const front = aiFrame(id, 0), res = front.res, mark = (c) => { c.res = res; return c; };
  if (pose === 'dead') return mark(fallen(id, front));
  if (pose === 'hurt') return mark(tinted(back ? aiFrame(id, 2) : front, 'rgba(255,70,70,.45)', `hurt|${id}|${back}`));
  if (pose === 'act') return aiFrame(id, 1);
  if (pose === 'walk0' || pose === 'walk1') return back ? aiFrame(id, 2, pose === 'walk1') : aiFrame(id, 1, pose === 'walk1');
  return aiFrame(id, back ? 2 : 0, pose === 'idle1');
}
// which gallery character draws this unit
export function artOf(u) {
  if (!u) return 'sx_disciple';
  if (u.art && ART[u.art]) return u.art;
  if (u.who && CAST[u.who] && CAST[u.who].art) return CAST[u.who].art;
  if (u.mon && MONSTERS[u.mon]) return MONSTERS[u.mon].art;
  const j = JOBS[u.job];
  if (j && j.spr) return (u.sex === 'f' && j.spr[1]) || j.spr[0];
  return 'sx_disciple';
}
// one frame of a row, mirrored when asked
function frame(id, row, k, mirror = false) {
  const key = `f|${id}|${row}|${k}|${mirror}`;
  if (cache.has(key)) return cache.get(key);
  const a = ART[id] || ART.sx_disciple, c = mk(a.fw, a.fh), g = c.getContext('2d');
  if (atlas) {
    if (mirror) { g.translate(a.fw, 0); g.scale(-1, 1); }
    g.drawImage(atlas, a.s[0] + k * a.fw, a.s[1] + row * a.fh, a.fw, a.fh, 0, 0, a.fw, a.fh);
    cache.set(key, c);
  }
  return c;
}
function tinted(src, col, key) {
  if (cache.has(key)) return cache.get(key);
  const c = mk(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  if (atlas) cache.set(key, c);
  return c;
}
// lying on the ground: the idle frame turned on its side, a little darker
function fallen(id, src) {
  const key = `dead|${id}`;
  if (cache.has(key)) return cache.get(key);
  const w = src.height, h = src.height, c = mk(w, h), g = c.getContext('2d');
  g.translate(w / 2, h - src.width / 2); g.rotate(-Math.PI / 2); g.drawImage(src, -src.width / 2, -src.height / 2);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,10,30,.35)'; g.fillRect(0, 0, w, h);
  if (atlas) cache.set(key, c);
  return c;
}
// pose: 'idle0' 'idle1' 'walk0' 'walk1' 'act' 'hurt' 'dead'; back: seen from behind. The picture faces left (the map mirrors it).
function drawPose(id, back, pose = 'idle0') {
  if (aiSpr && AI[id] && AI[id].s) return aiPose(id, back, pose);
  const a = ART[id] || ART.sx_disciple, R = a.rows;
  if (!ART[id]) id = 'sx_disciple';
  if (a.k === 'm') {
    const f = frame(id, R.move || 0, pose === 'idle1' || pose === 'walk1' ? 1 : 0, back);
    if (pose === 'hurt') return tinted(f, 'rgba(255,70,70,.45)', `hurt|${id}|${back}`);
    if (pose === 'dead') return fallen(id, frame(id, R.move || 0, 0));
    return f;
  }
  const n = pose === 'idle1' || pose === 'walk1' ? 1 : 0;
  const side = (k) => frame(id, R.side ?? 0, k, true);       // the gallery's side frames face right
  const up = (k) => (R.up != null ? frame(id, R.up, k) : side(k));
  if (pose === 'dead') return fallen(id, frame(id, R.idle ?? 0, 0));
  if (pose === 'hurt') return tinted(back ? up(0) : frame(id, R.idle ?? 0, 0), 'rgba(255,70,70,.45)', `hurt|${id}|${back}`);
  if (pose === 'act') return side(0);
  if (pose === 'walk0' || pose === 'walk1') return back ? up(n) : side(n);
  return back ? up(0) : frame(id, R.idle ?? 0, n);
}
export const person = (u, back, pose) => drawPose(artOf(u), back, pose);
export const monster = (id, back, pose) => drawPose((MONSTERS[id] && MONSTERS[id].art) || 'greywolf', back, pose);
export const spriteOf = (id, back, pose) => drawPose(id, back, pose);
// a portrait for dialogue and menus: the gallery bust, fitted into size × size (or w × h) on black
export function portrait(u, size = 64, h = size) {
  const id = artOf(u), key = `por|${id}|${size}|${h}`;
  if (cache.has(key)) return cache.get(key);
  const c = mk(size, h), g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#0a0a12'; g.fillRect(0, 0, size, h);
  const a = ART[id];
  if (aiPor && AI[id] && AI[id].p) {
    // the painted bust covers the frame, standing on its bottom edge
    const [px, py] = AI[id].p, d = Math.max(size, h);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(aiPor, px, py, AP, AP, Math.round((size - d) / 2), h - d, d, d);
    cache.set(key, c);
  } else if (atlas && a) {
    const [px, py, pw, ph] = a.p, k = Math.min(size / pw, h / ph), dw = Math.round(pw * k), dh = Math.round(ph * k);
    g.drawImage(atlas, px, py, pw, ph, Math.round((size - dw) / 2), h - dh, dw, dh);
    cache.set(key, c);
  }
  return c;
}
export const portraitOf = (id, size = 64, h = size) => portrait({ art: id }, size, h);
