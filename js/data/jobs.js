// Every job, every ability by id, and the words that describe an ability on screen.
import { JOBS1 } from './jobs1.js';
import { JOBS2 } from './jobs2.js';
import { ELEMENTS, STATUS, STATS } from './core.js';
import { T } from '../i18n.js';

export const JOB_LIST = [...JOBS1, ...JOBS2];
export const JOBS = Object.fromEntries(JOB_LIST.map((j) => [j.id, j]));
export const ABILITIES = {};
for (const j of JOB_LIST) for (const a of j.abilities) { if (ABILITIES[a.id]) throw new Error(`ability id used twice: ${a.id}`); ABILITIES[a.id] = a; }

// job levels: total JP earned in a job
export const JOB_LV = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600];
export const jobLevel = (jp) => { let l = 1; for (let i = 1; i < JOB_LV.length; i++) if (jp >= JOB_LV[i]) l = i + 1; return l; };
// can this unit take this job? (unique jobs belong to one person; hidden ones need a flag from the labyrinths)
export function jobOpen(unit, id, flags = {}) {
  const j = JOBS[id]; if (!j) return false;
  if (j.unique) return unit.who === j.unique && !!flags['job_' + id];
  if (j.hidden) return !!flags['job_' + id];
  return Object.entries(j.req).every(([k, lv]) => jobLevel((unit.jp && unit.jp[k] && unit.jp[k].total) || 0) >= lv);
}

// ---------------------------------------------------------------- words for an ability
const pct = (n) => `${n}%`;
const stat = (s) => T(...STATS[s]);
export function describe(a) {
  const out = [];
  const range = a.r === 'w' ? T('武器射程', 'weapon range') : a.r === 0 ? T('自身', 'self') : T(`射程 ${a.r}`, `range ${a.r}`);
  const area = a.a === 'all' ? T('全場', 'whole field') : a.a === 'line' ? T('直線', 'line') : a.a ? T(`範圍 ${a.a}`, `area ${a.a}`) : '';
  if (a.k === 'act') {
    out.push([range, area, a.mp ? T(`內力 ${a.mp}`, `Qi ${a.mp}`) : '', a.ct ? T(`蓄氣 ${a.ct}`, `charge ${a.ct}`) : ''].filter(Boolean).join(' · '));
    if (a.d) {
      const [s, p, el] = a.d;
      const kind = s === 'mag' ? T('內功傷害', 'internal-art damage') : s === 'fix' ? T('機關傷害', 'device damage') : s === 'pct' ? T(`最大 HP ${p * 100 | 0}% 的傷害`, `${p * 100 | 0}% of max HP`) : s === 'hyb' ? T('內外兼修傷害', 'blade-and-qi damage') : s === 'def' ? T('以防禦力造成傷害', 'damage from defence') : s === 'gold' ? T('以銀兩造成傷害', 'damage paid in silver') : T('物理傷害', 'physical damage');
      out.push(`${kind}${s !== 'pct' ? ` ×${p}` : ''}${el && ELEMENTS[el] ? ` · ${T(...ELEMENTS[el])}` : el === 'terrain' ? T(' · 地形屬性', ' · terrain element') : ''}${a.hits ? T(` · ${a.hits} 連擊`, ` · ${a.hits} hits`) : ''}`);
    }
    if (a.h) out.push(a.h[0] === 'pct' ? T(`回復最大 HP 的 ${a.h[1] * 100 | 0}%`, `restores ${a.h[1] * 100 | 0}% of max HP`) : a.h[0] === 'fix' ? T(`回復 ${a.h[1]} HP`, `restores ${a.h[1]} HP`) : T(`回復 HP ×${a.h[1]}`, `heals ×${a.h[1]}`));
    if (a.mph) out.push(T(`回復 ${a.mph} 內力`, `restores ${a.mph} Qi`));
    if (a.rev) out.push(T(`使倒下的同伴以 ${a.rev * 100 | 0}% HP 復活`, `revives at ${a.rev * 100 | 0}% HP`));
    for (const [id, ch, dur] of a.st || []) out.push(T(`${ch < 100 ? pct(ch) + ' ' : ''}${T(...STATUS[id].name)}（${dur} 回合）`, `${ch < 100 ? pct(ch) + ' ' : ''}${T(...STATUS[id].name)} (${dur} turns)`));
    for (const [s, p, dur] of a.buf || []) out.push(T(`${stat(s)} ${p > 0 ? '+' : ''}${p}%（${dur} 回合）`, `${stat(s)} ${p > 0 ? '+' : ''}${p}% (${dur} turns)`));
    if (a.cure) out.push(T('解除：', 'cures: ') + a.cure.map((s) => T(...STATUS[s].name)).join(T('、', ', ')));
    if (a.steal) out.push(T('偷竊', 'steals ') + ({ gold: T('銀兩', 'silver'), item: T('道具', 'an item'), w: T('武器', 'weapon'), s: T('副手', 'off-hand'), h: T('頭部裝備', 'headgear'), b: T('身體裝備', 'body armour'), a: T('飾品', 'accessory'), any: T('任何東西', 'anything'), exp: T('經驗值', 'experience') }[a.steal]));
    if (a.brk) out.push(T('破壞', 'breaks ') + T(...{ w: ['武器', 'weapon'], s: ['副手', 'off-hand'], h: ['頭部裝備', 'headgear'], b: ['身體裝備', 'body armour'], a: ['飾品', 'accessory'] }[a.brk]));
    if (a.drain) out.push(T('吸收造成的傷害', 'drains the damage dealt'));
    if (a.mpd) out.push(T(`內力傷害 ${a.mpd}`, `Qi damage ${a.mpd}`));
    if (a.jump) out.push(T('施展輕功躍上半空，蓄氣結束時落下（期間不會被攻擊）', 'a qinggong leap into the air, landing when charged (untouchable meanwhile)'));
    if (a.quick) out.push(T('目標立刻再行動一次', 'the target acts again at once'));
    if (a.invite) out.push((a.beastOnly ? T('收服野獸或妖物', 'tames a beast or creature') : a.humanOnly ? T('說服敵人加入隊伍', 'talks a person into joining you') : T('收服敵人加入隊伍', 'brings a foe over to your side')));
    if (a.taunt) out.push(T('使敵人只攻擊自己', 'draws enemy attacks'));
    if (a.backBonus) out.push(T('從背後攻擊時威力大增', 'much stronger from behind'));
    if (a.execute) out.push(T(`HP 低於 ${a.execute * 100 | 0}% 的敵人直接倒下`, `fells foes under ${a.execute * 100 | 0}% HP`));
    if (a.strip) out.push(T('解除目標的增益', 'strips the target\'s boons'));
    if (a.foesOnly) out.push(T('只會打到敵人', 'strikes foes only'));
    if (a.self && a.self.hp) out.push(T(`自己損失 ${-a.self.hp * 100 | 0}% HP`, `costs ${-a.self.hp * 100 | 0}% of own HP`));
    if (a.hit) out.push(T(`基本成功率 ${a.hit}%`, `base chance ${a.hit}%`));
    if (a.warpTo) out.push(T('把同伴傳送到別的位置', 'moves an ally elsewhere'));
    if (a.guardian) out.push(T('替同伴承受攻擊', 'takes blows meant for an ally'));
  } else if (a.k === 'react') {
    const rx = a.rx, on = rx.on === 'phys' ? T('受到物理攻擊時', 'when struck physically') : rx.on === 'magic' ? T('受到內功時', 'when hit by an internal art') : T('受到攻擊時', 'when hit');
    const fx = { counter: T('反擊', 'strike back'), heal: T('回復 HP', 'heal'), evade: T('閃避', 'dodge'), mpshield: T('用內力承受傷害', 'take the damage on Qi'), atkup: T('攻擊力上升', 'gain attack'), haste: T('加速', 'hasten'), regen: T('獲得再生', 'gain Regen'),
      mpheal: T('回復內力', 'restore Qi'), dmgcut: T('減少傷害', 'reduce the damage'), guard: T('保護附近的同伴', 'shield a nearby ally'), magcounter: T('以內功反擊', 'answer with an internal art'), undying: T('以 1 HP 撐住', 'hang on at 1 HP'), absorbmp: T('把內功化成內力', 'turn the art into Qi') }[rx.fx];
    out.push(`${on}${T('，', ', ')}${rx.p}% ${fx}`);
  } else if (a.k === 'sup') {
    const s = a.sp, parts = [];
    if (s.eq) parts.push(T('可以裝備', 'lets you use ') + T(...({ ...WEAPON_WORDS }[s.eq] || ['', ''])));
    if (s.stat) parts.push(`${stat(s.stat)} +${s.p}%`); if (s.stat2) parts.push(`${stat(s.stat2)} +${s.p2}%`);
    if (s.jp) parts.push(T(`JP +${s.jp}%`, `JP +${s.jp}%`)); if (s.exp) parts.push(T(`EXP +${s.exp}%`, `EXP +${s.exp}%`));
    if (s.dual) parts.push(T('雙手各持一把武器', 'wield a weapon in each hand')); if (s.steal) parts.push(T(`偷竊成功率 +${s.steal}%`, `steal chance +${s.steal}%`));
    if (s.halfmp) parts.push(T('內力消耗減半', 'half Qi cost')); if (s.itemr) parts.push(T(`道具射程 ${s.itemr}`, `item range ${s.itemr}`)); if (s.itempow) parts.push(T(`道具效果 +${s.itempow}%`, `item potency +${s.itempow}%`));
    if (s.crit) parts.push(T(`會心率 +${s.crit}%`, `crit +${s.crit}%`)); if (s.hit) parts.push(T(`命中 +${s.hit}%`, `accuracy +${s.hit}%`)); if (s.ct) parts.push(T(`蓄氣時間 -${s.ct}%`, `charge time -${s.ct}%`));
    if (s.el) parts.push(T('普通攻擊附帶', 'basic attacks carry ') + T(...ELEMENTS[s.el].slice(0, 2))); if (s.elpow) parts.push(T(...ELEMENTS[s.elpow].slice(0, 2)) + T(`屬性威力 +${s.p}%`, ` power +${s.p}%`));
    if (s.wpow) parts.push(T(`${T(...(WEAPON_WORDS[s.wpow] || ['', '']))}威力 +${s.p}%`, `${T(...(WEAPON_WORDS[s.wpow] || ['', '']))} power +${s.p}%`)); if (s.unarmed) parts.push(T(`空手攻擊 +${s.unarmed}%`, `barehanded +${s.unarmed}%`));
    if (s.lowhp) parts.push(T(`HP 低於 1/4 時攻擊 +${s.lowhp}%`, `attack +${s.lowhp}% under 1/4 HP`)); if (s.status) parts.push(T(`異常狀態成功率 +${s.status}%`, `status chance +${s.status}%`));
    if (s.gold) parts.push(T(`銀兩 +${s.gold}%`, `silver +${s.gold}%`)); if (s.invite) parts.push(T(`招募成功率 +${s.invite}%`, `invite chance +${s.invite}%`)); if (s.drain) parts.push(T(`吸收量 +${s.drain}%`, `drain +${s.drain}%`));
    if (s.healpow) parts.push(T(`回復量 +${s.healpow}%`, `healing +${s.healpow}%`)); if (s.songpow) parts.push(T(`全場招式的效果 +${s.songpow}%`, `whole-field arts +${s.songpow}%`)); if (s.range) parts.push(T(`射程 +${s.range}`, `range +${s.range}`));
    if (s.immune) parts.push(T('免疫：', 'immune: ') + s.immune.map((x) => T(...STATUS[x].name)).join(T('、', ', '))); if (s.twohand) parts.push(T('雙手持武器，威力 ×1.5', 'two-handed grip, power ×1.5'));
    if (s.vsbeast) parts.push(T(`對野獸妖物傷害 +${s.vsbeast}%`, `+${s.vsbeast}% against beasts`)); if (s.terrain) parts.push(T('不受地形阻礙', 'ignores rough ground'));
    out.push(parts.join(T('，', ', ')));
  } else {
    const m = a.mv, parts = [];
    if (m.mov) parts.push(T(`移動 +${m.mov}`, `Move +${m.mov}`)); if (m.jmp) parts.push(T(`輕功 +${m.jmp}`, `Leap +${m.jmp}`)); if (m.ign) parts.push(T('無視高低差', 'ignore height'));
    if (m.float) parts.push(T('凌空而行', 'float')); if (m.tele) parts.push(T('遁到範圍內任何地方', 'vanish to anywhere in range')); if (m.hp) parts.push(T(`移動時回復 ${m.hp}% HP`, `regain ${m.hp}% HP on moving`));
    if (m.mp) parts.push(T(`移動時回復 ${m.mp}% 內力`, `regain ${m.mp}% Qi on moving`)); if (m.find) parts.push(T('看得見地圖上隱藏的寶物', 'see hidden treasure on the map')); if (m.water) parts.push(T('可以踏水而行', 'walk on deep water'));
    if (m.terrain) parts.push(T('不受地形阻礙', 'ignores rough ground'));
    out.push(parts.join(T('，', ', ')));
  }
  return out.filter(Boolean);
}
const WEAPON_WORDS = { dao: ['刀', 'sabres'], jian: ['劍', 'swords'], daidao: ['大刀', 'great blades'], bishou: ['匕首', 'daggers'], qiang: ['槍', 'spears'], gun: ['棍', 'staves'], chui: ['錘', 'hammers'],
  fuchen: ['拂塵', 'whisks'], mujian: ['桃木劍', 'peachwood swords'], gong: ['弓', 'bows'], nu: ['弩', 'crossbows'], jiguan: ['機關匣', 'gadget boxes'], fulu: ['符籙', 'talismans'], qin: ['琴', 'qins'],
  zhua: ['拳套', 'fist guards'], shan: ['鐵扇', 'iron fans'], bian: ['鞭', 'whips'], bi: ['判官筆', 'brushes'], anqi: ['暗器', 'hidden weapons'], qiu: ['球', 'balls'],
  shield: ['藤牌', 'shields'], heavy: ['鎧甲', 'armour'] };
export const KIND_NAME = { act: ['技能', 'Action'], react: ['反應', 'Reaction'], sup: ['輔助', 'Support'], move: ['移動', 'Movement'] };
