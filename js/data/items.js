// Every piece of equipment and every pill and salve you can use.
// Gear is built from fixed tables, so an id always means the same thing (saves stay good between versions):
// 20 weapon kinds × 30, 6 armour kinds × 40, 160 trinkets, and the famous pieces of the jianghu made by hand.
import { WEAPONS } from './core.js';
import { r0 } from '../util.js';

export const ITEMS = {};
const add = (it) => { if (ITEMS[it.id]) throw new Error('item id twice: ' + it.id); ITEMS[it.id] = it; return it; };

// ---------------------------------------------------------------- materials, by tier 1-10
const METAL = [null, ['青銅', 'Bronze'], ['熟鐵', 'Wrought Iron'], ['百煉鋼', 'Hundred-forged'], ['鑌鐵', 'Bin Iron'], ['寒鐵', 'Cold Iron'], ['烏金', 'Black Gold'], ['玄鐵', 'Dark Iron'], ['赤霄', 'Crimson Sky'], ['隕鐵', 'Star Iron'], ['太阿', 'Tai\'e']];
const WOOD = [null, ['竹', 'Bamboo'], ['桑木', 'Mulberry'], ['柘木', 'Cudrania'], ['紫竹', 'Purple Bamboo'], ['鐵樺', 'Iron Birch'], ['沉香', 'Agarwood'], ['雷擊木', 'Thunderstruck'], ['千年桃', 'Thousand-year Peach'], ['扶桑', 'Fusang'], ['建木', 'Jianmu']];
const CLOTH = [null, ['麻', 'Hemp'], ['棉', 'Cotton'], ['絲', 'Silk'], ['錦', 'Brocade'], ['雲錦', 'Cloud Brocade'], ['冰蠶', 'Ice-silk'], ['金縷', 'Gold-thread'], ['天蠶', 'Heaven-silk'], ['霓裳', 'Rainbow'], ['天衣', 'Heaven-sewn']];
const HIDE = [null, ['皮', 'Leather'], ['牛皮', 'Oxhide'], ['犀皮', 'Rhino'], ['狼皮', 'Wolfhide'], ['虎皮', 'Tigerskin'], ['熊皮', 'Bearskin'], ['蛟皮', 'Jiao-skin'], ['麟皮', 'Qilin-hide'], ['龍皮', 'Dragonhide'], ['鳳羽', 'Phoenix-plume']];
const PAPER = [null, ['黃紙', 'Yellow Paper'], ['硃砂', 'Cinnabar'], ['古符', 'Old'], ['茅山', 'Maoshan'], ['龍虎山', 'Dragon-Tiger'], ['天師', 'Celestial Master\'s'], ['雷部', 'Thunder Ministry'], ['紫府', 'Purple Mansion'], ['太上', 'Most High'], ['天書', 'Heaven-script']];
// how strong each tier is, and roughly what it costs
const POW = [0, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78];
const PRICE = [0, 80, 200, 450, 900, 1600, 2700, 4200, 6500, 9800, 15000];

// ---------------------------------------------------------------- weapons: 20 kinds × (10 plain + 20 variants)
// [material set, nouns [zh, en] (one per third of the tiers), attack ×, inner power ×, extras]
const WKIND = {
  dao:     [METAL, [['刀', 'Sabre'], ['雁翎刀', 'Goose-feather Sabre'], ['環首刀', 'Ring-pommel Sabre']], 1.05, 0],
  jian:    [METAL, [['劍', 'Sword'], ['青鋒劍', 'Green-edge Sword'], ['龍泉劍', 'Dragon Spring Sword']], 1.0, 0.15],
  daidao:  [METAL, [['大刀', 'Great Blade'], ['偃月刀', 'Crescent Blade'], ['斬馬刀', 'Horse-cutter']], 1.25, 0],
  bishou:  [METAL, [['匕首', 'Dagger'], ['短劍', 'Dirk'], ['魚腸劍', 'Fish-gut Blade']], 0.8, 0, { spd: 1 }],
  qiang:   [METAL, [['槍', 'Spear'], ['長槍', 'Long Spear'], ['畫戟', 'Painted Halberd']], 1.05, 0],
  gun:     [WOOD, [['棍', 'Staff'], ['齊眉棍', 'Brow-high Staff'], ['盤龍棍', 'Coiled-dragon Staff']], 1.0, 0.1],
  chui:    [METAL, [['錘', 'Hammer'], ['金瓜錘', 'Melon Hammer'], ['八棱錘', 'Octagon Hammer']], 1.2, 0],
  fuchen:  [CLOTH, [['拂塵', 'Whisk'], ['雲帚', 'Cloud Whisk'], ['仙拂', 'Immortal\'s Whisk']], 0.5, 0.65],
  mujian:  [WOOD, [['桃木劍', 'Peachwood Sword'], ['七星劍', 'Seven-star Sword'], ['法劍', 'Rite Sword']], 0.5, 0.75],
  gong:    [WOOD, [['弓', 'Bow'], ['長弓', 'Longbow'], ['角弓', 'Horn Bow']], 0.95, 0],
  nu:      [METAL, [['弩', 'Crossbow'], ['臂張弩', 'Arm Crossbow'], ['連弩', 'Repeater']], 1.0, 0],
  jiguan:  [METAL, [['機關匣', 'Gadget Box'], ['連弩匣', 'Repeater Box'], ['霹靂匣', 'Thunder Box']], 0.7, 0],
  fulu:    [PAPER, [['符', 'Talisman'], ['符籙', 'Talisman Scroll'], ['寶籙', 'Precious Register']], 0.55, 0.6],
  qin:     [WOOD, [['琴', 'Qin'], ['古琴', 'Old Qin'], ['焦尾琴', 'Burnt-tail Qin']], 0.55, 0.55],
  zhua:    [METAL, [['拳套', 'Fist Guards'], ['鐵爪', 'Iron Claws'], ['虎爪', 'Tiger Claws']], 0.92, 0],
  shan:    [CLOTH, [['摺扇', 'Folding Fan'], ['鐵骨扇', 'Iron-ribbed Fan'], ['羽扇', 'Feather Fan']], 0.85, 0.25, { eva: 3 }],
  bian:    [HIDE, [['鞭', 'Whip'], ['長鞭', 'Lash'], ['九節鞭', 'Nine-section Whip']], 0.88, 0],
  bi:      [WOOD, [['毛筆', 'Brush'], ['判官筆', 'Judge\'s Brush'], ['如椽筆', 'Rafter Brush']], 0.55, 0.6],
  anqi:    [METAL, [['飛刀', 'Throwing Knives'], ['柳葉鏢', 'Willow-leaf Darts'], ['透骨釘', 'Bone-piercing Nails']], 0.85, 0, { eva: 2 }],
  qiu:     [HIDE, [['球', 'Ball'], ['蹴鞠', 'Cuju Ball'], ['風球', 'Wind Ball']], 0.95, 0, { spd: 1 }],
};
// the twenty variants every weapon kind gets: [id, 中文, English, first tier, what it changes]
const WVAR = [
  ['fire', '烈焰', 'Blazing', 2, (w) => { w.el = 'fire'; }], ['ice', '寒霜', 'Frost', 2, (w) => { w.el = 'ice'; }], ['bolt', '驚雷', 'Thunder', 3, (w) => { w.el = 'bolt'; }],
  ['wind', '疾風', 'Gale', 3, (w) => { w.el = 'wind'; }], ['earth', '厚土', 'Earthen', 4, (w) => { w.el = 'earth'; }], ['water', '流水', 'Flowing', 4, (w) => { w.el = 'water'; }],
  ['holy', '純陽', 'Pure-yang', 6, (w) => { w.el = 'holy'; }], ['dark', '九陰', 'Nine-yin', 6, (w) => { w.el = 'dark'; }],
  ['keen', '鋒銳', 'Keen', 2, (w) => { w.atk = r0(w.atk * 1.15); }], ['swift', '輕靈', 'Nimble', 3, (w) => { w.bonus = { spd: 1 + (w.tier >> 2) }; }],
  ['guard', '守心', 'Guarding', 3, (w) => { w.bonus = { def: 2 + w.tier }; }], ['sage', '通玄', 'Sagely', 4, (w) => { w.bonus = { mag: 2 + w.tier }; }],
  ['vamp', '嗜血', 'Bloodthirsty', 5, (w) => { w.fx = 'drain'; }], ['venom', '淬毒', 'Envenomed', 3, (w) => { w.onhit = ['poison', 25]; }],
  ['sleep', '迷魂', 'Drowsing', 4, (w) => { w.onhit = ['sleep', 15]; }], ['mute', '封脈', 'Sealing', 5, (w) => { w.onhit = ['silence', 20]; }],
  ['crit', '奪命', 'Deadly', 5, (w) => { w.crit = 10; }], ['hero', '俠義', 'Gallant', 7, (w) => { w.atk = r0(w.atk * 1.1); w.bonus = { atk: w.tier, def: w.tier }; }],
  ['royal', '御賜', 'Imperial', 8, (w) => { w.atk = r0(w.atk * 1.2); w.bonus = { spd: 1 }; }], ['star', '天外', 'Heaven-fallen', 9, (w) => { w.atk = r0(w.atk * 1.25); w.el = 'holy'; w.bonus = { mag: 5 }; }],
];
for (const [kind, [mats, nouns, am, mm, extra = {}]] of Object.entries(WKIND)) {
  const make = (t, v) => {
    const noun = nouns[Math.min(2, Math.floor((t - 1) / 4))], mat = mats[t];
    const w = { id: `${kind}${t}${v ? '_' + v[0] : ''}`, slot: 'w', type: kind, tier: t, atk: Math.max(1, r0(POW[t] * am)), price: r0(PRICE[t] * (v ? 1.5 : 1)), two: !!WEAPONS[kind].two };
    if (mm) w.mag = Math.max(1, r0(POW[t] * mm));
    if (extra.spd) w.bonus = { spd: 1 }; if (extra.eva) w.eva = extra.eva;
    w.name = v ? [`${v[1]}${mat[0]}${noun[0]}`, `${v[2]} ${mat[1]} ${noun[1]}`] : [`${mat[0]}${noun[0]}`, `${mat[1]} ${noun[1]}`];
    if (v) { v[4](w); w.variant = v[0]; }
    return add(w);
  };
  for (let t = 1; t <= 10; t++) make(t, null);
  // each variant appears at a tier between its first tier and 10, spread so every kind has a different mix
  WVAR.forEach((v, i) => { const t = Math.min(10, v[3] + ((i * 7 + kind.length * 3) % (11 - v[3]))); make(t, v); });
}

// ---------------------------------------------------------------- armour: 6 kinds × 40 (10 plain + 30 variants)
const AKIND = {
  heavy:  [METAL, [['鐵甲', 'Mail'], ['鎖子甲', 'Chain Mail'], ['明光鎧', 'Mingguang Armour']], 'b', { def: 1.0, hp: 1.0 }],
  light:  [HIDE, [['勁裝', 'Fighting Garb'], ['夜行衣', 'Night Garb'], ['軟甲', 'Soft Armour']], 'b', { def: 0.7, hp: 0.6, eva: 1 }],
  robe:   [CLOTH, [['長袍', 'Robe'], ['道袍', 'Daoist Robe'], ['鶴氅', 'Crane Cloak']], 'b', { def: 0.45, hp: 0.4, res: 0.6, mag: 0.3, mp: 1 }],
  shield: [WOOD, [['藤牌', 'Rattan Shield'], ['圓盾', 'Round Shield'], ['虎頭牌', 'Tiger Shield']], 's', { def: 0.4, eva: 2 }],
  helm:   [METAL, [['盔', 'Helm'], ['兜鍪', 'War Helm'], ['鳳翅盔', 'Phoenix-wing Helm']], 'h', { def: 0.5, hp: 0.5 }],
  hat:    [CLOTH, [['頭巾', 'Headcloth'], ['斗笠', 'Bamboo Hat'], ['冠', 'Crown']], 'h', { def: 0.3, res: 0.3, mag: 0.2 }],
};
const AVAR = [
  ['fireward', '避火', 'Fireproof', 2, (a) => { a.resist = ['fire']; }], ['iceward', '禦寒', 'Frostproof', 2, (a) => { a.resist = ['ice']; }], ['boltward', '避雷', 'Thunderproof', 3, (a) => { a.resist = ['bolt']; }],
  ['windward', '擋風', 'Windproof', 3, (a) => { a.resist = ['wind']; }], ['earthward', '岩紋', 'Stoneward', 3, (a) => { a.resist = ['earth']; }], ['waterward', '避水', 'Watertight', 3, (a) => { a.resist = ['water']; }],
  ['holyward', '純陽', 'Yang-warded', 6, (a) => { a.resist = ['holy']; }], ['darkward', '辟邪', 'Yin-warded', 6, (a) => { a.resist = ['dark']; }],
  ['sturdy', '堅固', 'Sturdy', 2, (a) => { a.def = r0(a.def * 1.2); }], ['light2', '輕盈', 'Featherlight', 2, (a) => { a.bonus = { spd: 1 }; }],
  ['vigor', '強身', 'Vigorous', 3, (a) => { a.hp = (a.hp || 0) + 10 * a.tier; }], ['mana', '養氣', 'Qi-woven', 3, (a) => { a.mp = (a.mp || 0) + 5 * a.tier; }],
  ['might', '力士', 'Mighty', 4, (a) => { a.bonus = { atk: 1 + a.tier }; }], ['wisdom', '玄妙', 'Mystic', 4, (a) => { a.bonus = { mag: 1 + a.tier }; }],
  ['ward', '定神', 'Steadying', 4, (a) => { a.bonus = { res: 2 + a.tier }; }], ['nimble', '靈巧', 'Nimble', 4, (a) => { a.eva = (a.eva || 0) + 5; }],
  ['antipoison', '避毒', 'Antivenom', 2, (a) => { a.immune = ['poison']; }], ['antiblind', '明目', 'Clear-eyed', 3, (a) => { a.immune = ['blind']; }],
  ['antisilence', '通脈', 'Open-meridian', 4, (a) => { a.immune = ['silence']; }], ['antisleep', '醒神', 'Wakeful', 4, (a) => { a.immune = ['sleep']; }],
  ['antistop', '解穴', 'Point-proof', 7, (a) => { a.immune = ['stop', 'slow']; }], ['anticharm', '堅心', 'Steadfast', 6, (a) => { a.immune = ['charm', 'berserk']; }],
  ['regen', '回春', 'Renewing', 6, (a) => { a.auto = 'regen'; }], ['protect', '金鐘', 'Golden-bell', 5, (a) => { a.auto = 'protect'; }],
  ['shell', '護氣', 'Qi-shielding', 5, (a) => { a.auto = 'shell'; }], ['haste', '神行', 'Swift-footed', 8, (a) => { a.auto = 'haste'; }],
  ['float', '凌雲', 'Cloud-borne', 5, (a) => { a.auto = 'float'; }], ['jp', '修行', 'Ascetic', 3, (a) => { a.jpup = 20; }],
  ['royal', '御賜', 'Imperial', 8, (a) => { a.def = r0(a.def * 1.25); a.hp = (a.hp || 0) + 50; }], ['star', '天外', 'Heaven-fallen', 9, (a) => { a.def = r0(a.def * 1.3); a.bonus = { mag: 6, res: 6 }; a.resist = ['holy', 'dark']; }],
];
for (const [kind, [mats, nouns, slot, f]] of Object.entries(AKIND)) {
  const make = (t, v) => {
    const noun = nouns[Math.min(2, Math.floor((t - 1) / 4))], mat = mats[t];
    const a = { id: `${kind}${t}${v ? '_' + v[0] : ''}`, slot, type: kind, tier: t, def: Math.max(1, r0(POW[t] * f.def)), price: r0(PRICE[t] * 0.8 * (v ? 1.5 : 1)) };
    if (f.hp) a.hp = r0(POW[t] * 2 * f.hp); if (f.res) a.bonus = { res: r0(POW[t] * f.res) }; if (f.mag) a.bonus = { ...a.bonus, mag: r0(POW[t] * f.mag) };
    if (f.mp) a.mp = 4 * t; if (f.eva) a.eva = f.eva * (kind === 'shield' ? 5 + t : 2 + (t >> 1));
    a.name = v ? [`${v[1]}${mat[0]}${noun[0]}`, `${v[2]} ${mat[1]} ${noun[1]}`] : [`${mat[0]}${noun[0]}`, `${mat[1]} ${noun[1]}`];
    if (v) { const keep = a.bonus; v[4](a); if (keep && a.bonus !== keep) a.bonus = { ...keep, ...a.bonus }; a.variant = v[0]; }
    return add(a);
  };
  for (let t = 1; t <= 10; t++) make(t, null);
  AVAR.forEach((v, i) => { const t = Math.min(10, v[3] + ((i * 5 + kind.length * 2) % (11 - v[3]))); make(t, v); });
}

// ---------------------------------------------------------------- trinkets: 8 kinds × 20
const ACC = [
  ['pendant', ['玉佩', 'Pendant']], ['sachet', ['香囊', 'Sachet']], ['boots', ['靴', 'Boots']], ['cloak', ['披風', 'Cloak']],
  ['bracer', ['護腕', 'Bracer']], ['ring', ['扳指', 'Thumb Ring']], ['beads', ['念珠', 'Beads']], ['hairpin', ['髮簪', 'Hairpin']],
];
// [id, 中文, English, what it does at tier t]
const AEFF = [
  ['atk', '力', 'Might', (a, t) => { a.bonus = { atk: 2 + t * 2 }; }], ['mag', '玄', 'the Mystic', (a, t) => { a.bonus = { mag: 2 + t * 2 }; }],
  ['def', '守', 'Guarding', (a, t) => { a.bonus = { def: 2 + t * 2 }; }], ['res', '定', 'Calm', (a, t) => { a.bonus = { res: 2 + t * 2 }; }],
  ['spd', '疾', 'Speed', (a, t) => { a.bonus = { spd: 1 + (t >> 2) }; }], ['hp', '命', 'Life', (a, t) => { a.hp = 20 + t * 25; }],
  ['mp', '氣', 'Qi', (a, t) => { a.mp = 10 + t * 8; }], ['eva', '影', 'Shadows', (a, t) => { a.eva = 5 + t * 2; }],
  ['move', '行', 'Striding', (a, t) => { a.mov = t >= 6 ? 2 : 1; }], ['jump', '躍', 'Leaping', (a, t) => { a.jmp = t >= 6 ? 2 : 1; }],
  ['regen', '春', 'Renewal', (a) => { a.auto = 'regen'; }], ['protect', '金鐘', 'the Golden Bell', (a) => { a.auto = 'protect'; }],
  ['shell', '護氣', 'the Qi Shield', (a) => { a.auto = 'shell'; }], ['haste', '燕', 'the Swallow', (a) => { a.auto = 'haste'; }],
  ['float', '雲', 'Clouds', (a) => { a.auto = 'float'; }], ['reflect', '鏡', 'the Mirror', (a) => { a.auto = 'reflect'; }],
  ['immune', '清', 'Purity', (a, t) => { a.immune = t >= 6 ? ['poison', 'blind', 'silence', 'sleep', 'stop', 'slow', 'berserk', 'charm', 'doom'] : ['poison', 'blind', 'silence']; }],
  ['absorbfire', '火龍', 'the Fire Dragon', (a) => { a.absorb = ['fire']; }], ['jp', '悟', 'Insight', (a, t) => { a.jpup = 10 + t * 3; }], ['exp', '歷', 'the Veteran', (a, t) => { a.expup = 10 + t * 3; }],
];
ACC.forEach(([kind, noun], ki) => AEFF.forEach(([eid, zh, en, f], ei) => {
  const t = 1 + ((ei * 3 + ki * 2) % 10), mat = (kind === 'cloak' || kind === 'sachet' ? CLOTH : kind === 'beads' ? WOOD : kind === 'boots' ? HIDE : METAL)[t];
  const a = { id: `${kind}_${eid}`, slot: 'a', type: 'acc', kind, tier: t, price: r0(PRICE[t] * 0.9), name: [`${mat[0]}${noun[0]}・${zh}`, `${mat[1]} ${noun[1]} of ${en}`] };
  f(a, t); add(a);
}));

// ---------------------------------------------------------------- the famous pieces of the jianghu (found, never sold)
// [id, slot/type, 中文, English, tier, stats]
const LEG = [
  ['ex_jiudao', 'w:dao', '舊環首刀', 'The Old Ring-pommel', 5, { atk: 34, crit: 5, bonus: { spd: 1 }, note: ['奕叡背了一路的舊刀。刀環磨得發亮。', 'The old sabre Yi Rui has carried all along. Its ring is worn bright.'] }],
  ['ex_longmendao', 'w:dao', '龍門寶刀', 'Treasure Sabre of Longmen', 10, { atk: 96, el: 'wind', crit: 10, bonus: { spd: 2 }, note: ['龍門刀莊代代相傳的寶刀，刀身上刻著一尾躍門的鯉魚。', 'The heirloom of the Longmen Sabre Manor; a carp leaping the Dragon Gate is cut into the blade.'] }],
  ['ex_xuandao', 'w:daidao', '玄武重刀', 'Black Tortoise Great Blade', 10, { atk: 115, bonus: { def: 15 }, auto: 'protect', note: ['重得要兩個人才抬得起來的大刀。', 'A great blade it takes two men to lift.'] }],
  ['ex_shuanghua', 'w:jian', '霜華劍', 'Frost Bloom', 10, { atk: 92, mag: 30, el: 'ice', auto: 'haste', note: ['劍身起霜的名劍，出鞘時屋簷結冰。', 'A famous sword that frosts over; the eaves ice up when it is drawn.'] }],
  ['ex_hanjiangjian', 'w:jian', '寒江細劍', 'Cold River Rapier', 7, { atk: 52, mag: 18, el: 'ice', eva: 10, note: ['柳寒煙年輕時用過的細劍。', 'The slim sword Liu Hanyan carried when she was young.'] }],
  ['ex_wuying', 'w:bishou', '無影匕', 'Shadowless Dagger', 9, { atk: 64, bonus: { spd: 3 }, steal: 30, note: ['據說刺進去也看不見刀光。', 'They say no gleam shows even as it goes in.'] }],
  ['ex_youlong', 'w:qiang', '遊龍槍', 'Roaming Dragon Spear', 10, { atk: 102, el: 'wind', jmp: 2, note: ['槍尖抖起來像一條遊龍。', 'Its tip shivers like a swimming dragon.'] }],
  ['ex_jingang', 'w:gun', '金剛棍', 'Vajra Staff', 10, { atk: 98, mag: 25, el: 'holy', onhit: ['stun', 25], note: ['千佛寺鎮寺的鐵棍。', 'The iron staff that guards the Thousand Buddha Temple.'] }],
  ['ex_leigong', 'w:chui', '雷公錘', 'Thunder Lord\'s Hammer', 10, { atk: 112, el: 'bolt', onhit: ['stun', 20], note: ['錘一落，雷就響。', 'Where it falls, thunder follows.'] }],
  ['ex_baiyun', 'w:fuchen', '白雲拂', 'White Cloud Whisk', 10, { atk: 40, mag: 72, healpow: 30, note: ['慈雲庵歷代住持的拂塵。', 'The whisk of every abbess of the Mercy Cloud Nunnery.'] }],
  ['ex_qixing', 'w:mujian', '七星法劍', 'Seven-star Rite Sword', 10, { atk: 42, mag: 80, el: 'bolt', note: ['劍上嵌著七顆星的法劍，一揮就落雷。', 'A rite sword set with seven stars; one swing calls down thunder.'] }],
  ['ex_luori', 'w:gong', '落日弓', 'Sunset Bow', 10, { atk: 92, range: 1, el: 'fire', note: ['據說射下過太陽的弓。', 'A bow said to have shot down a sun.'] }],
  ['ex_pili', 'w:nu', '霹靂神弩', 'Thunderclap Crossbow', 10, { atk: 98, onhit: ['stun', 20], note: ['一次能射十支箭的神弩。', 'A great crossbow that looses ten bolts at once.'] }],
  ['ex_luban', 'w:jiguan', '魯班匣', 'Master Lu\'s Box', 10, { atk: 72, el: 'fire', itempow: 30, note: ['據說是魯班留下的機關匣。', 'A gadget box said to come down from Lu Ban himself.'] }],
  ['ex_tianshu', 'w:fulu', '太上天書', 'Book of the Most High', 10, { atk: 50, mag: 76, el: 'holy', halfmp: 1, note: ['寫滿看不懂的符的天書。', 'A heavenly book full of talismans no one can read.'] }],
  ['ex_jiaowei', 'w:qin', '焦尾古琴', 'The Burnt-tail Qin', 10, { atk: 45, mag: 72, songpow: 40, note: ['琴尾燒焦了一塊，聲音卻天下第一。', 'Its tail is scorched, yet its voice is the finest under heaven.'] }],
  ['ex_longzhua', 'w:zhua', '龍爪手套', 'Dragon Claw Gauntlets', 10, { atk: 100, bonus: { spd: 2 }, note: ['拳聖留下的手套。', 'Gauntlets a fist saint left behind.'] }],
  ['ex_yushan', 'w:shan', '白羽扇', 'White Feather Fan', 10, { atk: 82, mag: 40, el: 'wind', ctdown: 30, note: ['軍師搖了一輩子的羽扇。', 'The fan a strategist waved all his life.'] }],
  ['ex_jiulong', 'w:bian', '九龍鞭', 'Nine Dragon Whip', 10, { atk: 90, onhit: ['stop', 15], invite: 20, note: ['連猛虎都會乖乖趴下的鞭子。', 'Even a tiger lies down meekly before it.'] }],
  ['ex_chunqiu', 'w:bi', '春秋筆', 'Spring and Autumn Brush', 10, { atk: 50, mag: 78, el: 'water', note: ['一筆寫得出一部史書。', 'One stroke writes a whole history.'] }],
  ['ex_baiyu', 'w:anqi', '白羽飛刀', 'White-feather Knives', 10, { atk: 88, crit: 15, range: 1, note: ['刀柄繫著白羽的飛刀，從不虛發。', 'Throwing knives tied with white feathers. They never miss.'] }],
  ['ex_fengqiu', 'w:qiu', '旋風金球', 'Golden Whirlwind Ball', 10, { atk: 90, el: 'wind', bonus: { spd: 3 }, note: ['用金線縫的蹴鞠，踢出去會自己轉彎。', 'A cuju ball sewn with gold thread; it bends in the air by itself.'] }],
  ['ex_xuedao', 'w:daidao', '血刀', 'The Blood Sabre', 9, { atk: 90, fx: 'drain', crit: 10, note: ['厲寒山的血紅長刀。', 'Li Hanshan\'s blood-red blade.'] }],
  ['ex_baigu', 'w:shan', '白骨扇', 'Bone Fan', 9, { atk: 70, mag: 50, el: 'dark', onhit: ['silence', 25], note: ['幽冥教主的白骨扇，扇骨冷得像冰。', 'The Netherworld master\'s bone fan, its ribs cold as ice.'] }],
  ['ex_tiesuo', 'w:bian', '執法鐵鍊', 'Law Hall Chain', 8, { atk: 64, onhit: ['stop', 20], bonus: { def: 8 }, note: ['執法堂的鐵鍊，一環刻著一條律條。', 'The Law Hall\'s chain, a statute carved on every link.'] }],
  ['ex_yugan', 'w:gun', '漁翁釣竿', 'Fisherman\'s Rod', 8, { atk: 58, range: 1, bonus: { spd: 2 }, note: ['斷崖下那位老漁翁的釣竿。釣魚，也釣人。', 'The old fisherman\'s rod from below the cliff. It catches fish, and people.'] }],
  // armour
  ['ex_jinsi', 'b:light', '金絲軟甲', 'Gold-thread Vest', 10, { def: 65, eva: 15, bonus: { spd: 2 }, immune: ['poison'], note: ['刀劍不入的金絲軟甲。', 'A gold-thread vest no blade can pierce.'] }],
  ['ex_tiancan', 'b:robe', '天蠶寶衣', 'Heaven-silk Robe', 10, { def: 50, mp: 120, bonus: { mag: 25, res: 30 }, auto: 'regen', note: ['天蠶絲織的寶衣，輕得像沒穿。', 'Woven of heaven-silk; as light as wearing nothing.'] }],
  ['ex_mingguang', 'b:heavy', '明光寶鎧', 'Mingguang Treasure Armour', 10, { def: 95, hp: 300, auto: 'protect', note: ['胸前兩面護心鏡亮得照人。', 'Its two breast-mirrors shine bright enough to see your face.'] }],
  ['ex_jiasha', 'b:robe', '紅錦袈裟', 'Red Brocade Kasaya', 9, { def: 44, mp: 80, bonus: { res: 25 }, immune: ['charm', 'berserk'], note: ['苦禪大師的袈裟。', 'Master Kuchan\'s kasaya.'] }],
  ['ex_yexing', 'b:light', '烏夜行衣', 'Raven Night Garb', 9, { def: 58, eva: 20, bonus: { spd: 2 }, note: ['穿上就溶進夜色裡。', 'Put it on and you melt into the night.'] }],
  ['ex_longlin', 'b:heavy', '龍鱗甲', 'Dragon-scale Armour', 10, { def: 100, hp: 250, resist: ['fire', 'ice', 'bolt'], absorb: ['water'], note: ['水晶宮裡龍王脫下的鱗。', 'Scales the Dragon King shed in the Crystal Palace.'] }],
  ['ex_shengyi', 'b:robe', '武聖布衣', 'The Saint\'s Plain Robe', 10, { def: 60, hp: 200, bonus: { atk: 15, mag: 15 }, note: ['古墓裡那位武聖穿的布衣，平凡得出奇。', 'The plain robe of the saint in the tomb; strangely ordinary.'] }],
  ['ex_fengchi', 'h:helm', '鳳翅金盔', 'Golden Phoenix-wing Helm', 10, { def: 55, hp: 150, bonus: { atk: 10 }, immune: ['stun', 'stop'], note: ['兩邊插著金鳳翅的頭盔。', 'A helm with golden phoenix wings on either side.'] }],
  ['ex_douli', 'h:hat', '漁翁斗笠', 'Fisherman\'s Straw Hat', 8, { def: 26, eva: 15, immune: ['blind', 'sleep'], note: ['舊斗笠，雨水從來打不濕底下的眼睛。', 'An old straw hat; the rain never reaches the eyes beneath.'] }],
  ['ex_zijin', 'h:hat', '紫金冠', 'Purple-gold Crown', 10, { def: 40, bonus: { mag: 20, res: 20 }, auto: 'regen', note: ['少年英雄頭上的紫金冠。', 'The purple-gold crown of a young hero.'] }],
  ['ex_guimianju', 'h:hat', '鬼面具', 'Ghost Mask', 9, { def: 32, bonus: { atk: 12 }, immune: ['charm', 'berserk'], note: ['幽冥教護法的白色鬼面。戴上誰都認不出你。', 'The white ghost mask of a Netherworld warden. No one knows you behind it.'] }],
  ['ex_xuanwudun', 's:shield', '玄武盾', 'Black Tortoise Shield', 10, { def: 50, eva: 28, resist: ['holy', 'dark'], note: ['龜甲做成的大盾。', 'A great shield of tortoise shell.'] }],
  ['ex_baguajing', 's:shield', '八卦鏡盾', 'Eight-trigram Mirror Shield', 9, { def: 40, eva: 22, auto: 'reflect', note: ['盾心嵌著一面八卦鏡，內功打上去會彈回去。', 'An eight-trigram mirror in its boss turns internal arts back.'] }],
  ['ex_hutou', 's:shield', '虎頭藤牌', 'Tiger-head Rattan Shield', 7, { def: 32, eva: 20, bonus: { atk: 5 }, note: ['鏢局傳了三代的藤牌，牌上畫著虎頭。', 'A rattan shield three generations of escorts have carried, a tiger\'s head painted on it.'] }],
  // trinkets
  ['ex_longmenyu', 'a:acc', '龍門玉佩', 'Longmen Jade', 4, { bonus: { atk: 5, def: 5 }, jpup: 20, note: ['兄弟倆的娘留下的一對玉佩，一人一塊。', 'A pair of jades their mother left them, one for each brother.'] }],
  ['ex_ruyi', 'a:acc', '如意珠', 'Wish Pearl', 10, { bonus: { atk: 15, mag: 15, spd: 2 }, auto: 'regen', note: ['摸起來是溫的珠子。', 'A pearl that is warm to the touch.'] }],
  ['ex_yeming', 'a:acc', '夜明珠', 'Night-shining Pearl', 9, { bonus: { mag: 25 }, ctdown: 30, note: ['在黑夜裡照亮一間屋子的明珠。', 'A pearl that lights a room at night.'] }],
  ['ex_jinsuo', 'a:acc', '護命金鎖', 'Life-guard Gold Lock', 10, { auto: 'regen', undying: 1, note: ['戴著它的人只會倒下一次，然後再站起來。', 'Its wearer falls once, and rises again.'] }],
  ['ex_shenxing', 'a:acc', '神行靴', 'Swift-walker Boots', 10, { mov: 2, jmp: 2, auto: 'haste', note: ['一天走八百里的靴子。', 'Boots that walk eight hundred li a day.'] }],
  ['ex_bidu', 'a:acc', '避毒珠', 'Poison-warding Pearl', 9, { immune: ['poison', 'blind', 'silence', 'sleep', 'stop', 'slow', 'berserk', 'charm', 'doom', 'stun'], bonus: { res: 10 }, note: ['含在嘴裡，百毒不侵。', 'Hold it in your mouth and no poison takes.'] }],
  ['ex_fenghuang', 'a:acc', '鳳凰翎', 'Phoenix Plume', 8, { auto: 'regen', bonus: { res: 12 }, note: ['一根永遠不會褪色的羽毛。', 'A feather that never fades.'] }],
  ['ex_suanpan', 'a:acc', '金珠算盤', 'Gold-bead Abacus', 6, { gold: 50, bonus: { mag: 6 }, steal: 10, note: ['錢萬里的算盤，算得清天下的帳。', 'Qian Wanli\'s abacus; it can reckon every account under heaven.'] }],
  ['ex_qilin', 'a:acc', '麒麟角', 'Qilin Horn', 10, { bonus: { atk: 15, def: 15, mag: 15, res: 15, spd: 1 }, note: ['只有仁者才配得上的角。', 'A horn only the benevolent are worthy of.'] }],
  ['ex_xueyu', 'a:acc', '血玉扳指', 'Blood-jade Thumb Ring', 8, { drain: 1, bonus: { atk: 12 }, note: ['戴久了會變紅的玉扳指。', 'A jade ring that reddens the longer it is worn.'] }],
  ['ex_longyan', 'a:acc', '龍眼石', 'Dragon-eye Stone', 9, { crit: 20, bonus: { atk: 10 }, range: 1, note: ['能看穿一切的寶石。', 'A stone said to see through anything.'] }],
  ['ex_zhenyuan', 'a:acc', '鎮元珠', 'Origin Pearl', 10, { mp: 150, halfmp: 1, bonus: { mag: 15 }, note: ['內力取之不盡的寶珠。', 'A pearl of endless inner strength.'] }],
  ['ex_qinglian', 'a:acc', '青蓮念珠', 'Blue Lotus Beads', 8, { ctdown: 40, bonus: { res: 10 }, note: ['數著念珠，蓄氣就快了。', 'Count the beads and the charge comes quicker.'] }],
  ['ex_shouling', 'a:acc', '獸王鈴', 'Beast King\'s Bell', 9, { invite: 30, bonus: { spd: 1 }, vsbeast: 0, note: ['搖一下，野獸就會抬頭看你。', 'Ring it and every beast looks up at you.'] }],
  ['ex_shuangren', 'a:acc', '雙刃護腕', 'Twin-blade Bracers', 9, { dual: 1, bonus: { atk: 10 }, note: ['戴上它就能左右手各持一把兵器。', 'Lets its wearer wield a weapon in each hand.'] }],
  ['ex_mengmian', 'a:acc', '黑紗', 'Black Veil', 7, { eva: 15, steal: 15, note: ['蒙面用的黑紗。', 'A black cloth for hiding a face.'] }],
];
for (const [id, st, zh, en, tier, o] of LEG) {
  const [slot, type] = st.split(':'), it = { id, slot, type, tier, name: [zh, en], price: 0, legend: true, ...o };
  if (slot === 'w') it.two = !!WEAPONS[type].two;
  add(it);
}

// ---------------------------------------------------------------- pills and salves to use in battle
export const CONSUMABLES = {
  potion:   { name: ['金創藥', 'Wound Salve'], price: 50, h: ['fix', 60], tier: 1 },
  hipotion: { name: ['小還丹', 'Lesser Return Pill'], price: 200, h: ['fix', 160], tier: 3 },
  xpotion:  { name: ['大還丹', 'Greater Return Pill'], price: 700, h: ['fix', 450], tier: 6 },
  ether:    { name: ['回氣丹', 'Qi Pill'], price: 200, mph: 30, tier: 2 },
  hiether:  { name: ['九轉回氣丹', 'Ninefold Qi Pill'], price: 600, mph: 90, tier: 5 },
  phoenix:  { name: ['續命丹', 'Life-thread Pill'], price: 300, rev: 0.25, dead: true, tier: 1 },
  antidote: { name: ['解毒丹', 'Antidote Pill'], price: 30, cure: ['poison'], tier: 1 },
  eyedrops: { name: ['明目散', 'Clear-eye Powder'], price: 30, cure: ['blind'], tier: 1 },
  echo:     { name: ['通脈散', 'Meridian Powder'], price: 60, cure: ['silence'], tier: 2 },
  remedy:   { name: ['萬應丹', 'Panacea'], price: 400, cure: ['poison', 'blind', 'silence', 'sleep', 'slow', 'stop', 'berserk', 'charm', 'stun'], tier: 4 },
  holywater:{ name: ['鎮魂符', 'Soul-binding Charm'], price: 300, cure: ['doom'], tier: 3 },
  elixir:   { name: ['九轉還魂丹', 'Ninefold Soul Pill'], price: 0, h: ['pct', 1], mph: 999, tier: 9 },
};
for (const [id, c] of Object.entries(CONSUMABLES)) { c.id = id; c.use = true; c.desc = c.desc || null; }

// ---------------------------------------------------------------- helpers
export const GEAR = Object.values(ITEMS);
export const gearOfTier = (t, filter = () => true) => GEAR.filter((g) => g.tier === t && !g.legend && filter(g));
// the plain pieces a shop at this tier sells
export const shopStock = (tier) => GEAR.filter((g) => !g.legend && !g.variant && g.tier <= tier && g.tier >= Math.max(1, tier - 2) && g.slot !== 'a').concat(GEAR.filter((g) => g.slot === 'a' && g.tier <= Math.max(1, tier - 1) && ['atk', 'mag', 'def', 'res', 'hp', 'immune', 'move', 'jump'].some((e) => g.id.endsWith('_' + e))));
export const consumablesFor = (tier) => Object.values(CONSUMABLES).filter((c) => c.price && c.tier <= tier);
