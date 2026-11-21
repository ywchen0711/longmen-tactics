// The saved game: your company, your bag, your silver, where you are in the story, and everything you've found.
import { makeUnit, setUid } from './core/unit.js';

export const KEY = 'ltac.save.v1', GAME = 'longmen-tactics';
export let S = null;
export const setS = (v) => { S = v; if (S) setUid(1 + Math.max(0, ...S.roster.map((u) => u.uid), S.uidTop || 0)); };
let cloud = null;
export async function initCloud(onPulled) { try { cloud = await import('/save.js'); if (await cloud.pull(GAME, KEY) && onPulled) onPulled(); } catch (e) { cloud = null; } }
export function save() { if (!S) return; try { S.saved = Date.now(); localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } if (cloud) try { cloud.touch(GAME, KEY); } catch (e) { /* ignore */ } }
export function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); return d && d.v === 1 ? d : null; } catch (e) { return null; } }
// the two brothers set out: Yi Rui with his sabre, Yi Shuo with his ball, each already in his own art
export function newGame(name) {
  const rui = makeUnit({ who: 'yirui', name: ['奕叡', 'Yi Rui'], job: 'qicheng', lv: 1, sex: 'm' });
  rui.art = 'yirui'; rui.eq = { w: 'dao1', s: null, h: 'hat1', b: 'light1', a: null }; rui.learned.push('yidao');
  const shuo = makeUnit({ who: 'yishuo', name: ['奕碩', 'Yi Shuo'], job: 'xuanfeng', lv: 1, sex: 'm' });
  shuo.art = 'yishuo'; shuo.eq = { w: 'qiu1', s: null, h: 'hat1', b: 'light1', a: null }; shuo.learned.push('xuanfengqiu');
  for (const u of [rui, shuo]) u.jp[u.job] = { cur: 60, total: 60 };
  S = { v: 1, name, ch: 0, node: 'daozhuang', flags: { job_qicheng: true, job_xuanfeng: true }, roster: [rui, shuo], bag: { potion: 4, phoenix: 1, antidote: 2 }, gold: 400, done: {}, time: 0, kills: 0, battles: 0, labyrinth: {}, seen: {}, uidTop: shuo.uid };
  return S;
}
// the bag holds gear and pills by id
export const bagAdd = (id, n = 1) => { S.bag[id] = (S.bag[id] || 0) + n; };
export const bagTake = (id, n = 1) => { if ((S.bag[id] || 0) < n) return false; S.bag[id] -= n; if (!S.bag[id]) delete S.bag[id]; return true; };
export const flag = (k) => !!(S && S.flags[k]);
export const setFlag = (k, v = true) => { S.flags[k] = v; };
export const unitByWho = (who) => S.roster.find((u) => u.who === who);
// save when the page goes away (iOS closes tabs without warning)
if (typeof addEventListener !== 'undefined') addEventListener('pagehide', () => save());
