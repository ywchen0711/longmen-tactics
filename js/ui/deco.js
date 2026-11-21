// The pixel look of the field and the map of the jianghu: textured ground for tile tops (grey roof tiles, glazed tiles,
// lacquered floors, flagstones) and little upright things — bamboo, willows, pines, stone lanterns, graves, censers,
// crates, reeds, red pillars, coral, peaks and towns — drawn as outlined pixel sprites.
const cache = new Map();
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; }; };
const hex = (c) => { if (c.startsWith('rgb')) return c.match(/\d+/g).map(Number); const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const shade = (c, k) => { const [r, g, b] = hex(c); const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
function outline(g, w, h) {
  const d = g.getImageData(0, 0, w, h), a = d.data, out = new Uint8ClampedArray(a);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (a[i + 3]) continue;
    const n = (dx, dy) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < w && ny < h && a[(ny * w + nx) * 4 + 3] > 0; };
    if (n(1, 0) || n(-1, 0) || n(0, 1) || n(0, -1)) { out[i] = 30; out[i + 1] = 24; out[i + 2] = 20; out[i + 3] = 255; }
  }
  d.data.set(out); g.putImageData(d, 0, 0);
}
// a 32×32 ground texture from a base colour
export function groundTex(base, kind = '', variant = 0) {
  const key = `g|${base}|${kind}|${variant}`;
  if (cache.has(key)) return cache.get(key);
  const c = mk(32, 32), g = c.getContext('2d'), r = rnd(hash(base + kind) + variant * 977);
  g.fillStyle = base; g.fillRect(0, 0, 32, 32);
  const d = shade(base, -0.12), l = shade(base, 0.1);
  if (kind === 'roof' || kind === 'goldroof') {
    // rows of curved tiles with dark gaps between them
    for (let y = 0; y < 32; y += 6) { g.fillStyle = shade(base, -0.3); g.fillRect(0, y + 5, 32, 1); for (let x = (y / 6) % 2 ? 2 : 0; x < 32; x += 4) { g.fillStyle = shade(base, 0.16); g.fillRect(x, y, 2, 4); g.fillStyle = shade(base, -0.18); g.fillRect(x + 3, y, 1, 5); } }
  } else if (kind === 'red') {
    for (let x = 0; x < 32; x += 8) { g.fillStyle = shade(base, -0.25); g.fillRect(x, 0, 1, 32); g.fillStyle = shade(base, 0.12); g.fillRect(x + 1, 0, 1, 32); }
  } else {
    for (let i = 0; i < 46; i++) { g.fillStyle = r() < 0.55 ? d : l; g.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2)); }
    if (['grass', 'moss'].includes(kind)) for (let i = 0; i < 4; i++) { g.fillStyle = '#9a7a4a'; g.fillRect(Math.floor(r() * 30), Math.floor(r() * 30), 2, 1); }
    if (['brick', 'stone', 'marble'].includes(kind)) { g.fillStyle = shade(base, -0.18); const s = kind === 'stone' ? 16 : 8; for (let y = 0; y < 32; y += s) { g.fillRect(0, y + s - 1, 32, 1); for (let x = (y / s) % 2 ? s / 2 : 0; x < 32; x += s) g.fillRect(x, y, 1, s - 1); } }
    if (kind === 'wood') { g.fillStyle = shade(base, -0.25); for (let x = 0; x < 32; x += 6) g.fillRect(x, 0, 1, 32); }
    if (kind === 'crystal') { g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 28), y = Math.floor(r() * 28); g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y - 1, 1, 3); } }
  }
  cache.set(key, c);
  return c;
}
// upright sprites: { c, ax, ay, w, h } with the foot at (ax, ay)
const SIZE = { tree: [14, 20], willow: [16, 22], pine: [14, 22], snowpine: [12, 22], bamboo: [9, 26], rock: [12, 9], tuft: [8, 7], flower: [6, 5], pebble: [5, 3], peak: [30, 30], citytown: [30, 26], hut: [20, 18],
  lantern: [8, 16], grave: [10, 11], censer: [12, 11], crate: [10, 9], reed: [8, 14], deadtree: [14, 20], coral: [12, 14], pillar: [8, 28] };
export function sprite(kind, variant = 0, col = '#2a6aa0') {
  const key = `s|${kind}|${variant}|${col}`;
  if (cache.has(key)) return cache.get(key);
  const [W, H] = SIZE[kind] || [16, 16], c = mk(W, H), g = c.getContext('2d');
  const R = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  // a Chinese roof: a wide flat band with upturned eaves
  const roof = (x, y, w, h, rc) => { for (let i = 0; i < h; i++) R(x + 1 + Math.floor(i * 0.6), y + i, w - 2 - Math.floor(i * 0.6) * 2, 1, i === h - 1 ? shade(rc, -0.3) : i % 2 ? shade(rc, -0.12) : rc); R(x, y + h - 2, 2, 1, rc); R(x + w - 2, y + h - 2, 2, 1, rc); R(x, y + h - 3, 1, 1, rc); R(x + w - 1, y + h - 3, 1, 1, rc); };
  let line = true;
  switch (kind) {
    case 'tree': case 'willow': {
      const k = ['#5e8a36', '#6a9440', '#557e30'][variant % 3];
      R(7, 9, 2, 13, '#5a3e22'); R(4, 2, 8, 7, k); R(2, 4, 12, 4, k); R(5, 1, 6, 2, shade(k, 0.2));
      for (let i = 0; i < 5; i++) R(2 + i * 3, 8, 1, 6 + (i % 2) * 4, shade(k, -0.1)); // the hanging willow fronds
      line = true; break;
    }
    case 'pine': case 'snowpine': {
      const k = kind === 'snowpine' ? '#4a6a50' : '#2e5a3a';
      R(6, 12, 2, 10, '#5a3e22'); R(4, 14, 2, 1, '#5a3e22');
      // flat cloud-like layers, the way pines are painted
      R(1, 10, 12, 3, k); R(3, 6, 9, 3, k); R(5, 2, 6, 3, k); R(2, 10, 4, 1, shade(k, 0.25)); R(4, 6, 3, 1, shade(k, 0.25)); R(6, 2, 2, 1, shade(k, 0.25));
      if (kind === 'snowpine') { R(1, 10, 12, 1, '#fff'); R(3, 6, 9, 1, '#fff'); R(5, 2, 6, 1, '#fff'); }
      break;
    }
    case 'bamboo': {
      const k = ['#4e8a3a', '#5a9a44', '#447a32'][variant % 3];
      for (const [x, top] of [[2, 1], [5, 4]]) { R(x, top, 2, H - top, k); R(x, top, 1, H - top, shade(k, 0.25)); for (let y = top + 4; y < H; y += 5) R(x, y, 2, 1, shade(k, -0.35)); }
      R(0, 3, 3, 1, k); R(6, 1, 3, 1, k); R(0, 9, 2, 1, k); R(7, 7, 2, 1, k); R(7, 13, 2, 1, k);
      break;
    }
    case 'rock': R(1, 3, 10, 6, '#8e8676'); R(3, 1, 6, 3, '#a49c8c'); R(3, 1, 3, 2, '#c0b8a8'); R(7, 5, 4, 4, '#6e665a'); break;
    case 'tuft': R(1, 3, 1, 4, '#5e7a2e'); R(3, 0, 1, 7, '#6e8a36'); R(5, 2, 1, 5, '#5e7a2e'); R(6, 4, 1, 3, '#7e9a44'); line = false; break;
    case 'flower': R(2, 1, 2, 2, ['#f4f0e0', '#f0d040', '#e8808a'][variant % 3]); R(2, 3, 1, 2, '#5e7a2e'); line = false; break;
    case 'pebble': R(0, 1, 4, 2, '#9a9282'); R(1, 0, 2, 1, '#b8b0a0'); line = false; break;
    case 'peak': {
      // an ink-wash mountain: dark at the foot, pale at the top
      R(1, 20, 28, 10, '#4a4e50'); R(5, 12, 20, 9, '#5e6264'); R(9, 5, 12, 8, '#7a7e7e'); R(12, 1, 6, 5, '#9a9c98'); R(13, 0, 4, 2, '#e8e8e4'); R(15, 6, 2, 22, '#3a3e40'); R(21, 13, 3, 15, '#3a3e40');
      break;
    }
    case 'citytown': {
      // a walled town: a gate tower with a curved roof and a banner
      R(1, 14, 28, 12, '#a89a80'); R(1, 14, 28, 2, '#c8bca0'); for (let x = 1; x < 29; x += 4) R(x, 12, 2, 2, '#c8bca0');
      R(12, 19, 6, 7, '#3a2414'); R(8, 8, 14, 7, '#e8dcc0'); R(10, 10, 2, 3, '#7a2a1a'); R(18, 10, 2, 3, '#7a2a1a'); roof(5, 3, 20, 6, '#4a5260');
      R(25, 0, 1, 12, '#5a3e22'); R(26, 0, 4, 4, col);
      break;
    }
    case 'hut': R(3, 9, 14, 9, '#e0d4b8'); R(8, 12, 4, 6, '#5a3a1e'); roof(1, 3, 18, 7, '#4a5260'); break;
    case 'lantern': {
      // a stone lantern: base, post, a lit window and a little roof
      R(1, 13, 6, 3, '#8a8478'); R(3, 8, 2, 5, '#9a9488'); R(1, 5, 6, 4, '#a49e90'); R(3, 6, 2, 2, variant % 2 ? '#ffd060' : '#ffb040'); R(0, 3, 8, 2, '#7a7468'); R(2, 1, 4, 2, '#8a8478'); R(3, 0, 2, 1, '#9a9488');
      break;
    }
    case 'grave': R(1, 8, 8, 3, '#7a7466'); R(2, 1, 6, 8, '#9a9486'); R(2, 1, 6, 1, '#b4ae9e'); R(4, 3, 2, 4, '#5a5448'); R(0, 10, 10, 1, '#5e5a4e'); break;
    case 'censer': R(2, 9, 8, 2, '#6a5a3a'); R(1, 4, 10, 5, '#8a6a2a'); R(1, 4, 10, 1, '#b48a3a'); R(0, 3, 2, 2, '#8a6a2a'); R(10, 3, 2, 2, '#8a6a2a'); R(5, 0, 1, 4, '#c8c0b0'); R(7, 1, 1, 3, '#c8c0b0'); break;
    case 'crate': R(0, 2, 10, 7, '#9a6a3a'); R(0, 2, 10, 1, '#b8844a'); R(0, 5, 10, 1, '#6a4422'); R(4, 2, 1, 7, '#6a4422'); R(1, 0, 8, 2, variant % 2 ? '#c8a060' : '#8a5a2a'); break;
    case 'reed': R(1, 4, 1, 10, '#7a8a3a'); R(3, 1, 1, 13, '#8a9a44'); R(5, 3, 1, 11, '#7a8a3a'); R(3, 0, 1, 2, '#6a4a2a'); R(6, 2, 1, 2, '#6a4a2a'); line = false; break;
    case 'deadtree': R(6, 6, 2, 14, '#4a3a2a'); R(2, 4, 5, 1, '#4a3a2a'); R(2, 2, 1, 3, '#4a3a2a'); R(8, 7, 5, 1, '#4a3a2a'); R(12, 4, 1, 4, '#4a3a2a'); R(5, 1, 1, 5, '#4a3a2a'); break;
    case 'coral': R(5, 6, 2, 8, '#e0606a'); R(2, 3, 2, 6, '#e0606a'); R(8, 2, 2, 7, '#f07a7a'); R(2, 8, 4, 1, '#e0606a'); R(7, 8, 3, 1, '#e0606a'); R(1, 2, 1, 2, '#ffb0b0'); R(9, 1, 1, 2, '#ffb0b0'); break;
    case 'pillar': R(1, 26, 6, 2, '#6a6a5e'); R(2, 2, 4, 24, '#a8322a'); R(2, 2, 1, 24, '#c8524a'); R(5, 2, 1, 24, '#7a2018'); R(0, 0, 8, 2, '#c89a3a'); break;
  }
  if (line) outline(g, W, H);
  const out = { c, ax: W / 2, ay: H, w: W, h: H };
  cache.set(key, out);
  return out;
}
export const tileHash = (x, y) => hash(`${x},${y}`);
export { rnd };
