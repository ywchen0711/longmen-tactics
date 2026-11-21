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
// a 32×32 texture for ONE tile top, laid out on the tile's own grid (the map maps it onto the diamond, so every line
// runs parallel to the tile's edges): flagstones, bricks, planks and roof tiles meet the tile border exactly; natural
// ground gets a few small marks from one of four clean variants (never random smears)
export function groundTex(base, kind = '', variant = 0) {
  const key = `g|${base}|${kind}|${variant}`;
  if (cache.has(key)) return cache.get(key);
  const c = mk(32, 32), g = c.getContext('2d'), r = rnd(hash(base + kind) + variant * 977);
  const R = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
  R(0, 0, 32, 32, base);
  const dk = shade(base, -0.16), dk2 = shade(base, -0.28), lt = shade(base, 0.12), lt2 = shade(base, 0.22);
  // marks on a 4×4 lattice of 8px cells, one optional mark per cell, so they spread evenly
  const lattice = (fn, p = 0.5) => { for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) { if (r() > p) continue; fn(cx * 8 + 2 + Math.floor(r() * 4), cy * 8 + 2 + Math.floor(r() * 4)); } };
  if (kind === 'roof' || kind === 'goldroof') {
    // rows of half-round tiles running across the tile, a dark gutter under each row
    for (let y = 0; y < 32; y += 8) { R(0, y + 7, 32, 1, dk2); for (let x = 0; x < 32; x += 4) { R(x, y, 3, 6, lt); R(x, y, 1, 6, lt2); R(x + 3, y, 1, 7, dk); } }
    if (kind === 'goldroof') for (let y = 0; y < 32; y += 8) for (let x = 0; x < 32; x += 4) R(x + 1, y + 1, 1, 2, '#ffe6a0');
  } else if (kind === 'red' || kind === 'wood') {
    // floor boards: four 8px boards, a seam between each, nail heads at the ends
    for (let x = 0; x < 32; x += 8) { R(x, 0, 1, 32, dk2); R(x + 1, 0, 1, 32, lt); const off = (x / 8) % 2 ? 16 : 0; R(x + 1, off, 7, 1, dk); R(x + 3, (off + 3) % 32, 1, 1, dk2); R(x + 6, (off + 12) % 32, 2, 1, dk); }
    if (kind === 'red') { R(0, 0, 32, 1, '#c8963a'); R(0, 31, 32, 1, '#c8963a'); }
  } else if (kind === 'stone') {
    // four flagstones per tile, each a slightly different shade, mortar on the tile border too
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const k = [0, -0.06, 0.05, -0.03][(i + j * 2 + variant) % 4]; R(i * 16 + 1, j * 16 + 1, 14, 14, shade(base, k)); R(i * 16 + 1, j * 16 + 1, 14, 1, shade(base, k + 0.12)); R(i * 16 + 1, j * 16 + 14, 14, 1, shade(base, k - 0.1)); }
    R(0, 0, 32, 1, dk2); R(0, 16, 32, 1, dk2); R(0, 0, 1, 32, dk2); R(16, 0, 1, 32, dk2);
  } else if (kind === 'brick') {
    // grey bricks in a running bond, 16×8, joints lined up with the tile edges
    for (let y = 0; y < 32; y += 8) { R(0, y, 32, 1, dk2); for (let x = ((y / 8) % 2) * 8; x < 40; x += 16) { R(x % 32, y, 1, 8, dk2); R((x + 1) % 32, y + 1, 14, 1, lt); } }
  } else if (kind === 'marble') {
    // white jade slabs: one big slab with a carved border
    R(0, 0, 32, 1, dk); R(0, 0, 1, 32, dk); R(1, 1, 30, 1, lt2); R(1, 1, 1, 30, lt2); R(3, 3, 26, 26, shade(base, 0.04)); R(3, 3, 26, 1, dk); R(3, 3, 1, 26, dk); R(4, 28, 25, 1, lt2); R(28, 4, 1, 25, lt2);
  } else if (kind === 'crystal') {
    R(0, 0, 32, 1, dk); R(0, 0, 1, 32, dk); for (let i = 0; i < 32; i++) { R(i, i, 1, 1, lt2); R(31 - i, i, 1, 1, lt); } R(6, 10, 3, 1, '#ffffff'); R(7, 9, 1, 3, '#ffffff');
  } else if (kind === 'ice') {
    R(0, 0, 32, 1, lt2); R(0, 0, 1, 32, lt2); for (let i = 4; i < 14; i++) R(i, 18 - i, 1, 1, '#ffffff'); for (let i = 18; i < 26; i++) R(i, 40 - i, 1, 1, lt2);
  } else if (kind === 'void') {
    lattice((x, y) => { R(x, y, 3, 1, '#6a3a7a'); R(x + 1, y + 1, 1, 2, '#6a3a7a'); }, 0.25);
  } else if (kind === 'water' || kind === 'deep' || kind === 'lava') {
    // drawn live
  } else {
    // natural ground: grass blades / pebbles / snow glints in an even lattice, plus a soft patch of colour
    R(4 + (variant % 2) * 12, 4 + (variant >> 1) * 12, 12, 12, shade(base, 0.04));
    if (kind === 'grass' || kind === 'moss') {
      lattice((x, y) => { R(x, y, 1, 3, dk2); R(x + 2, y + 1, 1, 2, dk2); R(x + 1, y - 1, 1, 3, lt2); }, 0.55);
      if (variant === 1) { R(21, 9, 2, 2, '#f0e6c8'); R(9, 23, 2, 2, '#f0c84a'); }
      if (variant === 3) { R(12, 14, 2, 2, '#e8909a'); }
    } else if (kind === 'swamp') {
      lattice((x, y) => { R(x, y, 4, 1, shade(base, -0.2)); R(x + 1, y + 1, 2, 1, '#7a9a6a'); }, 0.4);
    } else if (kind === 'snow') {
      lattice((x, y) => { R(x, y, 2, 1, '#ffffff'); R(x + 1, y + 2, 1, 1, '#c8d4e2'); }, 0.45);
    } else {
      // earth, sand, ash: pebbles with a lit top
      lattice((x, y) => { R(x, y + 1, 3, 1, dk); R(x, y, 2, 1, lt); }, 0.45);
    }
  }
  cache.set(key, c);
  return c;
}
// upright sprites: { c, ax, ay, w, h } with the foot at (ax, ay)
const SIZE = { tree: [14, 20], willow: [16, 22], pine: [14, 22], snowpine: [12, 22], bamboo: [15, 28], rock: [12, 9], tuft: [8, 7], flower: [6, 5], pebble: [5, 3], peak: [30, 30], citytown: [30, 26], hut: [20, 18],
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
      // a clump of three straight culms, nodes every five pixels, leaves in short level sprays
      const k = ['#4e8a3a', '#5a9a44', '#447a32'][variant % 3], tops = [[[2, 6], [6, 1], [10, 4]], [[2, 3], [6, 0], [10, 6]], [[2, 5], [6, 2], [10, 1]]][variant % 3];
      for (const [x, top] of tops) { R(x, top, 2, H - top, k); R(x, top, 1, H - top, shade(k, 0.25)); for (let y = top + 4; y < H - 1; y += 5) R(x, y, 2, 1, shade(k, -0.35)); }
      for (const [x, top] of tops) { R(x - 2, top + 3, 2, 1, shade(k, 0.1)); R(x + 2, top + 2, 3, 1, shade(k, 0.1)); R(x + 2, top + 9, 2, 1, k); }
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
