// The jianghu: towns, roads, wild places, story sites and the four hidden labyrinths.
// x, y are on a 1000 × 700 map. kind: town (shops, tavern), field (skirmishes), site (story only), hidden (labyrinth).
// Foe levels are fixed by the place (they never follow the company's level).
export const NODES = {
  longmen:   { name: ['龍門鎮', 'Longmen Town'], x: 150, y: 560, kind: 'town', tier: 1, theme: 'courtyard', desc: ['龍門刀莊山下的小鎮。打鐵聲和包子香從早到晚不停。', 'The little town below the Longmen Sabre Manor. Hammering and the smell of steamed buns from dawn to dusk.'] },
  daozhuang: { name: ['龍門刀莊', 'Longmen Sabre Manor'], x: 80, y: 630, kind: 'site', theme: 'courtyard' },
  zhulin:    { name: ['竹林小徑', 'Bamboo Path'], x: 95, y: 455, kind: 'field', theme: 'bamboo', lv: 2, foes: ['greywolf', 'bambooviper', 'mountainmonkey', 'daoke'] },
  heifeng:   { name: ['黑風嶺', 'Black Wind Ridge'], x: 235, y: 470, kind: 'field', theme: 'ridge', lv: 3, foes: ['wildboar', 'greywolf', 'daoke', 'gongshou', 'quanshi'] },
  tingyu:    { name: ['十字鎮・聽雨樓', 'Crossroads: Listening Rain House'], x: 340, y: 525, kind: 'town', tier: 2, theme: 'courtyard', desc: ['四條官道交會的鎮子。聽雨樓的白先生醒木一拍，江湖的消息就從這裡傳開。', 'A town where four highways meet. When Mr Bai of the Listening Rain House claps his block, the news of the jianghu spreads from here.'] },
  guandao:   { name: ['官道', 'The Old Highway'], x: 440, y: 600, kind: 'field', theme: 'highway', lv: 5, foes: ['daoke', 'gongshou', 'xiaotou', 'wildboar', 'tigerhornet'] },
  suhe:      { name: ['蘇河城', 'Suhe City'], x: 530, y: 500, kind: 'town', tier: 3, theme: 'rooftops', desc: ['運河邊的大城，夜市燈火通明。書生和算命先生比米鋪還多。', 'A great city on the canal, its night market ablaze with lanterns. More scholars and fortune-tellers than rice shops.'] },
  luanzang:  { name: ['亂葬崗', 'The Burial Mound'], x: 420, y: 425, kind: 'field', theme: 'graveyard', lv: 8, foes: ['littlejiangshi', 'wisp', 'papereffigy', 'cavebat', 'daoshi'] },
  hanjiang:  { name: ['寒江渡', 'Cold River Ferry'], x: 650, y: 600, kind: 'town', tier: 3, theme: 'docks', desc: ['寒江上最大的渡口。江霧一起，對岸的寒江閣就看不見了。', 'The greatest ferry on the Cold River. When the mist rises, the Cold River Pavilion on the far bank vanishes.'] },
  matou:     { name: ['寒江碼頭', 'Cold River Docks'], x: 760, y: 645, kind: 'field', theme: 'docks', lv: 10, foes: ['rivercrab', 'drowned', 'daoke', 'anqishou', 'gongshou'] },
  hanjiangge:{ name: ['寒江閣', 'Cold River Pavilion'], x: 820, y: 560, kind: 'site', theme: 'pavilion' },
  jiangxin:  { name: ['江心', 'Midstream'], x: 720, y: 520, kind: 'site', theme: 'boats' },
  xuedao:    { name: ['血刀門', 'Blood Sabre Hall'], x: 900, y: 470, kind: 'site', theme: 'hall' },
  qianfo:    { name: ['千佛鎮', 'Thousand Buddha Town'], x: 560, y: 335, kind: 'town', tier: 5, theme: 'temple', desc: ['千佛寺山腳下的香客小鎮。早晚都聽得到鐘聲。', 'A pilgrims\' town at the foot of the Thousand Buddha Temple. The bells ring morning and night.'] },
  qianfosi:  { name: ['千佛寺', 'Thousand Buddha Temple'], x: 495, y: 265, kind: 'site', theme: 'temple' },
  qianfota:  { name: ['千佛塔', 'Thousand Buddha Pagoda'], x: 430, y: 220, kind: 'site', theme: 'pagoda' },
  ciyun:     { name: ['慈雲庵', 'Mercy Cloud Nunnery'], x: 650, y: 265, kind: 'site', theme: 'temple' },
  yizhuang:  { name: ['義莊', 'The Coffin House'], x: 360, y: 360, kind: 'site', theme: 'graveyard' },
  miaojiang: { name: ['苗疆沼澤', 'Miao Marshes'], x: 280, y: 300, kind: 'field', theme: 'marsh', lv: 16, foes: ['stonetoad', 'goldsnake', 'toadstool', 'bamboosprite', 'yushou'] },
  qingzhu:   { name: ['青竹寨', 'Green Bamboo Stockade'], x: 175, y: 235, kind: 'town', tier: 6, theme: 'bamboo', desc: ['苗疆深處的竹樓寨子。寨裡的人說，狼也是他們的親戚。', 'A stockade of bamboo houses deep in the Miao country. Its people say wolves are their kin.'] },
  wulin:     { name: ['武林城', 'Wulin City'], x: 760, y: 360, kind: 'town', tier: 7, theme: 'rooftops', desc: ['武林盟的所在。盟主府、執法堂和錢家金庫都在城裡。戰旗大會將在這裡舉行。', 'Seat of the Wulin Alliance: the Alliance Hall, the Law Hall and the Qian treasury. The Banner Assembly will be held here.'] },
  wulinroof: { name: ['盟主府屋脊', 'Alliance Hall Rooftops'], x: 860, y: 320, kind: 'site', theme: 'rooftops' },
  yanmen:    { name: ['雁門關', 'Wild Goose Pass'], x: 700, y: 205, kind: 'field', theme: 'pass', lv: 25, foes: ['qiangke', 'gongshou', 'biaoshi', 'ironboar', 'bloodwolf'] },
  xueshan:   { name: ['雪峰', 'The Snow Peaks'], x: 830, y: 150, kind: 'field', theme: 'snow', lv: 28, foes: ['frostwolf', 'snowmonkey', 'iceboar', 'snowsprite', 'icebat'] },
  baolongya: { name: ['暴龍崖', 'Tyrant Dragon Cliff'], x: 935, y: 90, kind: 'site', theme: 'cliff' },
  huoyan:    { name: ['火焰谷', 'Fire Valley'], x: 565, y: 135, kind: 'field', theme: 'volcano', lv: 31, foes: ['lavawolf', 'lavacrab', 'lavascorpion', 'firehornet', 'netherflame'] },
  youming:   { name: ['幽冥谷', 'Netherworld Valley'], x: 420, y: 85, kind: 'field', theme: 'nether', lv: 34, foes: ['blackbone', 'coldpool', 'bronzejiangshi', 'cike', 'dushi'] },
  youmingdian:{ name: ['幽冥殿', 'Netherworld Hall'], x: 290, y: 45, kind: 'site', theme: 'nether' },
  // the hidden labyrinths
  gumu:      { name: ['古墓', 'The Old Tomb'], x: 120, y: 330, kind: 'hidden', lab: 'gumu', unlock: 'lab_gumu' },
  shuijing:  { name: ['水晶宮', 'The Crystal Palace'], x: 880, y: 650, kind: 'hidden', lab: 'shuijing', unlock: 'lab_shuijing' },
  wanyaoku:  { name: ['萬妖窟', 'Den of Ten Thousand Beasts'], x: 220, y: 150, kind: 'hidden', lab: 'wanyaoku', unlock: 'lab_wanyaoku' },
  jinghu:    { name: ['鏡湖幻境', 'Mirror Lake Illusion'], x: 625, y: 440, kind: 'hidden', lab: 'jinghu', unlock: 'lab_jinghu' },
};
export const LINKS = [
  ['longmen', 'daozhuang'], ['longmen', 'zhulin'], ['longmen', 'heifeng'], ['zhulin', 'heifeng'], ['heifeng', 'tingyu'], ['longmen', 'tingyu'],
  ['tingyu', 'guandao'], ['tingyu', 'luanzang'], ['guandao', 'suhe'], ['luanzang', 'suhe'], ['guandao', 'hanjiang'], ['suhe', 'hanjiang'], ['hanjiang', 'matou'],
  ['hanjiang', 'jiangxin'], ['jiangxin', 'hanjiangge'], ['matou', 'hanjiangge'], ['hanjiangge', 'xuedao'], ['jiangxin', 'xuedao'],
  ['suhe', 'qianfo'], ['luanzang', 'yizhuang'], ['yizhuang', 'qianfo'], ['qianfo', 'qianfosi'], ['qianfosi', 'qianfota'], ['qianfo', 'ciyun'], ['yizhuang', 'miaojiang'], ['miaojiang', 'qingzhu'], ['qianfota', 'miaojiang'],
  ['qianfo', 'wulin'], ['ciyun', 'wulin'], ['xuedao', 'wulin'], ['wulin', 'wulinroof'], ['wulin', 'yanmen'], ['ciyun', 'yanmen'], ['yanmen', 'xueshan'], ['xueshan', 'baolongya'], ['yanmen', 'huoyan'], ['qianfota', 'huoyan'],
  ['huoyan', 'youming'], ['youming', 'youmingdian'],
  ['miaojiang', 'gumu'], ['matou', 'shuijing'], ['qingzhu', 'wanyaoku'], ['suhe', 'jinghu'],
];
// which places each chapter opens (you can always go back to where you've been)
export const OPEN_BY_CH = [
  ['longmen', 'daozhuang', 'zhulin', 'heifeng'],
  ['tingyu', 'guandao', 'suhe', 'luanzang', 'hanjiang', 'matou'],
  ['hanjiangge', 'jiangxin', 'xuedao'],
  ['qianfo', 'qianfosi', 'qianfota', 'ciyun', 'yizhuang', 'miaojiang', 'qingzhu'],
  ['wulin', 'wulinroof', 'yanmen', 'xueshan', 'baolongya', 'huoyan'],
  ['youming', 'youmingdian'],
];

// ---------------------------------------------------------------- the hidden labyrinths
// floors: how deep; lv: level of the first floor (each floor deeper adds `step`); themes; foes; guardians on certain floors; prize at the bottom
// a guardian is a beast ({ mon }) or a person ({ k: job, who: cast id })
export const LABYRINTHS = {
  gumu: { name: ['古墓', 'The Old Tomb'], floors: 20, lv: 24, step: 1.2, themes: ['tomb', 'tomb', 'graveyard'], foes: ['skeleton', 'blackbone', 'littlejiangshi', 'bronzejiangshi', 'bronzeman', 'papereffigy', 'cavebat', 'bloodbat'],
    guardians: { 10: { mon: 'jiangshi', name: ['守墓殭屍', 'Tomb-keeper Jiangshi'] }, 20: { mon: 'goldbone', name: ['無名武聖之影', 'Shade of the Nameless Saint'], lv: 6 } },
    prize: { flag: 'job_wusheng', items: ['ex_shengyi', 'ex_qilin', 'ex_xuandao', 'ex_fengchi'] },
    desc: ['苗疆邊上的古墓。墓主是一位沒留下名字的武聖，據說他的武學就刻在最深處的石壁上。', 'An old tomb on the edge of the Miao country. Its master was a saint of the martial arts who left no name; they say his arts are carved on the deepest wall.'] },
  shuijing: { name: ['水晶宮', 'The Crystal Palace'], floors: 20, lv: 28, step: 1.2, themes: ['palace', 'palace', 'boats'], foes: ['rivercrab', 'ironcrab', 'drowned', 'coldpool', 'lotusghost', 'goldsnake', 'icejiangshi'],
    guardians: { 10: { mon: 'jiao', name: ['守宮江蛟', 'Palace Jiao'] }, 20: { mon: 'jiao', name: ['龍王之影', 'Shade of the Dragon King'], lv: 6 } },
    prize: { flag: 'job_longwang', items: ['ex_longlin', 'ex_youlong', 'ex_ruyi', 'ex_yeming'] },
    desc: ['寒江底下沉沒的宮殿，牆是水晶，門是珊瑚。江蛟守著龍王留下的秘法。', 'A palace sunk beneath the Cold River, walls of crystal and doors of coral. The jiao guard the secret the Dragon King left behind.'] },
  wanyaoku: { name: ['萬妖窟', 'Den of Ten Thousand Beasts'], floors: 30, lv: 32, step: 1.0, themes: ['marsh', 'cave', 'bamboo'], foes: ['frostwolf', 'lavawolf', 'goldmonkey', 'snowmonkey', 'goldcentipede', 'inkscorpion', 'jadetoad', 'ghosthornet', 'iceboar'],
    guardians: { 10: { mon: 'fox', name: ['千年狐仙', 'Thousand-year Fox'] }, 20: { mon: 'tiger', name: ['萬妖窟虎王', 'Tiger King of the Den'] }, 30: { k: 'wanyao', who: 'mowuya', lv: 4 } },
    prize: { flag: 'job_wanyao', items: ['ex_jiulong', 'ex_shouling', 'ex_fenghuang'] },
    desc: ['青竹寨後山的深洞，裡面的野獸像是聽著誰的鈴聲。最深處站著一個手拿鈴杖的人。', 'A deep cave behind the Green Bamboo Stockade, where the beasts seem to listen for someone\'s bell. A man with a bell-staff stands at the bottom.'] },
  jinghu: { name: ['鏡湖幻境', 'Mirror Lake Illusion'], floors: 15, lv: 18, step: 1.4, mirror: true, themes: ['palace', 'courtyard', 'bamboo'], foes: ['lotusghost', 'redpaper', 'inkspirit'],
    guardians: { 15: { mon: 'lotusghost', name: ['鏡中的自己', 'Your Reflection'], mirrorBoss: true } },
    prize: { items: ['ex_yexing', 'ex_wuying', 'ex_mengmian', 'ex_bidu', 'ex_baguajing'] },
    desc: ['蘇河城外的鏡湖，月圓的晚上會照出另一個江湖。敵人就是你們自己。', 'The mirror lake outside Suhe City; on full-moon nights it shows another jianghu. The foes are yourselves.'] },
};

// ---------------------------------------------------------------- side battles on the tavern boards: unlocked by chapter (and sometimes by a companion), fought once
// [id, chapter, place, 中文, English, lv, theme, foes (ids, or { k, art, name }), reward { gold, items, flag, needs, join }]
const P = (k, art, zh, en) => ({ k, art, name: [zh, en] });
export const QUESTS = [
  ['q_wolves', 0, 'longmen', '竹林狼群', 'Wolves in the Bamboo', 3, 'bamboo', ['greywolf', 'greywolf', 'greywolf', 'bloodwolf'], { gold: 300, items: ['potion', 'potion'] }],
  ['q_boars', 0, 'longmen', '山豬下田', 'Boars in the Fields', 4, 'village', ['wildboar', 'wildboar', 'wildboar', 'mountainmonkey'], { gold: 350, items: ['boots_move'] }],
  ['q_debt', 1, 'tingyu', '瘦猴還債', 'Skinny Monkey\'s Debt', 6, 'ridge', [P('xiaotou', 'lackey', '黑風嘍囉', 'Black Wind Lackey'), P('daoke', 'cudgeler', '黑風棍手', 'Black Wind Cudgeler'), P('gongshou', 'archer', '山賊弓手', 'Bandit Archer'), P('daoke', 'cudgeler', '黑風棍手', 'Black Wind Cudgeler'), P('quanshi', 'sx_hf_club', '討債的狼牙棒手', 'Debt-collecting Clubman')], { gold: 600, items: ['ex_longmenyu'], needs: 'joined_shouhou' }],
  ['q_shoes', 1, 'tingyu', '賈八方的鞋', 'Jia Bafang\'s Shoes', 6, 'bamboo', ['mountainmonkey', 'mountainmonkey', 'goldmonkey', 'mountainmonkey'], { gold: 500, items: ['ex_mengmian'] }],
  ['q_coward', 1, 'suhe', '膽小鏢師', 'The Coward\'s Escort', 8, 'highway', [P('daoke', 'lackey', '劫鏢的', 'Highwayman'), P('daoke', 'lackey', '劫鏢的', 'Highwayman'), P('gongshou', 'archer', '劫鏢弓手', 'Highway Archer'), P('biaoshi', 'sx_hf_club', '劫鏢頭子', 'Highway Chief')], { gold: 800, items: ['ex_hutou'], needs: 'joined_wudadan' }],
  ['q_couplet', 1, 'suhe', '對聯擂台', 'The Couplet Contest', 9, 'courtyard', [P('shusheng', 'sx_scholar', '狂生', 'Wild Scholar'), P('shusheng', 'sx_scholar', '狂生', 'Wild Scholar'), P('qinshi', 'sx_qin', '琴生', 'Qin Student'), P('jianke', 'sx_sword', '書院劍手', 'Academy Swordsman'), P('shusheng', 'sx_teller', '霍天下', 'Huo Tianxia')], { gold: 900, items: ['ex_chunqiu'], needs: 'joined_wenduizhang' }],
  ['q_fortune', 1, 'suhe', '鐵口直斷', 'Never Wrong (Never Right)', 9, 'graveyard', ['papereffigy', 'wisp', 'wisp', 'littlejiangshi', P('daoshi', 'daoist', '假道士', 'Fake Daoist')], { gold: 700, items: ['hipotion', 'hipotion'], join: 'hubanxian' }],
  ['q_chu', 2, 'hanjiang', '天闊劍', 'The Wide-sky Sword', 13, 'docks', [P('jianke', 'sx_sword', '劍館弟子', 'Sword School Student'), P('jianke', 'sx_sword', '劍館弟子', 'Sword School Student'), P('qiangke', 'sx_spear', '劍館槍手', 'Sword School Spearman'), P('jianke', 'chutiankuo', '楚天闊', 'Chu Tiankuo')], { gold: 1200, items: [], join: 'chutiankuo' }],
  ['q_oldsword', 2, 'hanjiang', '寒江舊劍', 'The Old Cold River Sword', 15, 'boats', ['drowned', 'drowned', 'rivercrab', 'ironcrab', 'lotusghost'], { gold: 1500, items: ['ex_hanjiangjian'], flag: 'lab_shuijing', needs: 'joined_liuhanyan' }],
  ['q_mirror', 2, 'hanjiang', '鏡湖月夜', 'Full Moon on the Mirror Lake', 16, 'palace', ['lotusghost', 'lotusghost', 'redpaper', 'inkspirit'], { gold: 1400, items: ['ex_fenghuang'], flag: 'lab_jinghu' }],
  ['q_wolfbro', 3, 'qingzhu', '狼兄弟', 'The Wolf Brother', 20, 'marsh', [P('yushou', 'acolyte', '馭妖宗徒', 'Beastbinder Acolyte'), P('yushou', 'acolyte', '馭妖宗徒', 'Beastbinder Acolyte'), 'bloodwolf', 'bloodwolf', P('daoshi', 'blackdaoist', '黑袍妖道', 'Black-robed Daoist')], { gold: 2000, items: ['ex_shouling'], flag: 'lab_wanyaoku', needs: 'joined_aman' }],
  ['q_tombkey', 3, 'qianfo', '千佛古卷', 'The Temple Scroll', 21, 'tomb', ['skeleton', 'skeleton', 'littlejiangshi', 'bronzeman', 'bloodbat'], { gold: 2200, items: ['ex_qinglian'], flag: 'lab_gumu' }],
  ['q_ape', 3, 'qianfo', '斷崖白猿', 'The White Ape of the Cliff', 22, 'cliff', ['ape', 'goldmonkey', 'goldmonkey'], { gold: 2400, items: ['ex_yugan', 'ex_douli'] }],
  ['q_vault', 4, 'wulin', '金鏢失竊', 'The Stolen Gold Darts', 26, 'rooftops', [P('xiaotou', 'assassin', '飛賊', 'Cat Burglar'), P('xiaotou', 'assassin', '飛賊', 'Cat Burglar'), P('anqishou', 'sx_hidden', '飛賊頭子', 'Burglar Chief'), P('cike', 'netherassassin', '幽冥刺客', 'Netherworld Assassin')], { gold: 3500, items: ['ex_suanpan'] }],
  ['q_tiger', 4, 'wulin', '吊睛白額虎', 'The White-browed Tiger', 28, 'ridge', ['tiger', 'bloodwolf', 'bloodwolf'], { gold: 3800, items: ['ex_jinsi'] }],
  ['q_fox', 4, 'qianfo', '九尾狐', 'The Nine-tailed Fox', 30, 'bamboo', ['fox', 'redpaper', 'lotusghost'], { gold: 4200, items: ['ex_yeming'] }],
  ['q_lion', 4, 'wulin', '古宅石獅', 'The Stone Lions of the Old Mansion', 30, 'courtyard', ['lion', 'lion', 'bronzeman'], { gold: 4200, items: ['ex_xueyu'] }],
  ['q_shanxiao', 4, 'qingzhu', '山魈偷鹽', 'The Salt-thief Shanxiao', 29, 'ridge', ['shanxiao', 'snowmonkey', 'goldmonkey'], { gold: 4000, items: ['ex_shenxing'] }],
  ['q_crow', 5, 'wulin', '三足火鴉', 'The Three-legged Fire Crow', 35, 'volcano', ['crow', 'firehornet', 'firehornet', 'lavawolf'], { gold: 5500, items: ['ex_luori'] }],
  ['q_thunder', 5, 'qianfo', '雷部天書', 'The Thunder Ministry Scroll', 36, 'temple', [P('zhenren', 'blackdaoist', '黑袍真人', 'Black-robed Master'), P('daoshi', 'daoist', '妖道', 'Rogue Daoist'), 'thundersprite', 'thundersprite'], { gold: 6000, items: ['ex_tianshu', 'ex_qixing'] }],
].map(([id, ch, at, zh, en, lv, theme, foes, reward]) => ({ id, ch, at, name: [zh, en], lv, theme, foes, reward }));
