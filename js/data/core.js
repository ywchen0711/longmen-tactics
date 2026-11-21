// The building blocks every other table uses: the five-phase elements, the pressure-point statuses, weapon kinds,
// equipment slots, stats and the ground of the battle maps.
import { EN } from '../i18n.js';

// elements: the ids stay short; holy and dark are the yang and yin of internal arts
export const ELEMENTS = {
  fire: ['火', 'Fire', '#ff7a3a'], ice: ['寒', 'Frost', '#8ad8ff'], bolt: ['雷', 'Thunder', '#ffe14a'], wind: ['風', 'Wind', '#9af0a0'],
  earth: ['土', 'Earth', '#c8a060'], water: ['水', 'Water', '#4a9aff'], holy: ['陽', 'Yang', '#fff2b0'], dark: ['陰', 'Yin', '#b07aff'],
};

// statuses: good ones (boons) and bad ones (most of them pressure points); dur is in the unit's own turns
export const STATUS = {
  poison:  { name: ['中毒', 'Poison'], bad: true, col: '#7adf5a', desc: ['每回合損失最大 HP 的 1/10。', 'Loses 1/10 of max HP each turn.'] },
  regen:   { name: ['調息', 'Breathing'], col: '#8affc8', desc: ['運氣調息，每回合回復最大 HP 的 1/10。', 'Steady breathing: regains 1/10 of max HP each turn.'] },
  haste:   { name: ['身輕如燕', 'Swallow-light'], col: '#ffd24a', desc: ['速度 ×1.5。', 'Speed ×1.5.'] },
  slow:    { name: ['氣滯', 'Sluggish'], bad: true, col: '#7a8aff', desc: ['氣血不暢，速度 ×0.5。', 'Blocked meridians: speed ×0.5.'] },
  stop:    { name: ['定身穴', 'Pinned'], bad: true, col: '#c0c0d8', desc: ['被點了定身穴，無法行動，也無法閃避。', 'A pressure point holds them: cannot act or dodge.'] },
  sleep:   { name: ['昏睡穴', 'Sleep'], bad: true, col: '#b0a0ff', desc: ['無法行動，受到攻擊就會醒來。', 'Cannot act; wakes when hit.'] },
  silence: { name: ['封脈', 'Sealed'], bad: true, col: '#d0d0d0', desc: ['經脈被封，無法運使內功。', 'Meridians sealed: no internal arts.'] },
  blind:   { name: ['目眩', 'Dazzled'], bad: true, col: '#a0a0b4', desc: ['眼前發花，招式命中大減。', 'Seeing stars: physical hit rate falls sharply.'] },
  protect: { name: ['金鐘罩', 'Golden Bell'], col: '#a0c8ff', desc: ['受到的外功傷害 ×2/3。', 'Physical damage taken ×2/3.'] },
  shell:   { name: ['護體真氣', 'Qi Shield'], col: '#e0a0ff', desc: ['受到的內功傷害 ×2/3。', 'Internal-art damage taken ×2/3.'] },
  berserk: { name: ['走火入魔', 'Qi Deviation'], bad: true, col: '#ff5a5a', desc: ['攻擊力 ×1.5，但神智不清，只會自己攻擊。', 'Attack ×1.5, but fights on its own, out of its mind.'] },
  doom:    { name: ['斷魂', 'Soul-cut'], bad: true, col: '#b47aff', desc: ['倒數結束時倒下。', 'Falls when the count runs out.'] },
  stun:    { name: ['震暈', 'Stunned'], bad: true, col: '#ffb070', desc: ['下一回合無法行動。', 'Loses its next turn.'] },
  charm:   { name: ['迷魂', 'Bewitched'], bad: true, col: '#ff8ad8', desc: ['暫時為敵方而戰。', 'Fights for the other side for a while.'] },
  float:   { name: ['凌空', 'Aloft'], col: '#c8f0ff', desc: ['輕功凌空，不受土屬性與地形影響。', 'Held aloft by qinggong: immune to earth and rough ground.'] },
  reflect: { name: ['移花接木', 'Borrowed Force'], col: '#f0f0ff', desc: ['把單體內功原樣送回。', 'Turns a single-target internal art back on its user.'] },
};

// short labels for the status tags over each unit on the map: [Chinese, English]
export const STATUS_SHORT = { poison: ['毒', 'PSN'], regen: ['息', 'RGN'], haste: ['快', 'HST'], slow: ['滯', 'SLW'], stop: ['定', 'PIN'], sleep: ['睡', 'SLP'], silence: ['封', 'SEAL'], blind: ['眩', 'DAZ'], protect: ['金鐘', 'BELL'], shell: ['護氣', 'QISH'], berserk: ['狂', 'MAD'], doom: ['斷魂', 'CUT'], stun: ['暈', 'STN'], charm: ['迷', 'CHM'], float: ['空', 'AIR'], reflect: ['移', 'RFL'] };
const BUF_SHORT = { atk: ['攻', 'ATK'], def: ['防', 'DEF'], mag: ['內', 'INT'], res: ['抗', 'RES'], spd: ['速', 'SPD'], eva: ['避', 'EVA'], mov: ['移', 'MOV'], jmp: ['輕', 'LEAP'] };
// every timed status (doom with its count) and every net stat change, as [label, colour]; standing statuses from gear (99) are left to the unit card
export function statusTags(u, all = false) {
  const out = [], L = (a) => a[EN ? 1 : 0];
  for (const k of Object.keys(u.st || {})) { const n = u.st[k]; if (!STATUS[k] || !n || (!all && n >= 90)) continue; out.push([L(STATUS_SHORT[k] || STATUS[k].name) + (k === 'doom' ? Math.ceil(n) : ''), STATUS[k].col]); }
  const net = {}; for (const b of u.buf || []) net[b.k] = (net[b.k] || 0) + b.p;
  for (const [k, p] of Object.entries(net)) if (p) out.push([L(BUF_SHORT[k] || [k, k]) + (p > 0 ? '↑' : '↓'), p > 0 ? '#7aff8a' : '#ff8a7a']);
  return out;
}

// stat buffs and debuffs carried as numbers on the unit: atk, def, mag, res, spd, eva (percent)
export const STATS = { hp: ['HP', 'HP'], mp: ['內力', 'Qi'], atk: ['外功', 'ATK'], def: ['防禦', 'DEF'], mag: ['內功', 'INT'], res: ['定力', 'RES'], spd: ['身法', 'SPD'], mov: ['移動', 'Move'], jmp: ['輕功', 'Leap'], eva: ['閃避', 'Evade'] };

// weapon kinds: how far they reach, what stat drives them, and how they hit
// range: [min, max]; arc: shoots over heads (bows); line: thrusts straight (spears); fix: damage from the device, not the arm; dual: may go in the off hand
export const WEAPONS = {
  dao:     { name: ['刀', 'Sabre'], range: [1, 1], stat: 'atk', dual: true },
  jian:    { name: ['劍', 'Sword'], range: [1, 1], stat: 'atk', dual: true },
  daidao:  { name: ['大刀', 'Great Blade'], range: [1, 1], stat: 'atk', two: true },
  bishou:  { name: ['匕首', 'Dagger'], range: [1, 1], stat: 'atk', spd: true, dual: true },
  qiang:   { name: ['槍', 'Spear'], range: [1, 2], stat: 'atk', line: true },
  gun:     { name: ['棍', 'Staff'], range: [1, 1], stat: 'atk' },
  chui:    { name: ['錘', 'Hammer'], range: [1, 1], stat: 'atk', dual: true },
  fuchen:  { name: ['拂塵', 'Whisk'], range: [1, 1], stat: 'mag' },
  mujian:  { name: ['桃木劍', 'Peachwood Sword'], range: [1, 1], stat: 'mag' },
  gong:    { name: ['弓', 'Bow'], range: [2, 5], stat: 'atk', arc: true, two: true },
  nu:      { name: ['弩', 'Crossbow'], range: [2, 4], stat: 'atk', two: true },
  jiguan:  { name: ['機關匣', 'Gadget Box'], range: [2, 6], stat: 'fix' },
  fulu:    { name: ['符籙', 'Talismans'], range: [1, 3], stat: 'mag' },
  qin:     { name: ['琴', 'Qin'], range: [1, 3], stat: 'mag', two: true },
  zhua:    { name: ['拳套', 'Fist Guards'], range: [1, 1], stat: 'atk', dual: true },
  shan:    { name: ['鐵扇', 'Iron Fan'], range: [1, 2], stat: 'atk' },
  bian:    { name: ['鞭', 'Whip'], range: [1, 2], stat: 'atk' },
  bi:      { name: ['判官筆', 'Brush'], range: [1, 3], stat: 'mag' },
  anqi:    { name: ['暗器', 'Hidden Weapons'], range: [1, 4], stat: 'atk' },
  qiu:     { name: ['球', 'Ball'], range: [1, 3], stat: 'atk', arc: true },
};

// equipment slots and the kinds of armour that go in them
export const SLOTS = { w: ['兵器', 'Weapon'], s: ['副手', 'Off-hand'], h: ['頭飾', 'Head'], b: ['衣甲', 'Body'], a: ['佩飾', 'Trinket'] };
export const ARMOURS = {
  shield: { name: ['藤牌', 'Shield'], slot: 's' }, helm: { name: ['盔', 'Helm'], slot: 'h' }, hat: { name: ['巾帽', 'Hat'], slot: 'h' },
  heavy: { name: ['鎧甲', 'Armour'], slot: 'b' }, light: { name: ['勁裝', 'Garb'], slot: 'b' }, robe: { name: ['長袍', 'Robe'], slot: 'b' },
  acc: { name: ['佩飾', 'Trinket'], slot: 'a' },
};

// ground on battle maps: colours for the top and the sides, whether you can stand on it, what it costs to cross
export const TERRAIN = {
  grass: { name: ['草地', 'Grass'], top: '#7c8c44', side: '#7a5434', el: 'wind' }, dirt: { name: ['黃土', 'Earth'], top: '#a8885a', side: '#6e4a2c', el: 'earth' },
  stone: { name: ['石板', 'Flagstones'], top: '#9e9684', side: '#6e6658', el: 'earth' }, sand: { name: ['沙地', 'Sand'], top: '#d8bf84', side: '#a88a5a', el: 'wind', cost: 2 },
  snow: { name: ['雪地', 'Snow'], top: '#e8eef2', side: '#a8b4c4', el: 'ice', cost: 2 }, ice: { name: ['冰面', 'Ice'], top: '#c8e8ff', side: '#7aa0c8', el: 'ice' },
  water: { name: ['淺灘', 'Shallows'], top: '#4282b0', side: '#2e5e86', el: 'water', cost: 2, low: true },
  deep: { name: ['深水', 'Deep water'], top: '#2f6488', side: '#1e4466', el: 'water', block: true }, swamp: { name: ['沼澤', 'Swamp'], top: '#5a7050', side: '#3e4c32', el: 'water', cost: 2, poison: true },
  lava: { name: ['熔岩', 'Lava'], top: '#e0501a', side: '#7a1a0a', el: 'fire', block: true }, wood: { name: ['木板', 'Planks'], top: '#a87a48', side: '#6a4a28', el: 'earth' },
  roof: { name: ['青瓦', 'Roof tiles'], top: '#56606e', side: '#e2dccc', el: 'wind' }, goldroof: { name: ['琉璃瓦', 'Glazed roof'], top: '#c8962e', side: '#a8382a', el: 'holy' },
  brick: { name: ['青磚', 'Grey bricks'], top: '#8a8c88', side: '#5e605c', el: 'earth' },
  marble: { name: ['白玉階', 'White jade'], top: '#ece4d4', side: '#b0a490', el: 'holy' }, moss: { name: ['青苔', 'Moss'], top: '#5e7a3e', side: '#4a4632', el: 'earth' },
  crystal: { name: ['水晶', 'Crystal'], top: '#7ac8d8', side: '#3a7a9a', el: 'water' }, ash: { name: ['灰燼', 'Ash'], top: '#6a625a', side: '#4a443e', el: 'dark' },
  cloud: { name: ['雲海', 'Cloudsea'], top: '#f0f4ff', side: '#c8d4f0', el: 'wind' }, void: { name: ['幽冥地', 'Netherstone'], top: '#3a2440', side: '#1a0e22', el: 'dark' },
  red: { name: ['朱漆地', 'Lacquer floor'], top: '#9a3a2e', side: '#5a1e16', el: 'fire' },
  tree: { name: ['樹木', 'Tree'], top: '#647a38', side: '#6a4a28', el: 'wind', block: true, obj: 'tree' }, rock: { name: ['岩石', 'Boulder'], top: '#8e8676', side: '#6a6458', el: 'earth', block: true, obj: 'rock' },
};
