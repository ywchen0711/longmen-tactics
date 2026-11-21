// Beasts and creatures of the jianghu: every common foe and great beast of the Character Gallery, in families with
// their own skills and what they leave behind. People (bandits, sect troops, assassins) are made from the jobs instead.
import { act, rea } from './jobdefs.js';
import { ART } from '../art.js';

// creature skills use the same fields as job abilities
export const MSKILLS = Object.fromEntries([
  act('m_bite', '撕咬', 'Bite', 0, { d: ['atk', 1.1] }),
  act('m_claw', '利爪', 'Rend', 0, { d: ['atk', 1.2] }),
  act('m_howl', '長嚎', 'Howl', 0, { r: 0, a: 2, t: 'ally', buf: [['atk', 20, 3]] }),
  act('m_pounce', '飛撲', 'Pounce', 0, { r: 3, d: ['atk', 1.0] }),
  act('m_tusk', '獠牙', 'Tusk', 0, { d: ['atk', 1.15] }),
  act('m_charge', '橫衝直撞', 'Stampede', 0, { r: 2, a: 'line', d: ['atk', 1.0], st: [['stun', 25, 1]] }),
  act('m_venom', '毒牙', 'Venom Fang', 0, { d: ['atk', 0.9], st: [['poison', 60, 4]] }),
  act('m_constrict', '纏繞', 'Constrict', 0, { d: ['atk', 1.0], st: [['stop', 25, 1]] }),
  act('m_drain', '吸血', 'Blood Drink', 0, { d: ['atk', 0.9], drain: true }),
  act('m_screech', '尖嘯', 'Screech', 0, { r: 0, a: 2, st: [['blind', 30, 2]] }),
  act('m_pincer', '巨鉗', 'Pincer', 0, { d: ['atk', 1.2], buf: [['def', -15, 3]] }),
  act('m_bubble', '吐泡', 'Bubbles', 0, { r: 3, d: ['mag', 0.8, 'water'], st: [['slow', 30, 2]] }),
  act('m_snatch', '搶奪', 'Snatch', 0, { hit: 55, steal: 'item' }),
  act('m_stone', '丟石頭', 'Throw Stone', 0, { r: 4, d: ['atk', 0.8] }),
  act('m_flame', '鬼火', 'Ghost Fire', 0, { r: 3, a: 1, d: ['mag', 1.1, 'fire'], magic: true, mp: 6 }),
  act('m_curse', '詛咒', 'Curse', 0, { r: 3, st: [['silence', 40, 3], ['blind', 30, 3]], magic: true, mp: 4 }),
  act('m_smash', '巨力', 'Smash', 0, { d: ['atk', 1.5], ct: 1 }),
  act('m_quake', '震地', 'Quake', 0, { r: 0, a: 2, d: ['atk', 1.0, 'earth'] }),
  act('m_sting', '毒針', 'Sting', 0, { d: ['atk', 1.0], st: [['poison', 50, 3]] }),
  act('m_swarm', '蜂擁', 'Swarm', 0, { r: 2, a: 1, d: ['atk', 0.7] }),
  act('m_root', '根縛', 'Root Snare', 0, { r: 3, st: [['stop', 30, 2]], d: ['atk', 0.5, 'earth'] }),
  act('m_spore', '孢子', 'Spores', 0, { r: 0, a: 2, st: [['sleep', 35, 2], ['poison', 35, 3]] }),
  act('m_bone', '骨刃', 'Bone Blade', 0, { d: ['atk', 1.1, 'dark'] }),
  act('m_hop', '跳屍撲', 'Hopping Lunge', 0, { r: 3, jump: true, ct: 1, d: ['atk', 1.3] }),
  act('m_touch', '陰風', 'Yin Wind', 0, { d: ['mag', 1.0, 'dark'], drain: true, magic: true }),
  act('m_wail', '哀號', 'Wail', 0, { r: 0, a: 2, st: [['sleep', 30, 2]], magic: true, mp: 6 }),
  act('m_tongue', '長舌', 'Long Tongue', 0, { r: 3, d: ['atk', 0.9], st: [['slow', 35, 2]] }),
  act('m_spit', '毒漿', 'Venom Spray', 0, { r: 3, a: 1, d: ['mag', 0.9], st: [['poison', 50, 3]] }),
  act('m_bell', '鈴音', 'Bell Toll', 0, { r: 0, a: 3, st: [['charm', 25, 2]], magic: true, mp: 10 }),
  act('m_regenerate', '吐納', 'Regenerate', 0, { r: 0, t: 'self', h: ['pct', 0.25] }),
  act('m_thunder', '引雷', 'Draw Lightning', 0, { r: 4, a: 1, d: ['mag', 1.2, 'bolt'], magic: true, mp: 8 }),
  act('m_frost', '寒氣', 'Cold Breath', 0, { r: 3, a: 'line', d: ['mag', 1.2, 'ice'] }),
  act('m_firebreath', '火焰', 'Fire Breath', 0, { r: 3, a: 'line', d: ['mag', 1.3, 'fire'] }),
  act('m_roar', '虎嘯山林', 'Roar of the Forest', 0, { r: 0, a: 3, buf: [['atk', -20, 3], ['spd', -10, 3]] }),
  act('m_ink', '潑墨', 'Ink Splash', 0, { r: 3, d: ['mag', 1.0, 'water'], st: [['blind', 40, 2]] }),
  act('m_fox', '狐火', 'Fox-fire', 0, { r: 4, a: 1, d: ['mag', 1.4, 'fire'], magic: true, mp: 10 }),
  act('m_bewitch', '魅惑', 'Bewitch', 0, { r: 3, st: [['charm', 40, 3]], magic: true, mp: 8 }),
  act('m_wave', '翻浪', 'Great Wave', 0, { r: 4, a: 2, d: ['mag', 1.3, 'water'], ct: 2 }),
  act('m_slam', '石掌', 'Stone Paw', 0, { d: ['atk', 1.4], st: [['stun', 30, 1]] }),
].map((a) => [a.id, a]));
export const MREACT = {
  m_counter: rea('m_counter', '反擊', 'Counter', 0, { on: 'phys', fx: 'counter', p: 30 }),
  m_thick: rea('m_thick', '硬殼', 'Thick Shell', 0, { on: 'phys', fx: 'dmgcut', p: 30 }),
  m_regen: rea('m_regen', '自癒', 'Mending', 0, { on: 'any', fx: 'regen', p: 40 }),
  m_reflect: rea('m_reflect', '反彈', 'Rebound', 0, { on: 'magic', fx: 'magcounter', p: 40 }),
  m_dodge: rea('m_dodge', '閃躲', 'Dodge', 0, { on: 'phys', fx: 'evade', p: 20 }),
};

// families: growth [hp, mp, atk, def, mag, res, spd], move, jump, skills (more open with rank), weak, resist, reaction, flying, undead
const FAM = {
  wolf:    { st: [0.95, 0.3, 1.1, 0.8, 0.4, 0.7, 1.25], mv: 5, jp: 3, sk: ['m_bite', 'm_pounce', 'm_howl'], weak: ['fire'], resist: [], react: 'm_counter' },
  boar:    { st: [1.2, 0.3, 1.15, 1.0, 0.3, 0.7, 1.0], mv: 4, jp: 2, sk: ['m_tusk', 'm_charge', 'm_regenerate'], weak: ['ice'], resist: ['earth'], react: 'm_thick' },
  snake:   { st: [0.9, 0.5, 1.0, 0.8, 0.7, 0.8, 1.15], mv: 4, jp: 3, sk: ['m_venom', 'm_constrict', 'm_bite'], weak: ['ice'], resist: ['earth'], react: 'm_dodge' },
  bat:     { st: [0.75, 0.6, 0.9, 0.7, 0.8, 0.8, 1.35], mv: 5, jp: 6, sk: ['m_drain', 'm_screech', 'm_bite'], weak: ['holy', 'wind'], resist: ['dark'], react: 'm_dodge', fly: true },
  crab:    { st: [1.1, 0.5, 1.05, 1.4, 0.6, 0.9, 0.8], mv: 3, jp: 2, sk: ['m_pincer', 'm_bubble', 'm_regenerate'], weak: ['bolt'], resist: ['water', 'fire'], react: 'm_thick' },
  monkey:  { st: [0.9, 0.5, 1.0, 0.8, 0.6, 0.8, 1.35], mv: 5, jp: 5, sk: ['m_claw', 'm_snatch', 'm_stone'], weak: ['fire'], resist: [], react: 'm_dodge' },
  wisp:    { st: [0.75, 1.2, 0.5, 0.7, 1.2, 1.2, 1.15], mv: 4, jp: 6, sk: ['m_flame', 'm_curse', 'm_touch'], weak: ['water', 'holy'], resist: ['fire', 'earth'], react: 'm_reflect', fly: true },
  dummy:   { st: [1.3, 0.3, 1.1, 1.4, 0.4, 1.0, 0.75], mv: 3, jp: 2, sk: ['m_smash', 'm_quake', 'm_slam'], weak: ['fire', 'bolt'], resist: ['earth'], react: 'm_thick' },
  insect:  { st: [0.85, 0.4, 1.05, 0.9, 0.5, 0.8, 1.2], mv: 4, jp: 4, sk: ['m_sting', 'm_swarm', 'm_venom'], weak: ['fire', 'wind'], resist: [], react: 'm_counter' },
  plant:   { st: [1.1, 0.9, 0.85, 1.0, 0.9, 1.0, 0.8], mv: 3, jp: 2, sk: ['m_root', 'm_spore', 'm_regenerate'], weak: ['fire'], resist: ['water', 'earth'], react: 'm_regen' },
  undead:  { st: [1.05, 0.6, 1.05, 1.05, 0.6, 0.8, 0.9], mv: 4, jp: 3, sk: ['m_bone', 'm_hop', 'm_curse'], weak: ['holy', 'fire'], resist: ['dark', 'ice'], react: 'm_counter', undead: true },
  spirit:  { st: [0.8, 1.2, 0.6, 0.7, 1.2, 1.2, 1.1], mv: 4, jp: 5, sk: ['m_touch', 'm_wail', 'm_curse'], weak: ['holy'], resist: ['dark', 'earth'], react: null, fly: true, undead: true },
  toad:    { st: [1.2, 0.8, 0.95, 1.05, 0.9, 1.0, 0.8], mv: 3, jp: 3, sk: ['m_tongue', 'm_spit', 'm_regenerate'], weak: ['fire'], resist: ['water'], react: 'm_regen' },
  bell:    { st: [1.2, 1.3, 1.0, 1.3, 1.2, 1.3, 0.85], mv: 3, jp: 3, sk: ['m_bell', 'm_curse', 'm_quake'], weak: ['bolt'], resist: ['dark', 'holy'], react: 'm_reflect' },
};
// [gallery id, family, rank (power within the family, 1-6), extra skills, weak/resist overrides, size, reaction override]
const LIST = [
  ['greywolf', 'wolf', 1], ['bloodwolf', 'wolf', 3], ['lavawolf', 'wolf', 4, ['m_firebreath'], { weak: ['water', 'ice'], resist: ['fire'] }], ['frostwolf', 'wolf', 5, ['m_frost'], { weak: ['fire'], resist: ['ice'] }],
  ['wildboar', 'boar', 1], ['ironboar', 'boar', 3], ['iceboar', 'boar', 5, ['m_frost'], { weak: ['fire'], resist: ['ice'] }],
  ['bambooviper', 'snake', 1], ['redsnake', 'snake', 2, [], { weak: ['ice'], resist: ['fire'] }], ['goldsnake', 'snake', 4],
  ['cavebat', 'bat', 1], ['bloodbat', 'bat', 3], ['icebat', 'bat', 5, ['m_frost'], { resist: ['ice', 'dark'] }],
  ['rivercrab', 'crab', 1], ['ironcrab', 'crab', 4], ['lavacrab', 'crab', 4, ['m_firebreath'], { weak: ['water'], resist: ['fire'] }],
  ['mountainmonkey', 'monkey', 1], ['goldmonkey', 'monkey', 3], ['snowmonkey', 'monkey', 5, ['m_frost'], { resist: ['ice'] }],
  ['wisp', 'wisp', 1], ['netherflame', 'wisp', 4], ['bellfire', 'wisp', 6, ['m_bell']],
  ['dummy', 'dummy', 1], ['bronzeman', 'dummy', 3], ['irondummy', 'dummy', 4], ['vajraguardian', 'dummy', 5, [], { resist: ['earth', 'holy'] }], ['bellpuppet', 'dummy', 6, ['m_bell']],
  ['tigerhornet', 'insect', 2, [], {}, 1, 'm_dodge'], ['ghosthornet', 'insect', 4, ['m_curse']], ['firehornet', 'insect', 4, ['m_flame'], { weak: ['water'], resist: ['fire'] }],
  ['centipede', 'insect', 2], ['goldcentipede', 'insect', 4], ['sandscorpion', 'insect', 2, [], { resist: ['earth'] }], ['inkscorpion', 'insect', 5, ['m_ink']], ['lavascorpion', 'insect', 4, ['m_firebreath'], { weak: ['water'], resist: ['fire'] }],
  ['treesprite', 'plant', 2], ['toadstool', 'plant', 2], ['glowcap', 'plant', 3], ['deadwood', 'plant', 4, ['m_curse']], ['bamboosprite', 'plant', 4, ['m_swarm']],
  ['littlejiangshi', 'undead', 2], ['skeleton', 'undead', 3], ['bronzejiangshi', 'undead', 5, ['m_slam']], ['icejiangshi', 'undead', 5, ['m_frost']], ['blackbone', 'undead', 5], ['goldbone', 'undead', 6, ['m_smash']],
  ['windsprite', 'spirit', 2, ['m_thunder'], { weak: ['bolt'], resist: ['wind'] }], ['papereffigy', 'spirit', 3, [], { weak: ['fire'] }], ['redpaper', 'spirit', 3, ['m_bewitch'], { weak: ['fire'] }],
  ['inkspirit', 'spirit', 3, ['m_ink']], ['drowned', 'spirit', 3, ['m_bubble'], { resist: ['water', 'dark'] }], ['lotusghost', 'spirit', 3, ['m_bewitch']], ['mudspirit', 'spirit', 3, ['m_root'], { weak: ['water'], resist: ['earth'] }],
  ['coldpool', 'spirit', 5, ['m_frost'], { resist: ['ice', 'water', 'dark'] }], ['thundersprite', 'spirit', 4, ['m_thunder'], { resist: ['bolt'] }], ['snowsprite', 'spirit', 5, ['m_frost'], { weak: ['fire'], resist: ['ice'] }],
  ['stonetoad', 'toad', 2, [], { resist: ['earth'] }], ['jadetoad', 'toad', 5, ['m_curse']],
  ['bellguard', 'bell', 5], ['greatbell', 'bell', 6, ['m_smash']],
];
// the great beasts: rare, strong and big; each a story foe, a labyrinth guardian or a prize to tame
const BEASTS = [
  ['ape', '白猿', [1.4, 0.7, 1.35, 1.1, 0.7, 1.0, 1.3], 5, 6, ['m_claw', 'm_stone', 'm_snatch', 'm_slam'], ['fire'], ['earth'], 'm_dodge'],
  ['tiger', '吊睛白額虎', [1.5, 0.5, 1.45, 1.1, 0.5, 0.9, 1.25], 5, 4, ['m_claw', 'm_pounce', 'm_roar', 'm_bite'], ['fire'], ['wind'], 'm_counter'],
  ['lion', '鎮宅石獅', [1.7, 0.8, 1.25, 1.6, 0.9, 1.3, 0.8], 3, 3, ['m_slam', 'm_quake', 'm_roar', 'm_smash'], ['bolt'], ['earth', 'dark'], 'm_thick'],
  ['jiangshi', '符咒殭屍', [1.5, 0.8, 1.3, 1.25, 0.8, 1.0, 0.95], 4, 4, ['m_hop', 'm_bone', 'm_drain', 'm_curse'], ['holy', 'fire'], ['dark', 'ice'], 'm_counter', false, true],
  ['shanxiao', '山魈', [1.3, 1.0, 1.25, 1.0, 1.0, 1.0, 1.35], 5, 6, ['m_stone', 'm_snatch', 'm_claw', 'm_curse'], ['fire'], ['earth'], 'm_dodge'],
  ['fox', '九尾狐', [1.3, 1.5, 0.9, 1.0, 1.45, 1.35, 1.3], 5, 5, ['m_fox', 'm_bewitch', 'm_claw', 'm_wail'], ['holy'], ['fire', 'dark'], 'm_reflect'],
  ['jiao', '江蛟', [1.7, 1.2, 1.3, 1.25, 1.2, 1.1, 1.0], 4, 4, ['m_wave', 'm_constrict', 'm_bite', 'm_frost'], ['bolt'], ['water', 'ice'], 'm_thick'],
  ['crow', '三足火鴉', [1.3, 1.2, 1.2, 1.0, 1.25, 1.1, 1.3], 6, 7, ['m_firebreath', 'm_flame', 'm_screech', 'm_claw'], ['water', 'ice'], ['fire', 'wind'], 'm_dodge', true],
  ['toad', '毒蟾', [1.8, 1.0, 1.15, 1.3, 1.0, 1.1, 0.75], 3, 3, ['m_spit', 'm_tongue', 'm_venom', 'm_regenerate'], ['fire'], ['water', 'earth'], 'm_regen'],
];
export const MONSTERS = {};
for (const [id, fam, rank, extra = [], el = {}, size = 1, react] of LIST) {
  const F = FAM[fam], k = 1 + (rank - 1) * 0.07;
  MONSTERS[id] = { id, art: id, fam, rank, st: F.st.map((x, i) => (i === 6 ? x : x * k)), mov: F.mv, jmp: F.jp,
    skills: [...F.sk.slice(0, 2 + (rank >= 3 ? 1 : 0)), ...extra], weak: el.weak || F.weak, resist: el.resist || F.resist, react: react || F.react, fly: !!F.fly, undead: !!F.undead, size };
}
for (const [id, zh, st, mv, jp, skills, weak, resist, react, fly, undead] of BEASTS) {
  MONSTERS[id] = { id, art: id, fam: 'beast', rank: 7, st, mov: mv, jmp: jp, skills, weak, resist, react, fly: !!fly, undead: !!undead, size: 1.45, beast: true };
}
// names come from the gallery
for (const m of Object.values(MONSTERS)) m.name = ART[m.art] ? ART[m.art].n : [m.id, m.id];
// what a family tends to leave besides gear (pills) — gear comes from the battle's tier
export const MDROP = { wolf: 'potion', boar: 'hipotion', snake: 'antidote', bat: 'eyedrops', crab: 'potion', monkey: 'ether', wisp: 'echo', dummy: 'hiether', insect: 'antidote', plant: 'ether', undead: 'holywater', spirit: 'echo', toad: 'remedy', bell: 'hiether', beast: 'xpotion' };
