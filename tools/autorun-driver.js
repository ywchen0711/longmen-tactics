// The automated play-through: a new game, then every story event in order with auto-battle on, clicking through
// conversations, deployments and results, to the ending. Screenshots at chosen battles. (run with Q=?test=1)
const SHOTS = new Set((globalThis.process && process.env.SHOTS ? process.env.SHOTS : 'p1,c1_2,c2_2,c2_3,c3_2,c4_1,c4_5,c5_4').split(','));
await p.evaluate(() => { window.__turbo = true; window.__errs = []; });
const step = () => p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim().startsWith(t));
  const ss = window.__ss, S = ss && ss.S;
  if (!S) { const b = btn('新的遊戲'); if (b) { b.click(); return 'new'; } return 'wait'; }
  if (S.flags.cleared && !q('.chaptercard') && !q('.modal')) return 'done';
  if (q('.chaptercard')) { q('.chaptercard').click(); return 'card'; }
  if (q('.dialog')) { q('.dialog').click(); q('.dialog') && q('.dialog').click(); return 'talk'; }
  for (const t of ['出擊', '再挑戰', '繼續', '好', '開始']) { const b = btn(t); if (b) { b.click(); return 'btn:' + t; } }
  if (q('#autobtn')) { if (!q('#autobtn').classList.contains('primary')) q('#autobtn').click(); return 'battle'; }
  if (q('.worldmap') && !q('.modal')) { const id = ss.next(); return 'event:' + id; }
  return 'idle';
});
let last = '', same = 0, current = null, shotTaken = new Set(), t0 = Date.now(), battles = 0;
for (let i = 0; i < 200000; i++) {
  const r = await step();
  if (r.startsWith('event:')) { current = r.slice(6); console.log(`[${Math.round((Date.now() - t0) / 1000)}s] event ${current}`); }
  if (r === 'battle' && current && SHOTS.has(current) && !shotTaken.has(current)) {
    shotTaken.add(current); await p.evaluate(() => { window.__turbo = false; }); await wait(2500); await shot('battle-' + current); await p.evaluate(() => { window.__turbo = true; });
  }
  if (r === 'btn:出擊') battles++;
  if (r === 'done') { console.log('ENDING reached after', battles, 'deployments in', Math.round((Date.now() - t0) / 1000), 's'); await wait(800); await shot('after-ending'); break; }
  if (r === last && (r === 'idle' || r === 'wait')) { same++; if (same === 400) { console.log('STUCK at', current, r); await shot('stuck'); break; } } else same = 0;
  last = r;
  await wait(r === 'battle' ? 120 : 25);
}
const info = await p.evaluate(() => ({ done: Object.keys(window.__ss.S.done).length, battles: window.__ss.S.battles, roster: window.__ss.S.roster.map((u) => (typeof u.name === 'string' ? u.name : u.name[0]) + u.lv).join(' '), errs: window.__errs }));
console.log('RESULT', JSON.stringify(info));
