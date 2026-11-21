// 龍門戰記 Longmen Tactics: title, the map of the jianghu, towns, the story, battles and the hidden labyrinths.
import { sprite as deco, rnd as drnd } from './ui/deco.js';
import { T, EN, LANG, setLang } from './i18n.js';
import { el, clear, $ui, menu, modal, toast, pushKeys, wait, sheet } from './ui/dom.js';
import { runBattle } from './ui/battleui.js';
import { playLines, chapterCard, rollEnding } from './ui/scene.js';
import { partyScreen, formation, uname, itemLabel, gearLine } from './ui/party.js';
import { portrait, person, SPR_W, SPR_H, SPR_SCALE, artReady } from './ui/sprites.js';
import { S, setS, save, load, newGame, initCloud, bagAdd, bagTake, flag, setFlag } from './state.js';
import { EVENTS, EVENT, CHAPTERS, CAST, ENDING, nextEvent, RECRUIT_NAMES } from './data/story.js';
import { NODES, LINKS, OPEN_BY_CH, LABYRINTHS, QUESTS } from './data/world.js';
import { JOBS, JOB_LIST, ABILITIES } from './data/jobs.js';
import { ITEMS, CONSUMABLES, GEAR, shopStock, consumablesFor } from './data/items.js';
import { MONSTERS } from './data/monsters.js';
import { makeMap } from './core/mapgen.js';
import { makeUnit, dressFoe, gainJp, HAIR, SKIN } from './core/unit.js';
import { music, sfx, toggleMute, isMuted, unlock, isMusicMuted, toggleMusic } from './audio.js';
import { makeOne, castUnit, rollTreasure as roll, tierFor } from './core/build.js';
import { journal, objective } from './ui/journal.js';
import { seeded, pick, clamp, r0, hashStr, shuffle } from './util.js';

const cv = document.getElementById('view');
// ?test=1: the automated play-through (tools/autorun) - the company is kept at the level each story battle expects
const TEST = /[?&]test=1/.test(location.search);
const MAX_ROSTER = 20;
let busy = false;

// ---------------------------------------------------------------- small helpers
const avgLv = () => { const r = S.roster.filter((u) => !u.mon); const top = [...r].sort((a, b) => b.lv - a.lv).slice(0, 5); return top.reduce((s, u) => s + u.lv, 0) / Math.max(1, top.length); };
const opened = () => { const out = new Set(); for (let c = 0; c <= Math.min(S.ch, OPEN_BY_CH.length - 1); c++) for (const id of OPEN_BY_CH[c]) out.add(id); for (const [id, n] of Object.entries(NODES)) if (n.kind === 'hidden' && flag(n.unlock)) out.add(id); for (const id of S.visited || []) out.add(id); out.add(S.node); return out; };
const neighbours = (id) => LINKS.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a));
// legendary pieces that are only found as buried treasure
const RESERVED = new Set([...QUESTS.flatMap((q) => q.reward.items || []), ...Object.values(LABYRINTHS).flatMap((l) => l.prize.items || []), ...EVENTS.flatMap((e) => [...((e.give && e.give.items) || []), ...((e.battle && e.battle.foes) || []).flatMap((f) => f.drops || [])])]);
const LEG_POOL = GEAR.filter((g) => g.legend && !RESERVED.has(g.id)).map((g) => g.id);

// ---------------------------------------------------------------- the canvas behind menus: stars and a slow drift
let bgOn = true;
function backdrop() {
  const g = cv.getContext('2d'); let t = 0, last = 0;
  const loop = (now) => {
    if (!bgOn) return;
    requestAnimationFrame(loop);
    if (now - last < 33) return; last = now;          // 30 fps is plenty for drifting mist
    cv.width = innerWidth; cv.height = innerHeight; t += 0.033;
    const W = cv.width, H = cv.height;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#e8dcc0'); gr.addColorStop(0.55, '#d4c6a2'); gr.addColorStop(1, '#a89878'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // a red sun, then three ranges of ink mountains, farthest first
    g.fillStyle = 'rgba(190,60,40,.75)'; g.beginPath(); g.arc(W * 0.78, H * 0.22, Math.min(W, H) * 0.07, 0, Math.PI * 2); g.fill();
    [[0.42, 'rgba(90,96,100,.35)', 0.0007, 90], [0.56, 'rgba(60,66,70,.55)', 0.0011, 70], [0.72, 'rgba(30,34,38,.8)', 0.0016, 50]].forEach(([y0, col, f, amp], k) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) { const y = H * y0 - Math.abs(Math.sin(x * f * 3 + k * 2) * amp + Math.sin(x * f * 7 + k) * amp * 0.4); g.lineTo(x, y); }
      g.lineTo(W, H); g.fill();
    });
    // drifting mist bands
    for (let i = 0; i < 5; i++) { const y = H * (0.45 + i * 0.09), x = ((t * (12 + i * 4) + i * 300) % (W + 600)) - 300; g.save(); g.translate(x, y); g.scale(1, 0.22); const m = g.createRadialGradient(0, 0, 0, 0, 0, 260); m.addColorStop(0, 'rgba(245,240,228,.5)'); m.addColorStop(1, 'rgba(245,240,228,0)'); g.fillStyle = m; g.beginPath(); g.arc(0, 0, 260, 0, Math.PI * 2); g.fill(); g.restore(); }
    // a pine on a rock in the corner
    g.fillStyle = 'rgba(20,22,24,.85)'; g.fillRect(W * 0.08, H * 0.62, 6, H * 0.2);
    for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(W * 0.08 + 3 + (k % 2 ? 26 : -22), H * 0.62 + k * 18, 40 - k * 4, 9, 0, 0, Math.PI * 2); g.fill(); }
  };
  bgOn = true; requestAnimationFrame(loop);
}
const stopBackdrop = () => { bgOn = false; };

// ---------------------------------------------------------------- title
function title() {
  backdrop(); music('title');
  const ui = clear(), has = load();
  const scr = el('div', { class: 'screen title-screen' }, el('div', { class: 'logo' }, T('龍門戰記', 'LONGMEN')), el('div', { class: 'sub' }, T('LONGMEN TACTICS ・ 八派戰旗', 'T A C T I C S ・ The Eight Banners')));
  const box = el('div', {}); scr.append(box); ui.append(scr);
  const items = [...(has ? [{ label: T('繼續', 'Continue'), v: 'cont', right: `${T(CHAPTERS[Math.min(has.ch, CHAPTERS.length - 1)].title).split(/[　:]/)[0]}` }] : []), { label: T('新的遊戲', 'New Game'), v: 'new' }, { label: EN ? '中文' : 'English', v: 'lang' },
    { label: T('音樂：', 'Music: ') + (isMusicMuted() ? T('關', 'off') : T('開', 'on')), v: 'music' }, { label: T('音效：', 'Sound: ') + (isMuted() ? T('關', 'off') : T('開', 'on')), v: 'mute' }];
  menu(box, items, { cancel: false }).then(async (i) => {
    unlock();
    const v = items[i].v;
    if (v === 'lang') return setLang(EN ? 'zh' : 'en');
    if (v === 'mute') { toggleMute(); return title(); }
    if (v === 'music') { toggleMusic(); return title(); }
    if (v === 'cont') { setS(has); return world(); }
    if (has && await modal(el('div', {}, T('開始新的遊戲？目前的存檔會被覆蓋。', 'Start a new game? Your save will be overwritten.')), [T('開始', 'Start'), T('取消', 'Cancel')]) !== 0) return title();
    setS(newGame(T('奕叡', 'Yi Rui'))); save();
    await chapterCard(CHAPTERS[0]);
    S.node = EVENTS[0].at;
    playEvent(EVENTS[0]);
  });
}

// ---------------------------------------------------------------- the world map
function world() {
  stopBackdrop(); busy = false; music('world');
  const ui = clear(), open = opened(), next = nextEvent(S.done);
  S.visited = [...new Set([...(S.visited || []), S.node])];
  let selected = S.node;
  const scr = el('div', { class: 'screen' });
  const chapter = CHAPTERS[Math.min(S.ch, CHAPTERS.length - 1)];
  const top = el('div', { class: 'topbar' }, el('span', { class: 'title' }, T(chapter.title)), el('span', { class: 'small', style: { color: '#ffe9a8', cursor: 'pointer' }, onclick: () => go(() => journal(world)) }, objective()), el('span', { class: 'sp' }), el('span', { class: 'gold' }, `${S.gold} ${T('兩', 'taels')}`),
    el('button', { class: 'btn', onclick: () => go(() => partyScreen(world)) }, T('隊伍', 'Company')), el('button', { class: 'btn', onclick: () => go(() => journal(world)) }, T('記錄', 'Journal')), el('button', { class: 'btn', onclick: () => go(() => bagScreen()) }, T('背包', 'Bag')),
    el('button', { class: 'btn', onclick: () => { save(); toast(T('已存檔', 'Saved')); } }, T('存檔', 'Save')), el('button', { class: 'btn', onclick: () => go(() => title()) }, T('標題', 'Title')));
  const mapBox = el('div', { class: 'worldmap' }), info = el('div', { class: 'panel nodeinfo' });
  scr.append(top, mapBox); mapBox.append(info); ui.append(scr);
  const g = cv.getContext('2d');
  let alive = true, t = 0, landCache = null;
  // walking along a road: { a, b, k (0-1), route (the places still ahead) }; dust left behind
  let walk = null, dust = [], flash = 0;
  const go = (fn) => { alive = false; off(); fn(); };
  const off = pushKeys((k) => { if (k === 'back') go(() => partyScreen(world)); });
  // layout: the 1000 × 700 world scaled into the map area
  const box = () => { const r = mapBox.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const P = (n) => { const b = box(), s = Math.min(b.w / 1040, b.h / 740); return [b.x + (b.w - 1000 * s) / 2 + n.x * s, b.y + (b.h - 700 * s) / 2 + n.y * s, s]; };
  const draw = () => {
    if (!alive) return;
    const now = performance.now(), dt = Math.min(0.05, (now - (draw.last || now)) / 1000); draw.last = now;
    t += dt; cv.width = innerWidth; cv.height = innerHeight;
    g.fillStyle = '#d9c9a3'; g.fillRect(0, 0, cv.width, cv.height);
    // the land, drawn once per size: blurred patches of each place's ground, then fog over places not yet reached
    const b = box(), s = Math.min(b.w / 1040, b.h / 740);
    if (!landCache || landCache.w !== cv.width || landCache.h !== cv.height || landCache.n !== open.size) landCache = paintLand(P, s, open);
    g.drawImage(landCache.c, 0, 0);
    // roads
    for (const [a, c] of LINKS) {
      const A = NODES[a], C = NODES[c]; if (!open.has(a) && !open.has(c)) continue;
      const [x1, y1] = P(A), [x2, y2] = P(C), both = open.has(a) && open.has(c);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = both ? 'rgba(60,40,24,.55)' : 'rgba(60,40,24,.2)'; g.lineWidth = 5; g.stroke();
      g.strokeStyle = both ? '#f2e4c0' : 'rgba(242,228,192,.4)'; g.lineWidth = 2.5; g.setLineDash([7, 4]); g.stroke(); g.setLineDash([]);
    }
    // places
    const labels = [];
    for (const [id, n] of Object.entries(NODES)) {
      if (!open.has(id)) continue;
      const [x, y] = P(n), r = 9 + (n.kind === 'town' ? 3 : 0);
      g.fillStyle = n.kind === 'town' ? '#e8c46a' : n.kind === 'hidden' ? '#9a5ad0' : n.kind === 'site' ? '#c8443a' : '#4a8a4a';
      g.strokeStyle = '#000'; g.lineWidth = 2;
      g.strokeStyle = '#2e1e12'; g.lineWidth = 3;
      if (n.kind === 'town') { const o = deco('citytown', 0, '#2a6aa0'), k = 1.4; g.drawImage(o.c, Math.round(x - o.ax * k), Math.round(y + 8 - o.ay * k), o.w * k, o.h * k); }
      else if (n.kind === 'hidden') { g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * 0.5 : r * 1.3; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); }
      else { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke(); }
      if (id === selected) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r + 6 + Math.sin(t * 4) * 2, 0, Math.PI * 2); g.stroke(); }
      labels.push({ id, name: T(n.name), x, below: y + r + 16, above: y - r - 8 });
      if (next && next.at === id) { g.fillStyle = '#ff5a4a'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('!', x, y - r - 8 + Math.sin(t * 5) * 3); }
      g.textAlign = 'left';
    }
    // the road still ahead glows while walking
    if (walk && walk.route.length) {
      g.strokeStyle = `rgba(255,230,140,${0.55 + Math.sin(t * 6) * 0.25})`; g.lineWidth = 4; g.setLineDash([10, 8]); g.lineDashOffset = -t * 40;
      g.beginPath(); const [sx, sy] = here(); g.moveTo(sx, sy); for (const id of walk.route) { const [rx, ry] = P(NODES[id]); g.lineTo(rx, ry); } g.stroke(); g.setLineDash([]);
    }
    // the company: the hero walking, the banner beside, dust behind
    const [px, py] = here(), moving = !!walk;
    if (moving && Math.random() < 0.5) dust.push({ x: px + (Math.random() - 0.5) * 8, y: py + 2, t: 0 });
    for (const d of dust) { d.t += dt; g.fillStyle = `rgba(220,200,160,${Math.max(0, 0.5 - d.t)})`; g.beginPath(); g.arc(d.x, d.y - d.t * 10, 3 + d.t * 8, 0, Math.PI * 2); g.fill(); }
    dust = dust.filter((d) => d.t < 0.5);
    const hero = S.roster.find((u) => u.who === 'yirui') || S.roster[0];
    const dx = walk ? P(NODES[walk.b])[0] - P(NODES[walk.a])[0] : 1, dy = walk ? P(NODES[walk.b])[1] - P(NODES[walk.a])[1] : 1;
    const back = moving && dy < -Math.abs(dx) * 0.6, flip = dx > 0;
    const pose = moving ? (Math.floor(t * 8) % 2 ? 'walk0' : 'walk1') : (Math.floor(t * 2) % 2 ? 'idle0' : 'idle1');
    const img = person(hero, back, pose), sc = SPR_SCALE * 1.15, w = SPR_W * sc, h = SPR_H * sc, hop = moving ? Math.abs(Math.sin(t * 16)) * 3 : 0;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(px, py + 1, 12, 4, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.imageSmoothingEnabled = false; g.translate(px, py - hop); if (flip) g.scale(-1, 1); g.drawImage(img, -w / 2, -h + 4, w, h); g.restore();
    const fx = px + (flip ? -16 : 16), fy = py - hop;
    g.fillStyle = '#5a3a1a'; g.fillRect(fx - 1, fy - 52, 3, 46); g.fillStyle = '#2a6aa0'; g.beginPath(); g.moveTo(fx + 2, fy - 52); g.lineTo(fx + 24, fy - 46 + Math.sin(t * (moving ? 9 : 3)) * 3); g.lineTo(fx + 2, fy - 38); g.fill(); g.strokeStyle = '#d8e8ff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(fx + 5, fy - 49); g.lineTo(fx + 16, fy - 43); g.stroke();
    // the names, over the company's banner: kept inside the map (a long English name at the edge was cut off) and, on a small map, moved above the
    // place or left out where they would print over another name (the chosen place and the next goal go first)
    { const fs = Math.max(12, 13 * s * 1.25), placed = [];
      g.font = `900 ${fs}px "Noto Sans TC", sans-serif`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 4;
      const rank = (L) => (L.id === selected ? 2 : 0) + (next && next.at === L.id ? 1 : 0);
      for (const L of labels.sort((a, c) => rank(c) - rank(a))) {
        const w = g.measureText(L.name).width + 6, x = Math.max(b.x + w / 2 + 2, Math.min(b.x + b.w - w / 2 - 2, L.x));
        const rect = (by) => [x - w / 2, by - fs, x + w / 2, by + fs * 0.25];
        const free = (by) => { const q = rect(by); return placed.every((o) => q[2] <= o[0] || q[0] >= o[2] || q[3] <= o[1] || q[1] >= o[3]); };
        let by = [L.below, L.above].find(free); if (by == null) { if (!rank(L)) continue; by = L.below; }
        placed.push(rect(by)); g.strokeStyle = 'rgba(245,236,214,.95)'; g.strokeText(L.name, x, by); g.fillStyle = '#2a1e14'; g.fillText(L.name, x, by);
      }
      g.textAlign = 'left'; }
    // an ambush: the screen flashes red
    if (flash > 0) { flash = Math.max(0, flash - 0.016); g.fillStyle = `rgba(200,30,30,${flash * 0.9})`; g.fillRect(0, 0, cv.width, cv.height); }
    requestAnimationFrame(draw);
  };
  // where the company stands right now (between two places while walking)
  function here() {
    if (!walk) return P(NODES[S.node]);
    const [ax, ay] = P(NODES[walk.a]), [bx, by] = P(NODES[walk.b]), k = walk.k, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    return [ax + (bx - ax) * e, ay + (by - ay) * e];
  }
  draw();
  const pickNode = (e) => { let best = null, bd = 30; for (const [id, n] of Object.entries(NODES)) { if (!open.has(id)) continue; const [x, y] = P(n), d = Math.hypot(e.clientX - x, e.clientY - y); if (d < bd) { bd = d; best = id; } } return best; };
  mapBox.addEventListener('click', (e) => { if (e.target !== mapBox || walk) return; const id = pickNode(e); if (id) { selected = id; showInfo(); } });
  function showInfo() {
    const n = NODES[selected], here = selected === S.node;
    const acts = [];
    if (!here) acts.push(el('button', { class: 'btn primary', onclick: () => travel(selected) }, T('前往', 'Travel here')));
    else {
      if (next && next.at === selected) acts.push(el('button', { class: 'btn primary', onclick: () => go(() => playEvent(next)) }, T(`▶ ${T(next.name)}`, `▶ ${T(next.name)}`)));
      if (n.kind === 'town') acts.push(el('button', { class: 'btn', onclick: () => go(() => town(selected)) }, T('進入城鎮', 'Enter town')));
      if (n.kind === 'field') acts.push(el('button', { class: 'btn', onclick: () => go(() => patrol(selected)) }, T('巡邏（遭遇戰）', 'Patrol (skirmish)')));
      if (n.kind === 'hidden') acts.push(el('button', { class: 'btn primary', onclick: () => go(() => labyrinth(n.lab)) }, T('進入迷宮', 'Enter the labyrinth')));
    }
    const lab = n.kind === 'hidden' && LABYRINTHS[n.lab];
    clear(info).append(el('div', { class: 'title' }, T(n.name)), n.desc ? el('div', { class: 'small', style: { margin: '4px 0' } }, T(n.desc)) : lab ? el('div', { class: 'small', style: { margin: '4px 0' } }, T(lab.desc)) : null,
      n.lv ? el('div', { class: 'small dim' }, T(`敵人等級 約 ${Math.max(n.lv, Math.round(avgLv() - 1))}`, `Foes around Lv ${Math.max(n.lv, Math.round(avgLv() - 1))}`)) : null,
      lab ? el('div', { class: 'small dim' }, T(`已到達 ${S.labyrinth[n.lab] || 0} / ${lab.floors} 層`, `Reached floor ${S.labyrinth[n.lab] || 0} / ${lab.floors}`)) : null,
      next && next.at === selected && !here ? el('div', { class: 'small', style: { color: '#ff9a8a' } }, T('劇情在這裡繼續', 'The story continues here')) : null,
      el('div', { class: 'row', style: { marginTop: '8px' } }, acts));
  }
  showInfo();
  window.__travel = (id) => travel(id);
  // walk the roads one place at a time; wild places may jump you on the way
  async function travel(dest) {
    const prev = new Map([[S.node, null]]), q = [S.node];
    while (q.length) { const c = q.shift(); for (const nb of neighbours(c)) if (open.has(nb) && !prev.has(nb)) { prev.set(nb, c); q.push(nb); } }
    if (!prev.has(dest)) return toast(T('還去不了那裡。', 'You can\'t get there yet.'));
    const path = []; for (let c = dest; c; c = prev.get(c)) path.unshift(c);
    clear(info).append(el('div', { class: 'title' }, T(`前往 ${T(NODES[dest].name)}…`, `Travelling to ${T(NODES[dest].name)}…`)));
    for (let i = 1; i < path.length; i++) {
      // walk the road: longer roads take a little longer
      const [ax, ay] = P(NODES[path[i - 1]]), [bx, by] = P(NODES[path[i]]), ms = Math.max(380, Math.min(950, Math.hypot(bx - ax, by - ay) * 4));
      walk = { a: path[i - 1], b: path[i], k: 0, route: path.slice(i) };
      const t0 = performance.now();
      while (walk.k < 1) { await wait(16); if (!alive) return; walk.k = Math.min(1, (performance.now() - t0) / ms); }
      S.node = path[i]; S.visited = [...new Set([...(S.visited || []), S.node])]; sfx('turn');
      walk = path[i + 1] ? { a: path[i], b: path[i + 1], k: 0, route: path.slice(i + 1) } : null;
      const n = NODES[S.node];
      if (i < path.length - 1 && n.kind === 'field' && Math.random() < 0.22) {
        walk = null; flash = 0.8; sfx('hurt'); save(); await wait(700);
        return go(() => patrol(S.node, true));
      }
    }
    walk = null;
    save(); selected = S.node; showInfo();
  }
}

const BIOME = { bamboo: '#6e9a52', ridge: '#8a9a5a', graveyard: '#7a7a5e', marsh: '#5e7a52', docks: '#9ab0a8', boats: '#8ab0b8', pavilion: '#a8c0c0', rooftops: '#b4a88a', temple: '#c0b08a', pagoda: '#b8a47a', hall: '#a0705a',
  pass: '#9a9478', snow: '#e8ecee', cliff: '#9a9688', volcano: '#a0644a', nether: '#6a5a72', courtyard: '#b8a882', highway: '#a8a470', village: '#a0a064' };
// the river that gives the Cold River its name, in map coordinates
const RIVER = [[1000, 420], [930, 470], [850, 520], [760, 545], [690, 570], [650, 630], [610, 700]];
function paintLand(P, s, open) {
  const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const g = c.getContext('2d');
  g.fillStyle = '#d9c9a3'; g.fillRect(0, 0, c.width, c.height);
  // paper grain
  { const r = drnd(99); for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,70,40,.06)' : 'rgba(255,250,235,.10)'; g.fillRect(Math.floor(r() * c.width), Math.floor(r() * c.height), 2 + Math.floor(r() * 3), 1); } }
  // soft washes of each place's ground (radial gradients: Safari ignores canvas filters)
  const blob = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  for (const n of Object.values(NODES)) { const [x, y] = P(n); blob(x, y, 120 * s, rgba(BIOME[n.theme] || '#a8a470', 0.55)); }
  // the Cold River and its tributary canal
  const line = (pts, wdt, col) => { g.strokeStyle = col; g.lineWidth = wdt; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = P({ x, y }); if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke(); };
  line(RIVER, 26 * s, 'rgba(70,110,130,.35)'); line(RIVER, 14 * s, 'rgba(80,130,160,.75)'); line(RIVER, 4 * s, 'rgba(220,235,240,.5)');
  line([[530, 500], [600, 540], [690, 570]], 8 * s, 'rgba(80,130,160,.6)');
  // ink mountains near the high places, bamboo and pines around the green ones
  { const r = drnd(777), things = [];
    for (const n of Object.values(NODES)) { const [x, y] = P(n), high = ['snow', 'cliff', 'pass', 'volcano', 'ridge', 'nether'].includes(n.theme);
      for (let k = 0; k < (high ? 4 : 6); k++) { const a = r() * Math.PI * 2, d = (45 + r() * 50) * s, tx = x + Math.cos(a) * d, ty = y + Math.sin(a) * d * 0.8; things.push({ y: ty, kind: high ? 'peak' : n.theme === 'snow' ? 'snowpine' : n.theme === 'bamboo' || n.theme === 'marsh' ? 'bamboo' : r() < 0.5 ? 'pine' : 'willow', x: tx, v: Math.floor(r() * 3) }); } }
    for (const t of things.sort((a, b) => a.y - b.y)) { const o = deco(t.kind, t.v), k = Math.max(1, s * (t.kind === 'peak' ? 1.6 : 1.8)); g.drawImage(o.c, Math.round(t.x - o.ax * k), Math.round(t.y - o.ay * k), Math.round(o.w * k), Math.round(o.h * k)); } }
  // a border like a painted scroll
  g.strokeStyle = 'rgba(120,40,30,.55)'; g.lineWidth = 6; g.strokeRect(8, 8, c.width - 16, c.height - 16); g.strokeStyle = 'rgba(120,40,30,.3)'; g.lineWidth = 2; g.strokeRect(16, 16, c.width - 32, c.height - 32);
  // fog over the unknown
  for (const [id, n] of Object.entries(NODES)) if (!open.has(id)) { const [x, y] = P(n); const gr = g.createRadialGradient(x, y, 0, x, y, 110 * s); gr.addColorStop(0, 'rgba(70,60,48,.78)'); gr.addColorStop(1, 'rgba(70,60,48,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 110 * s, 0, Math.PI * 2); g.fill(); }
  return { c, w: cv.width, h: cv.height, n: open.size };
}
// ---------------------------------------------------------------- the bag
function bagScreen() {
  const ui = clear(), list = el('div', { class: 'list' });
  const ids = Object.keys(S.bag).sort((a, b) => (ITEMS[a] ? 1 : 0) - (ITEMS[b] ? 1 : 0) || ((ITEMS[b] && ITEMS[b].tier) || 0) - ((ITEMS[a] && ITEMS[a].tier) || 0));
  for (const id of ids) list.append(el('div', { class: 'item' }, el('div', { class: 'grow' }, el('div', { class: 'nm' }, `${itemLabel(id)} ×${S.bag[id]}`), ITEMS[id] ? el('div', { class: 'small dim' }, gearLine(ITEMS[id]) + (ITEMS[id].note ? ' — ' + T(ITEMS[id].note) : '')) : null)));
  const scr = el('div', { class: 'screen', style: { background: '#0c0d18' } }, el('div', { class: 'topbar' }, el('span', { class: 'title' }, T('背包', 'Bag')), el('span', { class: 'sp' }), el('span', { class: 'gold' }, `${S.gold} ${T('兩', 'taels')}`), el('button', { class: 'btn', onclick: () => { off(); world(); } }, T('返回', 'Back'))), el('div', { class: 'cols' }, el('div', { class: 'panel scroll', style: { flex: 1 } }, ids.length ? list : el('div', { class: 'dim' }, T('空空如也', 'Empty')))));
  ui.append(scr); const off = pushKeys((k) => { if (k === 'back') { off(); world(); } });
}

// ---------------------------------------------------------------- towns: shop and tavern
function town(id) {
  const n = NODES[id], ui = clear(); music('town');
  const tier = clamp(Math.max(n.tier || 1, S.ch * 2 + 1), 1, 10);
  let tab = 'buy', cat = 'w';
  const scr = el('div', { class: 'screen', style: { background: 'radial-gradient(ellipse at 50% 0%, #3a2a1a, #0c0d18 70%)' } });
  const gold = el('span', { class: 'gold' });
  const top = el('div', { class: 'topbar' }, el('span', { class: 'title' }, T(n.name)), el('span', { class: 'sp' }), gold, el('button', { class: 'btn', onclick: () => { off(); partyScreen(() => town(id)); } }, T('隊伍', 'Company')), el('button', { class: 'btn', onclick: () => { off(); save(); world(); } }, T('離開', 'Leave')));
  const body = el('div', { class: 'panel scroll', style: { flex: 1, minWidth: 0 } });
  scr.append(top, el('div', { class: 'cols' }, body)); ui.append(scr);
  const off = pushKeys((k) => { if (k === 'back') { off(); save(); world(); } });
  const draw = () => {
    gold.textContent = `${S.gold} ${T('兩', 'taels')}`;
    const tabs = el('div', { class: 'tabs' }, [['buy', T('購買', 'Buy')], ['sell', T('販賣', 'Sell')], ['tavern', T('茶館', 'Teahouse')]].map(([k, l]) => el('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; draw(); } }, l)));
    clear(body).append(tabs);
    if (tab === 'buy') {
      const cats = [['w', T('兵器', 'Weapons')], ['b', T('衣甲', 'Armour')], ['a', T('佩飾', 'Trinkets')], ['i', T('丹藥', 'Pills')]];
      body.append(el('div', { class: 'tabs' }, cats.map(([k, l]) => el('button', { class: cat === k ? 'on' : '', onclick: () => { cat = k; draw(); } }, l))));
      const stock = cat === 'i' ? consumablesFor(tier).map((c) => c.id) : shopStock(tier).filter((g) => (cat === 'w' ? g.slot === 'w' : cat === 'a' ? g.slot === 'a' : ['s', 'h', 'b'].includes(g.slot))).sort((a, b) => a.type.localeCompare(b.type) || a.tier - b.tier).map((g) => g.id);
      body.append(el('div', { class: 'list' }, stock.map((sid) => {
        const it = ITEMS[sid] || CONSUMABLES[sid], price = it.price;
        const who = ITEMS[sid] ? S.roster.filter((u) => !u.mon && (JOBS[u.job].eq.includes(it.type) || it.type === 'acc')).length : null;
        return el('div', { class: 'item' }, el('div', { class: 'grow' }, el('div', { class: 'nm' }, T(it.name) + (S.bag[sid] ? ` (${T('持有', 'have')} ${S.bag[sid]})` : '')), el('div', { class: 'small dim' }, ITEMS[sid] ? `${gearLine(it)}${who != null ? T(` · 目前職業可裝備 ${who} 人`, ` · ${who} can equip now`) : ''}` : describeConsumable(it))),
          el('button', { class: 'btn', disabled: S.gold < price || null, onclick: () => { S.gold -= price; bagAdd(sid); sfx('ok'); draw(); } }, `${price} ${T('兩', 'taels')}`));
      })));
    } else if (tab === 'sell') {
      const ids = Object.keys(S.bag).filter((k) => (ITEMS[k] && ITEMS[k].price) || (CONSUMABLES[k] && CONSUMABLES[k].price));
      body.append(el('div', { class: 'list' }, ids.length ? ids.map((sid) => { const it = ITEMS[sid] || CONSUMABLES[sid], p = Math.floor(it.price / 2); return el('div', { class: 'item' }, el('div', { class: 'grow' }, el('div', { class: 'nm' }, `${T(it.name)} ×${S.bag[sid]}`)), el('button', { class: 'btn', onclick: () => { bagTake(sid); S.gold += p; sfx('ok'); draw(); } }, `${T('賣', 'Sell')} ${p} ${T('兩', 'taels')}`)); }) : el('div', { class: 'dim' }, T('沒有可以賣的東西。', 'Nothing to sell.'))));
    } else tavern(id, body, draw);
  };
  draw();
}
const describeConsumable = (c) => [c.h ? (c.h[0] === 'pct' ? T('完全回復 HP', 'Fully heals HP') : T(`回復 ${c.h[1]} HP`, `Restores ${c.h[1]} HP`)) : '', c.mph ? T(`回復 ${c.mph >= 999 ? '全部' : c.mph} 內力`, `Restores ${c.mph >= 999 ? 'all' : c.mph} Qi`) : '', c.rev ? T('使倒下的同伴復活', 'Revives a fallen ally') : '', c.cure ? T('解開穴道與異常', 'Cures ailments and sealed points') : ''].filter(Boolean).join(' · ');
// a tavern: hire hands, take jobs, hear rumours
function tavern(id, body, redraw) {
  const avg = avgLv(), seed = hashStr(id) + (S.battles || 0) * 7, rnd = seeded(seed);
  S.hired = S.hired || {};
  const pool = JOB_LIST.filter((j) => !j.unique && !j.hidden && j.tier <= (S.ch >= 3 ? 2 : S.ch >= 1 ? 1 : 0));
  const recruits = [0, 1, 2].map((k) => {
    const job = pick(pool, rnd).id, sex = rnd() < 0.5 ? 'm' : 'f', nm = pick(RECRUIT_NAMES[sex], rnd), lv = Math.max(1, Math.round(avg - 1 - rnd() * 2));
    return { key: `${seed}_${k}`, job, sex, name: nm, lv, price: 400 + lv * 90, look: {} };
  }).filter((r) => !S.hired[r.key]);
  body.append(el('div', { class: 'title small' }, T('招募江湖客', 'Hands for hire')), el('div', { class: 'list' }, recruits.length ? recruits.map((r) => el('div', { class: 'item' }, el('div', { class: 'grow' }, el('div', { class: 'nm' }, T(r.name)), el('div', { class: 'small dim' }, `${T(JOBS[r.job].name)} Lv ${r.lv}`)),
    el('button', { class: 'btn', disabled: S.gold < r.price || S.roster.length >= MAX_ROSTER || null, onclick: () => { S.gold -= r.price; S.hired[r.key] = 1; S.roster.push(hire(r)); sfx('levelup'); toast(T(`${T(r.name)} 加入了隊伍！`, `${T(r.name)} joins the company!`)); redraw(); } }, `${r.price} ${T('兩', 'taels')}`))) : el('div', { class: 'dim small' }, T('今天沒有人想跟著走。打一場仗後再來看看。', 'No one wants to come along today. Come back after a battle.'))));
  // jobs posted on the board
  const quests = QUESTS.filter((q) => q.at === id && q.ch <= S.ch && !S.done[q.id] && (!q.reward.needs || flag(q.reward.needs)));
  body.append(el('div', { class: 'title small', style: { marginTop: '14px' } }, T('江湖委託', 'Requests on the board')), el('div', { class: 'list' }, quests.length ? quests.map((q) => el('div', { class: 'item' }, el('div', { class: 'grow' }, el('div', { class: 'nm' }, T(q.name)), el('div', { class: 'small dim' }, T(`敵人等級 ${q.lv} · 報酬 ${q.reward.gold} 兩${(q.reward.items || []).length ? ' ＋ 物品' : ''}${q.reward.join ? ' ＋ 新同伴' : ''}`, `Foes Lv ${q.lv} · ${q.reward.gold} taels${(q.reward.items || []).length ? ' + items' : ''}${q.reward.join ? ' + a companion' : ''}`))),
    el('button', { class: 'btn primary', onclick: () => doQuest(q, id) }, T('接受', 'Take it')))) : el('div', { class: 'dim small' }, T('目前沒有委託。', 'No requests right now.'))));
  // rumours
  const rumours = [
    !flag('lab_gumu') && T('「苗疆邊上有座古墓，墓主是個沒留名字的武聖。千佛寺的藏經閣裡，好像有一卷講古墓的經書。」', '"There\'s an old tomb on the edge of the Miao country; its master was a martial saint who left no name. They say a scroll in the Thousand Buddha library speaks of it."'),
    !flag('lab_shuijing') && T('「寒江底下有座水晶宮。柳閣主年輕時的劍，聽說就掉在那附近。」', '"There\'s a crystal palace under the Cold River. They say Mistress Liu lost the sword of her youth somewhere near it."'),
    !flag('lab_wanyaoku') && T('「青竹寨後山的洞裡，野獸半夜都朝著同一個方向叫。苗女阿蠻的狼兄弟，好像就是從那裡被抓走的。」', '"In the cave behind the Green Bamboo Stockade the beasts all cry the same way at midnight. They say A-Man\'s wolf brother was taken from there."'),
    !flag('lab_jinghu') && T('「蘇河城外的鏡湖，月圓的晚上會照出另一個自己。寒江渡的茶館貼著委託。」', '"The mirror lake outside Suhe shows you another self on full-moon nights. There\'s a notice about it at the Cold River Ferry teahouse."'),
    T('「有些人眼睛特別尖，地上埋著的寶物一眼就看見。神偷的「尋寶眼」就是這樣。」', '"Some folk have sharp eyes for treasure buried in the ground. A thief\'s Treasure Eye is just that."'),
    T('「神偷能從敵人身上摸走兵器衣甲，有時候比店裡賣的還好。」', '"A thief can lift weapons and garb right off the enemy, and sometimes it\'s better than anything in the shops."'),
    T('「馭獸師能讓野獸放下爪牙，跟著隊伍走。說書人嘴皮子厲害，連敵人都能說動。」', '"A beast tamer can talk a wild beast into following you. A storyteller\'s tongue can even talk a foe round."'),
    T('「從背後出手，對方躲不開，傷得也重。站得高的弓手，射得更遠。」', '"Strike from behind and they can\'t dodge, and it hurts more. An archer up high shoots farther."'),
    T('「賈八方說他什麼都賣，昨天連鞋都賣了。今天光著腳在找鞋，說被山猴叼走了。」', '"Jia Bafang says he\'ll sell anything. Yesterday he sold his shoes. Today he\'s barefoot looking for them — says mountain monkeys took them."'),
    T('「胡半仙說明天一定下雨。所以明天一定出太陽。」', '"Hu Banxian says it\'ll surely rain tomorrow. So tomorrow will surely be sunny."'),
  ].filter(Boolean);
  body.append(el('div', { class: 'title small', style: { marginTop: '14px' } }, T('傳聞', 'Rumours')), el('div', { class: 'small', style: { lineHeight: '1.8' } }, pick(rumours, Math.random)));
}
function hire(r) {
  const u = makeUnit({ name: r.name, job: r.job, lv: r.lv, sex: r.sex, look: r.look });
  dressFoe(u, tierFor(r.lv), Math.random);
  gainJp(u, 60 + r.lv * 25, r.job);
  // a recruit knows the cheapest moves of their job already
  for (const a of JOBS[r.job].abilities.filter((a) => a.k === 'act').sort((a, b) => a.jp - b.jp).slice(0, 2)) u.learned.push(a.id);
  return u;
}

// the first battle's lessons
const TIPS = [
  [null, '【出招】輪到自己的人時，選「移動」和「行動」，最後「待機」並決定面向。移動和行動的順序可以對調。', '[Basics] On your fighter\'s turn, choose Move and Act, then Wait and pick a facing. Move and act in either order.'],
  [null, '【背後出手】從背後出手，對方躲不開，傷害也更高。結束回合時，記得面向敵人。', '[Facing] Strike from behind and the foe can\'t dodge and takes more. End each turn facing the enemy.'],
  [null, '【高低】站在高處出手，傷害更高，弓箭也射得更遠。「輕功」決定能跳上多高。Q/E 或左上角的按鈕可以旋轉視角。', '[Height] Strikes from above hit harder, and arrows fly farther. "Leap" (qinggong) decides how high you can climb. Q/E or the buttons at top left turn the camera.'],
  [null, '【出手順序】右上角是接下來的出手順序。身法越快，越常輪到。要蓄氣的內功和輕功躍擊，要等一段時間才會發動。', '[Turn order] Upcoming turns are at top right; faster fighters act more often. Charged internal arts and qinggong leaps take time to land.'],
  [null, '【勝負】畫面上方是勝負條件：擊退全部敵人、打倒首領、保護某人、撐過幾回合、走到某個地方、護送或救出某人。', '[Goals] The goal is shown at the top: rout them all, defeat the leader, protect someone, hold out, reach a place, escort or rescue someone.'],
];
// ---------------------------------------------------------------- building and fighting a battle
// spec: { theme, seed, w, h, lv, foes: [{ k, n, lv, name, who, boss, noDrop, retreat, drops, eq }], guests, goal, music, max, required, treasures }
async function fight(spec) {
  for (;;) {
    const party = await formation(spec.max || 5, spec.required || ['yirui'], spec.note);
    if (party === 'again') continue;
    if (!party) return null;
    const rnd = Math.random, lv = spec.lv, tier = tierFor(lv);
    if (TEST) for (const u of party) trainForTest(u, lv + 2);
    const foes = [];
    for (const f of spec.foes) for (let i = 0; i < (f.n || 1); i++) foes.push(makeOne(f, lv, tier, rnd, party));
    // story companions fighting beside you are a little above the battle; the one you escort or protect fights too
    const goal = { ...(spec.goal || { type: 'rout' }) };
    const gw = [...(spec.guests || [])]; if (['escort', 'protect'].includes(goal.type) && goal.who && !gw.includes(goal.who) && !party.some((u) => u.who === goal.who)) gw.push(goal.who);
    const guests = gw.filter((who) => !party.some((u) => u.who === who)).map((who) => castUnit(who, lv + 2, tier));
    // bigger fields than the story's sizes: three more tiles each way (15 × 15 by default)
    const map = makeMap({ theme: spec.theme || 'highway', w: (spec.w || 12) + 3, h: (spec.h || 12) + 3, seed: spec.seed || Math.floor(rnd() * 1e6), players: party.length + guests.length, foes: foes.length, treasures: spec.treasures ?? 2 });
    const units = [];
    const starts = [...map.starts];
    for (const u of party) { const [x, y] = starts.shift(); units.push({ unit: u, side: 'ally', x, y, leader: u.who === 'yirui' }); }
    for (const u of guests) { const [x, y] = starts.shift() || map.starts[0]; units.push({ unit: u, side: 'guest', x, y }); }
    foes.forEach((f, i) => { const [x, y] = map.foeStarts[i % map.foeStarts.length]; units.push({ unit: f.u, side: 'foe', x, y, boss: !!f.boss, named: !!f.named, noDrop: !!f.noDrop, retreat: f.retreat || 0 }); });
    // a captive to rescue waits, bound, among the foes
    if (goal.type === 'rescue') units.push({ unit: castUnit(goal.who, lv + 1, tier), side: 'guest', x: map.captive[0], y: map.captive[1], bound: true });
    goal.tiles = map.goal;
    // treasure under the ground
    const leg = LEG_POOL.filter((id) => !S.bag[id] && !S.roster.some((u) => Object.values(u.eq).includes(id)));
    const treasure = map.treasure.map(([x, y]) => ({ x, y, item: roll(tier, rnd, leg) }));
    // the company's gear comes home whatever happens (an enemy thief's haul is returned after the fight)
    const keep = party.map((u) => [u, { ...u.eq }]);
    stopBackdrop();
    const B = await runBattle({ map, units, goal, tier, rnd, gold: S.gold, bag: S.bag, flags: S.flags, treasure, music: spec.music || battleMusic(spec, foes), intro: spec.tutorial && !flag('tutorial_seen') ? async () => { setFlag('tutorial_seen'); await playLines(TIPS, { bg: 'rgba(0,0,0,.15)' }); } : null });
    for (const [u, eq] of keep) u.eq = eq;
    S.gold = Math.max(0, B.gold) + B.goldWon;
    S.battles = (S.battles || 0) + 1;
    const loot = [...B.spoils, ...B.found];
    for (const id of loot) bagAdd(id);
    const recruits = B.over === 'win' ? B.recruits.filter(() => S.roster.length < MAX_ROSTER) : [];
    for (const r of recruits) { if (S.roster.length >= MAX_ROSTER) break; delete r.var; r.drops = undefined; S.roster.push(r); }
    await results(B, party, loot, recruits);
    save();
    return B;
  }
}
// the automated play-through trains each fighter to the battle's level the way a player would have: levels, JP in
// the current job, the cheapest abilities learned, gear of the tier from the shop
function trainForTest(u, lv) {
  if (u.mon || u.lv >= lv) return;
  u.lv = lv; gainJp(u, lv * 60, u.job);
  const acts = JOBS[u.job].abilities.filter((a) => !u.learned.includes(a.id)).sort((a, b) => a.jp - b.jp);
  for (const a of acts) { if (u.jp[u.job].cur < a.jp) break; u.jp[u.job].cur -= a.jp; u.learned.push(a.id); if (a.k === 'react' && !u.react) u.react = a.id; if (a.k === 'sup' && !u.sup) u.sup = a.id; if (a.k === 'move' && !u.move) u.move = a.id; }
  const keep = u.eq.w && ITEMS[u.eq.w] && ITEMS[u.eq.w].legend ? u.eq.w : null;
  dressFoe(u, tierFor(lv), Math.random); if (keep) u.eq.w = keep;
}
// which battle theme: the Netherworld masters get the boss theme, fights on water and roofs the quick one, the deep places the march
function battleMusic(spec, foes) {
  if (foes.some((f) => f.boss && f.u.foeWho && ['tuqianqiu', 'lihanshan', 'xiaowuying', 'xiaotian', 'guimian', 'mowuya'].includes(f.u.foeWho))) return 'boss';
  if (['boats', 'docks', 'rooftops', 'pavilion', 'bamboo'].includes(spec.theme)) return 'battle2';
  if (['tomb', 'palace', 'cave', 'nether', 'pagoda', 'graveyard'].includes(spec.theme)) return 'battle3';
  return 'battle';
}
// after the fight: who grew, what was found
function results(B, party, loot, recruits) {
  return new Promise((resolve) => {
    music(B.over === 'win' ? 'victory' : 'defeat');
    const rows = party.map((u) => { const L = B.expLog[u.uid] || { exp: 0, jp: 0, lv: [], jlv: [] }; return el('div', { class: 'item' }, el('div', { class: 'grow' }, el('div', { class: 'nm' }, uname(u)), el('div', { class: 'small dim' }, `EXP +${L.exp} · JP +${L.jp}`)), L.lv.length ? el('span', { class: 'gold' }, `Lv ${u.lv}!`) : null, L.jlv.length ? el('span', { class: 'tag', style: { color: '#c8a0ff' } }, T(`職業 Lv ${L.jlv[L.jlv.length - 1]}`, `Job Lv ${L.jlv[L.jlv.length - 1]}`)) : null); });
    const counts = {}; for (const id of loot) counts[id] = (counts[id] || 0) + 1;
    const content = el('div', {}, el('div', { class: 'title', style: { fontSize: '22px' } }, B.over === 'win' ? T('勝利', 'Victory') : T('敗北', 'Defeat')),
      el('div', { class: 'list scroll', style: { maxHeight: '32vh', margin: '8px 0' } }, rows),
      el('div', { class: 'title small' }, T('戰利品', 'Spoils')), el('div', { class: 'small' }, `+${B.goldWon} ${T('兩', 'taels')}　`, Object.entries(counts).map(([id, n]) => el('span', { class: 'tag', style: { margin: '2px', color: ITEMS[id] && ITEMS[id].legend ? '#ffd040' : null } }, `${itemLabel(id)}${n > 1 ? ' ×' + n : ''}`))),
      recruits.length ? el('div', { class: 'small', style: { marginTop: '6px', color: '#7adf8a' } }, T('加入隊伍：', 'Joined: ') + recruits.map((u) => uname(u)).join(T('、', ', '))) : null);
    const close = sheet(content, { onBack: () => resolve(), outside: false });
    content.append(el('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '10px' } }, el('button', { class: 'btn primary', onclick: () => { close(); resolve(); } }, T('繼續', 'Continue'))));
  });
}

// ---------------------------------------------------------------- the story
async function playEvent(e) {
  busy = true;
  const chStart = !EVENTS.some((x) => x.ch === e.ch && S.done[x.id]);
  if (chStart && e.ch > 0 && S.ch < e.ch) { S.ch = e.ch; await chapterCard(CHAPTERS[e.ch]); }
  backdrop(); music(e.pmusic || (e.ch >= 4 ? 'tense' : e.battle && e.battle.goal && e.battle.goal.type === 'boss' ? 'tense' : 'calm'));
  clear();
  // the opening scene plays once; backing out of the deployment and coming back goes straight to it
  S.seenPre = S.seenPre || {};
  if (!S.seenPre[e.id]) { await playLines(e.pre); S.seenPre[e.id] = true; save(); }
  if (e.battle) {
    for (;;) {
      const b = e.battle;
      const spec = { ...b, lv: b.lv, required: ['yirui'], max: b.max || 5, note: T(`敵人等級 ${b.lv}（你們的平均等級 ${Math.round(avgLv())}）`, `Foes Lv ${b.lv} (your average Lv ${Math.round(avgLv())})`) };
      const B = await fight(spec);
      if (!B) { busy = false; return world(); }
      if (B.over === 'win') break;
      backdrop();
      const r = await modal(el('div', {}, T('戰鬥失敗了……要再挑戰一次嗎？', 'The battle was lost… try again?')), [T('再挑戰', 'Retry'), T('回到地圖', 'Back to the map')]);
      if (r !== 0) { busy = false; return world(); }
    }
  }
  backdrop(); clear();
  music(e.ch === 5 && e.id === 'c5_4' ? 'ending' : 'calm');
  await playLines(e.post);
  // joins, gifts, flags
  for (const who of e.join || []) joinCast(who);
  if (e.give) { if (e.give.gold) S.gold += e.give.gold; for (const id of e.give.items || []) bagAdd(id); if ((e.give.items || []).length || e.give.gold) toast(T('得到了：', 'Received: ') + [...(e.give.items || []).map(itemLabel), e.give.gold ? `${e.give.gold} ${T("兩", "taels")}` : ''].filter(Boolean).join(T('、', ', ')), 2600); }
  for (const f of e.flags || []) setFlag(f);
  S.done[e.id] = true;
  if (e.flags && e.flags.includes('ending')) return ending();
  // the next chapter opens when the last event of this one is done
  const nx = nextEvent(S.done);
  if (nx && nx.ch > S.ch) { S.ch = nx.ch; save(); await chapterCard(CHAPTERS[nx.ch]); }
  save(); busy = false; world();
}
function joinCast(who) {
  if (S.roster.some((u) => u.who === who)) return;
  const c = CAST[who], lv = Math.max(1, Math.round(avgLv()));
  const u = makeUnit({ who, name: c.name, job: c.job, lv, sex: c.sex, look: {} });
  u.art = c.art;
  dressFoe(u, tierFor(lv), Math.random);
  gainJp(u, 100 + lv * 40, c.job);
  // they arrive knowing their own art's first moves (a unique job's signature move costs nothing)
  for (const a of JOBS[c.job].abilities.filter((a) => a.k === 'act').sort((a, b) => a.jp - b.jp).slice(0, 3)) if (!u.learned.includes(a.id)) u.learned.push(a.id);
  const re = JOBS[c.job].abilities.find((a) => a.k === 'react'); if (re && lv >= 10) { u.learned.push(re.id); u.react = re.id; }
  if (JOBS[c.job].unique) setFlag('job_' + c.job);
  if (S.roster.length >= MAX_ROSTER) { const out = S.roster.findIndex((x) => !x.who); if (out >= 0) S.roster.splice(out, 1); }
  S.roster.push(u);
  setFlag('joined_' + who);
  toast(T(`${T(c.name)} 加入了隊伍！`, `${T(c.name)} joins the company!`), 2400);
}
async function ending() {
  music('ending');
  await rollEnding(ENDING);
  setFlag('cleared'); setFlag('lab_jinghu'); S.ch = 5; S.node = 'wulin';
  save();
  await modal(el('div', {}, el('div', { class: 'title' }, T('感謝遊玩！', 'Thank you for playing!')), el('div', { style: { marginTop: '6px' } }, T('江湖還沒有結束：完成茶館的委託、挑戰四座隱藏迷宮、讓每個人學會所有的武功。', 'The jianghu goes on: finish the teahouse requests, take on the four hidden labyrinths, and master every art.'))), [T('繼續', 'Continue')]);
  world();
}

// ---------------------------------------------------------------- skirmishes and tavern jobs
async function patrol(id, ambush = false) {
  const n = NODES[id], lv = n.lv || 1, rnd = Math.random, count = 4 + Math.floor(rnd() * 3);
  backdrop(); clear();
  if (ambush) await modal(el('div', {}, T(`在${T(n.name)}遭遇了埋伏！`, `Ambushed in ${T(n.name)}!`)), [T('迎戰', 'Fight')]);
  const foes = []; for (let i = 0; i < count; i++) foes.push({ k: pick(n.foes, rnd), n: 1, lv: Math.floor(rnd() * 3) - 1 });
  const B = await fight({ theme: n.theme, lv, foes, seed: Math.floor(rnd() * 1e6), treasures: 1 + Math.floor(rnd() * 3), max: 5, required: [], note: T(`敵人等級 約 ${lv}`, `Foes around Lv ${lv}`) });
  world(); void B;
}
async function doQuest(q, at) {
  const lv = q.lv;
  const foes = q.foes.map((k, i) => { const f = typeof k === 'string' ? { k } : { ...k }; f.n = 1; if (i === q.foes.length - 1 && !MONSTERS[f.k]) f.boss = true; if (i === q.foes.length - 1 && MONSTERS[f.k] && MONSTERS[f.k].beast) f.boss = true; return f; });
  const B = await fight({ theme: q.theme, lv, foes, seed: hashStr(q.id), treasures: 2, max: 5, required: [], note: T(`敵人等級 ${lv}`, `Foes Lv ${lv}`) });
  if (B && B.over === 'win') {
    S.done[q.id] = true; S.gold += q.reward.gold; for (const id of q.reward.items || []) bagAdd(id); if (q.reward.flag) setFlag(q.reward.flag);
    if (q.reward.join) joinCast(q.reward.join);
    await modal(el('div', {}, el('div', { class: 'title' }, T('委託完成', 'Request done')), el('div', {}, `+${q.reward.gold} ${T('兩', 'taels')}　`, (q.reward.items || []).map((id) => el('span', { class: 'tag', style: { color: ITEMS[id] && ITEMS[id].legend ? '#ffd040' : null } }, itemLabel(id)))),
      q.reward.join ? el('div', { style: { marginTop: '8px', color: '#7adf8a' } }, T(`${T(CAST[q.reward.join].name)} 加入了隊伍！`, `${T(CAST[q.reward.join].name)} joins the company!`)) : null,
      q.reward.flag && q.reward.flag.startsWith('lab_') ? el('div', { style: { marginTop: '8px', color: '#c8a0ff' } }, T(`隱藏的地方出現在地圖上了：${T(Object.values(NODES).find((n) => n.unlock === q.reward.flag).name)}`, `A hidden place has appeared on the map: ${T(Object.values(NODES).find((n) => n.unlock === q.reward.flag).name)}`)) : null), [T('好', 'OK')]);
    save();
  }
  town(at);
}

// ---------------------------------------------------------------- the hidden labyrinths
async function labyrinth(id) {
  const L = LABYRINTHS[id];
  S.labyrinth = S.labyrinth || {};
  backdrop();
  for (;;) {
    const floor = Math.min(L.floors, (S.labyrinth[id] || 0) + 1);
    const done = (S.labyrinth[id] || 0) >= L.floors;
    const r = await modal(el('div', {}, el('div', { class: 'title' }, T(L.name)), el('div', { class: 'small', style: { margin: '6px 0' } }, T(L.desc)), el('div', {}, done ? T('已經走到了最深處。可以再次挑戰最後一層。', 'You have reached the bottom. You may fight the last floor again.') : T(`下一層：第 ${floor} 層（共 ${L.floors} 層）`, `Next: floor ${floor} of ${L.floors}`))), [done ? T('再戰最深處', 'Fight the bottom again') : T(`挑戰第 ${floor} 層`, `Fight floor ${floor}`), T('離開', 'Leave')]);
    if (r !== 0) return world();
    const lv = Math.round(L.lv + (floor - 1) * L.step), rnd = Math.random, gd = L.guardians[floor];
    const foes = [];
    if (L.mirror) { for (let i = 0; i < 4; i++) foes.push({ k: 'mirror', n: 1 }); foes.push({ k: pick(L.foes, rnd), n: 1 }); }
    else for (let i = 0; i < 4 + (floor % 3); i++) foes.push({ k: pick(L.foes, rnd), n: 1, lv: Math.floor(rnd() * 3) - 1 });
    if (gd) foes.push(gd.mon ? { k: gd.mon, n: 1, boss: true, name: gd.name, lv: gd.lv || 3 } : { k: gd.k, who: gd.who, n: 1, boss: true, lv: gd.lv || 3, noDrop: true });
    const B = await fight({ theme: L.themes[floor % L.themes.length], lv, foes, seed: hashStr(id) + floor * 101, treasures: 2 + (floor % 2), max: 5, required: [], goal: gd ? { type: 'boss', name: gd.name || (gd.mon ? MONSTERS[gd.mon].name : CAST[gd.who].name) } : { type: 'rout' }, music: gd ? 'boss' : 'battle3', note: T(`敵人等級 ${lv}`, `Foes Lv ${lv}`) });
    backdrop();
    if (!B) return world();
    if (B.over !== 'win') { toast(T('被趕出了迷宮……', 'Driven out of the labyrinth…'), 2200); return world(); }
    S.labyrinth[id] = Math.max(S.labyrinth[id] || 0, floor);
    // a chest on every floor
    const t = tierFor(lv), chest = GEAR.filter((g) => !g.legend && g.tier === Math.min(10, t + 1) && g.variant);
    const got = [pick(chest, rnd).id, rnd() < 0.5 ? 'hipotion' : 'hiether'];
    if (floor === L.floors) { for (const it of L.prize.items) got.push(it); if (L.prize.flag) { setFlag(L.prize.flag); setFlag('seen_' + L.prize.flag.slice(4)); } }
    for (const it of got) bagAdd(it);
    S.gold += 200 * floor;
    await modal(el('div', {}, el('div', { class: 'title' }, T(`第 ${floor} 層 突破`, `Floor ${floor} cleared`)), el('div', {}, T('寶箱裡有：', 'In the chest: '), got.map((g) => el('span', { class: 'tag', style: { color: ITEMS[g] && ITEMS[g].legend ? '#ffd040' : null, margin: '2px' } }, itemLabel(g)))),
      floor === L.floors && L.prize.flag ? el('div', { style: { color: '#c8a0ff', marginTop: '8px' } }, T(`失傳的武學「${T(JOBS[L.prize.flag.slice(4)].name)}」重現江湖！`, `The lost art "${T(JOBS[L.prize.flag.slice(4)].name)}" returns to the jianghu!`)) : null), [T('繼續', 'Continue')]);
    save();
  }
}

// ---------------------------------------------------------------- boot
import('./ui/battleui.js').then(({ reportError }) => { addEventListener('error', (e) => reportError(e.error || e.message)); addEventListener('unhandledrejection', (e) => reportError(e.reason)); });
addEventListener('pointerdown', unlock, { once: true });
initCloud(() => { if (!S) title(); });
artReady.then(() => title());
window.__ss = { get S() { return S; }, world, title, fight, playEvent, town, labyrinth, doQuest, joinCast, patrol, next: () => { const nx = nextEvent(S.done); if (nx) { S.node = nx.at; playEvent(nx); } return nx && nx.id; } };
