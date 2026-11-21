// Battle maps: a grid of columns, each with a height and a kind of ground, made from a theme and a seed.
// The same seed always makes the same field, so a story battle looks the same every time you fight it.
// Themes are places of the jianghu: inn courtyards, bamboo groves, docks and boats, rooftops, temples and pagodas ...
import { TERRAIN } from '../data/core.js';
import { seeded, clamp } from '../util.js';

// bands: ground by height band (low → high); amp: height scale; props: [[thing, chance]]; houses: raised blocks with roofs
const THEMES = {
  courtyard: { bands: ['stone', 'brick', 'stone', 'brick', 'stone'], amp: 1, houses: 2, roof: 'roof', props: [['lantern', 0.03], ['willow', 0.02], ['crate', 0.02]], sky: 'night' },
  village:   { bands: ['dirt', 'grass', 'grass', 'dirt', 'grass'], amp: 2, houses: 3, roof: 'roof', props: [['willow', 0.04], ['crate', 0.02]] },
  highway:   { bands: ['grass', 'grass', 'dirt', 'grass', 'stone'], amp: 2, road: true, props: [['willow', 0.04], ['rock', 0.02]] },
  bamboo:    { bands: ['moss', 'grass', 'grass', 'dirt', 'grass'], amp: 3, props: [['bamboo', 0.17], ['rock', 0.02]], sky: 'mist' },
  ridge:     { bands: ['grass', 'dirt', 'stone', 'stone', 'grass'], amp: 6, props: [['pine', 0.05], ['rock', 0.05]] },
  graveyard: { bands: ['dirt', 'moss', 'grass', 'dirt', 'moss'], amp: 2, dark: true, props: [['grave', 0.08], ['deadtree', 0.04]], sky: 'night' },
  marsh:     { bands: ['swamp', 'swamp', 'moss', 'grass', 'moss'], amp: 2, props: [['reed', 0.07], ['willow', 0.04], ['bamboo', 0.03]], sky: 'mist' },
  docks:     { builder: 'docks', bands: ['stone', 'wood', 'stone'], amp: 1, props: [['crate', 0.05], ['lantern', 0.02]], sky: 'mist' },
  boats:     { builder: 'boats', bands: ['wood'], amp: 0, props: [['crate', 0.04]], sky: 'mist' },
  pavilion:  { builder: 'pavilion', bands: ['marble', 'marble', 'stone'], amp: 1, props: [['willow', 0.03]], sky: 'mist' },
  rooftops:  { builder: 'rooftops', bands: ['brick'], amp: 0, props: [['lantern', 0.03], ['crate', 0.04]], sky: 'night' },
  temple:    { bands: ['marble', 'stone', 'marble', 'stone', 'marble'], amp: 1, houses: 2, roof: 'goldroof', props: [['pillar', 0.03], ['censer', 0.02], ['pine', 0.03]] },
  pagoda:    { builder: 'pagoda', bands: ['stone', 'marble'], amp: 1, props: [['pine', 0.04], ['censer', 0.02]] },
  hall:      { bands: ['red', 'stone', 'red', 'stone', 'red'], amp: 1, walls: true, dais: true, props: [['pillar', 0.05], ['lantern', 0.02]], sky: 'night' },
  pass:      { bands: ['grass', 'dirt', 'stone', 'stone', 'snow'], amp: 5, walls: true, props: [['pine', 0.04], ['rock', 0.04]] },
  snow:      { bands: ['ice', 'snow', 'snow', 'stone', 'snow'], amp: 5, props: [['snowpine', 0.06], ['rock', 0.02]], sky: 'snow' },
  cliff:     { bands: ['stone', 'grass', 'stone', 'stone', 'snow'], amp: 8, props: [['pine', 0.04], ['rock', 0.04]], sky: 'dusk' },
  volcano:   { bands: ['lava', 'ash', 'ash', 'stone', 'ash'], amp: 6, props: [['rock', 0.06], ['deadtree', 0.02]], sky: 'fire' },
  nether:    { bands: ['void', 'ash', 'red', 'void', 'marble'], amp: 4, props: [['pillar', 0.03], ['lantern', 0.03], ['grave', 0.02]], dark: true, sky: 'nether' },
  tomb:      { bands: ['dirt', 'stone', 'stone', 'dirt', 'stone'], amp: 4, dark: true, props: [['pillar', 0.04], ['grave', 0.04], ['rock', 0.04]], sky: 'cave' },
  cave:      { bands: ['dirt', 'stone', 'stone', 'dirt', 'stone'], amp: 6, dark: true, props: [['rock', 0.08]], sky: 'cave' },
  palace:    { bands: ['crystal', 'marble', 'water', 'crystal', 'marble'], amp: 3, props: [['coral', 0.05], ['pillar', 0.03]], sky: 'sea' },
};
// the things that stand on a tile (all block movement)
export const PROPS = ['tree', 'rock', 'pillar', 'bamboo', 'pine', 'snowpine', 'willow', 'lantern', 'grave', 'censer', 'crate', 'reed', 'deadtree', 'coral'];

// value noise on a coarse grid, smoothly blended
function noise(w, h, rnd, cell) {
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2, g = Array.from({ length: gw * gh }, () => rnd());
  const at = (x, y) => g[y * gw + x];
  return (x, y) => {
    const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx, b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

export function makeMap({ theme = 'highway', w = 12, h = 12, seed = 1, players = 5, foes = 6, treasures = 2, foeSide = 'top' } = {}) {
  for (let attempt = 0; attempt < 14; attempt++) {
    const m = build(theme, w, h, seed + attempt * 7919, players, foes, treasures, foeSide);
    if (m) return m;
  }
  // still failing: take the map and smooth it — no step taller than 2, and nothing walled in
  const m = build(theme, w, h, seed, players, foes, treasures, foeSide, true);
  for (let pass = 0; pass < 10; pass++) for (const t of m.tiles) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    if (t.x + dx >= w || t.y + dy >= h) continue;
    const n = m.tiles[(t.y + dy) * w + t.x + dx];
    if (t.h - n.h > 2) t.h = n.h + 2; else if (n.h - t.h > 2) n.h = t.h + 2;
  }
  const at = (x, y) => m.tiles[y * w + x], start = at(...m.starts[0]);
  if (!connected(m.tiles, w, h, start, [])) for (const t of m.tiles) if (t.obj) { t.obj = null; t.block = !!TERRAIN[t.t].block; }
  if (!connected(m.tiles, w, h, start, [])) for (const t of m.tiles) if (t.t === 'deep') { t.t = 'water'; t.block = false; }
  return m;
}

// ---------------------------------------------------------------- special ground plans
function plan(T, w, h, rnd, at) {
  if (T.builder === 'docks') {
    // land on the left and bottom, the river on the right, piers reaching out and moored boats
    const shore = Math.floor(w * 0.45);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = at(x, y); if (x < shore + (y % 5 === 0 ? 1 : 0) || y >= h - 3) { c.t = rnd() < 0.3 ? 'wood' : 'stone'; c.h = 1 + (x < 2 ? 1 : 0); } else { c.t = 'deep'; c.h = 0; } }
    for (let y = 1; y < h - 3; y += 3) for (let x = shore; x < w - 1; x++) { const c = at(x, y); c.t = 'wood'; c.h = 1; }
    for (let y = 2; y < h - 3; y += 6) { const bx = shore + 2 + Math.floor(rnd() * Math.max(1, w - shore - 5)); for (let yy = y; yy < y + 2; yy++) for (let xx = bx; xx < Math.min(w, bx + 3); xx++) { const c = at(xx, yy); if (c) { c.t = 'wood'; c.h = 2; } } }
    for (let x = shore; x < w; x++) { const c = at(x, h - 4); if (c && c.t === 'deep') { c.t = 'water'; } }
    // warehouses on the land
    for (let k = 0; k < 2; k++) { const bx = Math.floor(rnd() * (shore - 3)), by = 2 + Math.floor(rnd() * (h - 8)); for (let y = by; y < by + 2; y++) for (let x = bx; x < bx + 3; x++) { const c = at(x, y); if (c) { c.t = 'roof'; c.h = 3; } } }
    return;
  }
  if (T.builder === 'boats') {
    // deep water with a chain of boats joined by planks; your boat at the bottom, theirs at the top
    for (const c of at.all) { c.t = 'deep'; c.h = 0; }
    const boats = [[Math.floor(w / 2) - 3, h - 4, 6, 4], [1, Math.floor(h / 2) - 2, 4, 4], [w - 5, Math.floor(h / 2) - 1, 4, 4], [Math.floor(w / 2) - 3, 0, 6, 4]];
    for (const [bx, by, bw, bh] of boats) for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) { const c = at(x, y); if (!c) continue; c.t = 'wood'; c.h = 1 + ((x === bx + Math.floor(bw / 2) && y === by + Math.floor(bh / 2)) ? 2 : 0); }
    // cabins on the big boats
    for (const [bx, by, bw] of [boats[0], boats[3]]) { const c = at(bx + bw - 1, by + 1); if (c) { c.t = 'roof'; c.h = 3; } const d = at(bx, by + 1); if (d) { d.h = 2; } }
    const plank = (x0, y0, x1, y1) => { let x = x0, y = y0; while (x !== x1 || y !== y1) { const c = at(x, y); if (c && c.t === 'deep') { c.t = 'wood'; c.h = 1; } if (x !== x1) x += Math.sign(x1 - x); else y += Math.sign(y1 - y); } };
    const mid = (b) => [b[0] + Math.floor(b[2] / 2), b[1] + Math.floor(b[3] / 2)];
    plank(...mid(boats[0]), ...mid(boats[1])); plank(...mid(boats[0]), ...mid(boats[2])); plank(...mid(boats[1]), ...mid(boats[3])); plank(...mid(boats[2]), ...mid(boats[3]));
    // a few patches of shallows where the river runs over a sandbar
    for (let k = 0; k < 3; k++) { const c = at(Math.floor(rnd() * w), 4 + Math.floor(rnd() * (h - 8))); if (c && c.t === 'deep') c.t = 'water'; }
    return;
  }
  if (T.builder === 'pavilion') {
    // a white jade terrace over the river, reached by a bridge
    for (const c of at.all) { c.t = 'water'; c.h = 0; }
    const x0 = 2, y0 = 1, x1 = w - 3, y1 = Math.floor(h * 0.6);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = at(x, y); c.t = 'marble'; c.h = 2; }
    for (let y = y0 + 1; y < y0 + 3; y++) for (let x = Math.floor(w / 2) - 2; x <= Math.floor(w / 2) + 1; x++) { const c = at(x, y); c.t = 'roof'; c.h = 4; }
    for (let y = y1 + 1; y < h; y++) for (let x = Math.floor(w / 2) - 1; x <= Math.floor(w / 2); x++) { const c = at(x, y); c.t = 'wood'; c.h = 1; }
    for (let y = h - 3; y < h; y++) for (let x = 0; x < w; x++) { const c = at(x, y); if (c.t === 'water') { c.t = 'stone'; c.h = 1; } }
    for (const c of at.all) if (c.t === 'water' && (c.x === 0 || c.x === w - 1)) c.t = 'deep';
    return;
  }
  if (T.builder === 'rooftops') {
    // streets between blocks of houses; the roofs climb in steps of two
    for (const c of at.all) { c.t = 'brick'; c.h = 0; }
    for (let by = 1; by < h - 3; by += 4) for (let bx = (by % 8 === 1 ? 0 : 1); bx < w; bx += 4) {
      const hh = 2 + (rnd() < 0.4 ? 2 : 0), bw = 3, bd = 3;
      for (let y = by; y < Math.min(h - 3, by + bd); y++) for (let x = bx; x < Math.min(w, bx + bw); x++) { const c = at(x, y); c.t = 'roof'; c.h = hh; }
      // a ridge on top, and a stack of crates or a lower roof to climb by
      const r = at(Math.min(w - 1, bx + 1), Math.min(h - 4, by + 1)); r.h = hh + 1;
      if (hh >= 4) { const s = at(Math.min(w - 1, bx + 2), Math.min(h - 4, by + bd - 1)); if (s) s.h = 2; }
    }
    return;
  }
  if (T.builder === 'pagoda') {
    // a nine-storey pagoda in the middle of a temple yard: each ring two steps higher than the last
    for (const c of at.all) { c.t = 'stone'; c.h = 0; }
    const cx = (w - 1) / 2, cy = (h - 1) / 2 - 1;
    for (const c of at.all) {
      const d = Math.max(Math.abs(c.x - cx), Math.abs(c.y - cy));
      const ring = Math.max(0, 4 - Math.floor(d));
      if (ring > 0) { c.h = ring * 2; c.t = ring === 4 ? 'goldroof' : ring % 2 ? 'roof' : 'marble'; }
    }
    return;
  }
}

function build(theme, w, h, seed, players, foes, treasures, foeSide, force = false) {
  const T = THEMES[theme] || THEMES.highway, rnd = seeded(seed);
  const n1 = noise(w, h, rnd, 4), n2 = noise(w, h, rnd, 2), tiles = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = n1(x, y) * 0.75 + n2(x, y) * 0.25;
    const ht = Math.round(v * T.amp * 1.4);
    const band = clamp(Math.floor(v * T.bands.length), 0, T.bands.length - 1);
    tiles.push({ x, y, h: ht, t: T.bands[band] });
  }
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? tiles[y * w + x] : null);
  at.all = tiles;
  if (T.builder) plan(T, w, h, rnd, at);
  // a road down the middle
  if (T.road) { let rx = Math.floor(w / 2); for (let y = 0; y < h; y++) { for (let dx = 0; dx < 2; dx++) { const c = at(rx + dx, y); if (c) { c.t = 'dirt'; c.h = Math.min(c.h, 1); } } if (rnd() < 0.25) rx = clamp(rx + (rnd() < 0.5 ? -1 : 1), 1, w - 3); } }
  // houses: raised blocks with tiled roofs you can climb onto
  for (let k = 0; k < (T.houses || 0); k++) {
    const bw = 2 + Math.floor(rnd() * 2), bh = 2 + Math.floor(rnd() * 2), bx = 1 + Math.floor(rnd() * (w - bw - 2)), by = 3 + Math.floor(rnd() * (h - bh - 6)), hh = 2 + Math.floor(rnd() * 2);
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) { const c = at(x, y); if (c) { c.h = (c.h > 0 ? c.h : 0) + hh; c.t = T.roof || 'roof'; } }
  }
  // walls: a raised rampart with gaps (a gate every few tiles)
  if (T.walls) {
    const wy = Math.floor(h * 0.4);
    for (let x = 0; x < w; x++) { if (x % 4 === 1) continue; const c = at(x, wy); c.h += 2; c.t = 'brick'; }
  }
  // a dais at the far end of a hall
  if (T.dais) for (let y = 0; y < 2; y++) for (let x = Math.floor(w / 2) - 2; x <= Math.floor(w / 2) + 1; x++) { const c = at(x, y); if (c) { c.h = 2; c.t = 'marble'; } }
  for (const c of tiles) {
    if (TERRAIN[c.t].block) { c.block = true; if (c.t === 'deep' || c.t === 'lava') c.h = 0; }
  }
  for (const c of tiles) {
    if (c.block) continue;
    for (const [obj, p] of T.props || []) if (rnd() < p) { c.obj = obj; c.block = true; break; }
  }
  // starting zones: the players at the bottom, the foes at the top (or the sides)
  const open = (c) => c && !c.block;
  const zone = (rows, which) => {
    const out = [];
    for (const r of rows) for (let x = 0; x < w; x++) { const c = which === 'left' ? at(r, x) : which === 'right' ? at(w - 1 - r, x) : which === 'top' ? at(x, r) : at(x, h - 1 - r); if (open(c)) out.push(c); }
    return out;
  };
  let pz = zone([0, 1, 2], 'bottom'), fz = zone([0, 1, 2, 3], foeSide);
  if (foeSide === 'around') fz = [...zone([0, 1], 'top'), ...zone([0, 1], 'left'), ...zone([0, 1], 'right')].filter((c) => !pz.includes(c));
  if (pz.length < players + 1 || fz.length < foes + 1) { if (!force) return null; }
  // everyone has to be able to reach everyone (with an ordinary leap of 3, walking round water and walls)
  if (!force && !connected(tiles, w, h, pz[0], fz)) return null;
  pz.sort((a, b) => Math.abs(a.x - w / 2) + a.y * -0.1 - (Math.abs(b.x - w / 2) + b.y * -0.1));
  // leave a little room between people: take spaced-out tiles first, the rest after
  const spread = (list) => { const pick = []; for (const c of list) if (pick.every((p) => Math.max(Math.abs(p.x - c.x), Math.abs(p.y - c.y)) >= 2)) pick.push(c); return [...pick, ...list.filter((c) => !pick.includes(c))]; };
  pz = spread(pz);
  const fz2 = spread(shuffleWith([...fz], rnd)), fpick = fz2.slice(0, foes);
  // a captive's spot: among the foes, out of their way
  const captive = fz2.find((c) => !fpick.includes(c)) || fz[0];
  // where a 'reach' goal points: the highest tiles for a pagoda, else the far rows near the middle
  let goal;
  if (theme === 'pagoda') { const top = Math.max(...tiles.filter(open).map((c) => c.h)); goal = tiles.filter((c) => open(c) && c.h >= top - 1); }
  else goal = tiles.filter((c) => open(c) && c.y <= 1 && c !== captive).sort((a, b) => Math.abs(a.x - w / 2) - Math.abs(b.x - w / 2)).slice(0, 3);
  // treasure buried somewhere in the middle (only a Treasure Eye sees it shine)
  const mid = tiles.filter((c) => open(c) && c.y > 2 && c.y < h - 3 && !pz.includes(c) && !fz.includes(c));
  const loot = []; for (let k = 0; k < treasures && mid.length; k++) loot.push(mid.splice(Math.floor(rnd() * mid.length), 1)[0]);
  return { w, h, theme, dark: !!T.dark, sky: T.sky || 'day', tiles, starts: pz.slice(0, Math.max(players, 8)).map((c) => [c.x, c.y]), foeStarts: fpick.map((c) => [c.x, c.y]), treasure: loot.map((c) => [c.x, c.y]),
    goal: goal.map((c) => [c.x, c.y]), captive: captive ? [captive.x, captive.y] : null, seed };
}

const shuffleWith = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function connected(tiles, w, h, from, targets) {
  if (!from) return false;
  const seen = new Set([from.y * w + from.x]), q = [from];
  while (q.length) {
    const c = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c.x + dx, y = c.y + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const n = tiles[y * w + x]; if (n.block || seen.has(y * w + x) || Math.abs(n.h - c.h) > 2) continue;
      seen.add(y * w + x); q.push(n);
    }
  }
  // every open tile should be reachable too (walled-off pockets trap units forever)
  for (const t of tiles) if (!t.block && !seen.has(t.y * w + t.x)) return false;
  return targets.every((t) => seen.has(t.y * w + t.x));
}
export const THEME_LIST = Object.keys(THEMES);
