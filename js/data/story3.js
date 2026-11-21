// The story, part three: Chapter 4 (暴龍崖), the finale (幽冥殿) and the ending.
import { F, FOE } from './story1.js';

const L = (s, zh, en) => [s, zh, en];
const N = (zh, en) => [zh, en];
const { bloodThug, bloodBlade, ymDaoist, ymAssassin, bandit, banditArcher } = FOE;
const constable = (n = 1, o = {}) => F('buke', n, { art: 'sx_zf_chain', name: N('執法堂捕快', 'Law Hall Constable'), ...o });
const ymArcher = (n = 1, o = {}) => F('gongshou', n, { art: 'netherarcher', name: N('幽冥弓手', 'Netherworld Archer'), ...o });
const ymKiller = (n = 1, o = {}) => F('cike', n, { art: 'netherassassin', name: N('幽冥殺手', 'Netherworld Killer'), ...o });
const ymBlack = (n = 1, o = {}) => F('zhenren', n, { art: 'blackdaoist', name: N('黑袍真人', 'Black-robed Master'), ...o });
const palmMan = (n = 1, o = {}) => F('quanshi', n, { art: 'sx_bl_palm', name: N('暴龍掌客', 'Dragon Palm Brawler'), ...o });

export const EVENTS3 = [
  // ================================================================ CHAPTER 4
  { id: 'c4_1', ch: 4, at: 'wulinroof', name: N('通緝令', 'Wanted'),
    pre: [
      L(null, '武林城門口貼著一張新的告示。畫上的兩張臉，一張帶著藍頭帶，一張嘴角有一顆痣。', 'A new notice is pasted at the gate of Wulin City. Of the two faces drawn on it, one wears a blue headband and the other has a mole by his mouth.'),
      L('shouhou', '「龍門奕氏兄弟，勾結黑旗會，盜取各派戰旗」……這、這是你們？', '"The Yi brothers of Longmen, in league with the Black Banner Society, have stolen the houses\' banners"... th-that\'s you?'),
      L('tiewusi', '是他們。人證、書信、印鑑，都在我手上。', 'It is them. Witnesses, letters, seals — I have them all.'),
      L(null, '黑色官帽、兩撇八字鬍。執法堂主鐵無私的鐵鍊在手裡晃著。屋頂上，一圈捕快拉開了網。', 'A black official\'s cap and a thick moustache. Law Hall Master Tie Wusi\'s iron chain swings in his hand. On the rooftops, a ring of constables draws a net.'),
      L('yirui', '那些信是假的。旗，是我們從黑旗會手裡搶回來的。', 'Those letters are forged. We took the banners back from the Black Banner Society.'),
      L('tiewusi', '我只認證據。束手就擒，到堂上再說。', 'I believe only evidence. Surrender and say it before the court.'),
      L('liuhanyan', '進了執法堂，戰旗就到了掌旗使手裡。那正是黑旗會想要的。', 'Once we\'re in the Law Hall, the banners go to the Banner Steward. That is exactly what the Black Banner Society wants.'),
      L('yirui', '從屋頂上走。別傷捕快。', 'We leave over the roofs. Don\'t kill the constables.'),
    ],
    battle: { theme: 'rooftops', seed: 4101, w: 13, h: 13, lv: 24, foes: [constable(4), F('gongshou', 1, { art: 'sx_crossbow', name: N('執法堂弩手', 'Law Hall Crossbowman') }), F('zhifa', 1, { who: 'tiewusi', lv: 3, noDrop: true, retreat: 0.6 })], goal: { type: 'reach', name: N('城外的巷子', 'the alley out of the city') } },
    post: [
      L(null, '幾個人從屋脊上翻下來，落進一條黑巷子。巷子盡頭，一扇小門開了一條縫。', 'They drop from the ridge into a dark alley. At its end a small door opens a crack.'),
      L('qianwanli', '快進來。帳房裡說話，比屋頂上安全。', 'Quickly, inside. A counting-house is safer for talking than a rooftop.'),
      L('qianwanli', '錢萬里，武林盟司庫。那些「書信」寄出的日子，你們人在寒江上——我的帳上記著每一條船的船費。這筆帳，對不上。', 'Qian Wanli, treasurer of the Alliance. On the days those "letters" were sent you were on the Cold River — my books record every boat fare. The accounts don\'t balance.'),
      L('yishuo', '算盤大叔相信我們？', 'Abacus uncle, you believe us?'),
      L('qianwanli', '我只相信帳。今晚，黑旗會要來搶錢家的戰旗。你們幫我守金庫，我幫你們對帳。', 'I believe only accounts. Tonight the Black Banner Society comes for the Qian banner. Guard my vault, and I\'ll help balance your books.'),
    ] },
  { id: 'c4_2', ch: 4, at: 'wulin', name: N('錢家金庫', 'The Qian Vault'),
    pre: [
      L(null, '半夜，錢家金庫的院子裡，一排黑衣人從牆頭跳下。', 'Midnight. In the courtyard of the Qian vault, a line of men in black drop from the wall.'),
      L('qianwanli', '金庫有三道鎖，戰旗在最裡面。我這把老骨頭，可經不起刀子。', 'The vault has three locks and the banner is in the innermost. These old bones won\'t take a blade.'),
      L('wudadan', '大叔，你站我後面！我、我擋刀很行的！', 'Uncle, stand behind me! I— I\'m good at blocking!'),
      L('qianwanli', '一個鏢師，一個帳房。好，這筆生意，做得。', 'An escort and a counting-house. Good. This is a deal worth making.'),
    ],
    battle: { theme: 'courtyard', seed: 4202, w: 12, h: 12, lv: 25, foes: [ymKiller(2), ymArcher(1), ymAssassin(2)], guests: ['qianwanli'], goal: { type: 'protect', who: 'qianwanli', name: N('錢萬里', 'Qian Wanli') } },
    post: [
      L('qianwanli', '金庫保住了。說好的對帳：這半年，從盟裡支出去「整修戰旗庫」的銀子，有三萬兩去向不明。', 'The vault is safe. As promised, the accounts: in the last half-year, thirty thousand taels paid out of the Alliance for "repairing the banner store" went nowhere I can find.'),
      L('qianwanli', '簽字領銀子的人，是掌旗使，蕭無影。', 'The man who signed for that silver is the Banner Steward, Xiao Wuying.'),
      L('kuchan', '掌旗使……難怪他的身法眼熟。', 'The Banner Steward... no wonder his footwork looked familiar.'),
      L('qianwanli', '光有帳不夠，鐵無私要的是人贓俱獲。還有，北邊雁門關，有一隊黑旗會的人押著車往幽冥谷走。', 'Accounts alone won\'t do; Tie Wusi wants the man caught with the goods. And to the north, at Wild Goose Pass, a Black Banner column is escorting carts toward the Netherworld Valley.'),
      L('qianwanli', '錢家的戰旗，你們帶著。還有這個——出門在外，盤纏不能少。', 'Take the Qian banner with you. And this — on the road, you must not run short of travel money.'),
    ],
    give: { gold: 3000, items: ['hipotion', 'hipotion', 'hiether'] }, flags: ['banner_qian'] },
  { id: 'c4_3', ch: 4, at: 'yanmen', name: N('雁門關', 'Wild Goose Pass'),
    pre: [
      L(null, '雁門關的關牆上，插滿了黑旗。押車的隊伍正在過關，帶頭的是一個臉上帶疤的漢子。', 'Black flags crowd the walls of Wild Goose Pass. A column of carts is passing the gate, led by a man with a scarred face.'),
      L('daoba', '又是你們。這次沒有竹林讓我退了。', 'You again. No bamboo for me to fall back into this time.'),
      L('shouhou', '刀疤大哥……你、你回頭吧！黑熊寨主都不幹了！', 'Brother Scar... t-turn back! Even Chief Black Bear quit!'),
      L('daoba', '他不幹，是他的事。拿了人家的銀子，就要把車送到。上！', 'If he quits, that\'s his business. Take a man\'s silver and you deliver his carts. At them!'),
    ],
    battle: { theme: 'pass', seed: 4303, w: 13, h: 13, lv: 26, foes: [F('daoke', 1, { who: 'daoba', boss: true, lv: 3, eq: { w: 'daidao6' } }), bandit(2, { lv: 2 }), banditArcher(2, { lv: 2 }), bloodBlade(2)], goal: { type: 'boss', name: N('刀疤', 'Scar') } },
    post: [
      L('daoba', '……我輸了。車上是蘇河的銀子和黑旗……真正的戰旗，已經從另一條路送進幽冥谷了。', '...I lose. The carts hold Suhe silver and black flags... the real banners went into the Netherworld Valley by another road.'),
      L('daoba', '鬼面說，大會那天，他會穿著掌旗使的官服，親手把八面旗交給屠千秋。', 'The Ghost Mask said that on the day of the Assembly he\'ll wear the Banner Steward\'s robes and hand all eight banners to Tu Qianqiu himself.'),
      L('yirui', '鬼面就是掌旗使。', 'The Ghost Mask is the Banner Steward.'),
      L('daoba', '我什麼都沒說。……你們走吧，暴龍崖的旗還沒丟，可那個冷笑天，誰也說不動。', 'I said nothing. ...Go. Tyrant Dragon Cliff still has its banner, but nobody can talk Leng Xiaotian into anything.'),
    ] },
  { id: 'c4_4', ch: 4, at: 'xueshan', name: N('雪峰', 'The Snow Peaks'),
    pre: [
      L(null, '去暴龍崖要翻過雪峰。風雪裡，霜狼的嚎叫一聲接一聲。', 'To reach Tyrant Dragon Cliff they must cross the snow peaks. In the blizzard the howls of frost wolves answer one another.'),
      L('wenduizhang', '上聯：雪壓千峰狼嘯月；下聯：……我的手凍得寫不出字。', 'First line: Snow weighs on a thousand peaks, wolves howl at the moon. Second line: ...my hands are too cold to write.'),
      L('aman', '狼，餓了。不是壞。可是，會咬。', 'Wolves — hungry. Not bad. But — they bite.'),
    ],
    battle: { theme: 'snow', seed: 4404, w: 13, h: 13, lv: 27, foes: [F('frostwolf', 2), F('snowmonkey', 2), F('iceboar', 1), F('snowsprite', 1)], goal: { type: 'rout' } },
    post: [
      L(null, '風雪停了。遠處的崖頂上，傳來三聲冷笑。', 'The blizzard stops. From a clifftop far ahead come three cold laughs.'),
      L('liuhanyan', '暴龍崖到了。', 'Tyrant Dragon Cliff.'),
    ] },
  { id: 'c4_5', ch: 4, at: 'baolongya', name: N('暴龍崖上', 'Atop Tyrant Dragon Cliff'),
    pre: [
      L(null, '暴龍崖頂，風大得站不穩。一個銀髮金角、披著猩紅披風的男人，坐在崖邊的石椅上。', 'At the top of the cliff the wind is so strong it is hard to stand. A man with silver hair and golden horns, a crimson cape on his shoulders, sits on a stone chair at the edge.'),
      L('xiaotian', '哈。哈。哈。龍門的兩條小鯉魚，游到暴龍崖來了。', 'Ha. Ha. Ha. The two little carp of Longmen have swum all the way up Tyrant Dragon Cliff.'),
      L('yirui', '冷笑天。黑旗會要搶暴龍崖的戰旗，我們是來——', 'Leng Xiaotian. The Black Banner Society means to take your banner. We came to—'),
      L('xiaotian', '要我的旗？拿得走，再說。', 'Want my banner? Take it, and then we\'ll talk.'),
      L('yishuo', '他根本沒在聽！', 'He isn\'t even listening!'),
      L('xiaotian', '我聽得很清楚。我只是想看看，你們配不配。', 'I hear perfectly well. I only want to see whether you are worth it.'),
    ],
    battle: { theme: 'cliff', seed: 4505, w: 12, h: 12, lv: 28, foes: [F('baolong', 1, { who: 'xiaotian', boss: true, lv: 5, retreat: 0.35, noDrop: true }), palmMan(3, { lv: 1 }), F('crow', 1, { lv: -2 })], goal: { type: 'boss', name: N('冷笑天', 'Leng Xiaotian') } },
    post: [
      L('xiaotian', '哈哈哈哈！好！一刀一球，有點意思。', 'Hahahaha! Good! A sabre and a ball — now that\'s interesting.'),
      L('xiaotian', '旗，你們拿去。你們要找的那張鬼面，我在武林盟見過他摘下來一次。', 'Take the banner. The ghost mask you\'re after — I once saw him take it off in the Alliance.'),
      L('yirui', '你早就知道是掌旗使？', 'You knew it was the Banner Steward all along?'),
      L('xiaotian', '世人笑我狂且傲，我笑世人看不穿。看穿是一回事，抓不抓他，是另一回事。', 'The world laughs that I am proud and mad; I laugh that the world cannot see through. Seeing through is one thing. Catching him is another.'),
      L('xiaotian', '這次，我跟你們走一趟。只是想看看，屠千秋舉旗的時候，臉上是什麼表情。', 'This time I\'ll come along. I only want to see the look on Tu Qianqiu\'s face when he raises the banners.'),
    ],
    join: ['xiaotian'], flags: ['joined_xiaotian', 'job_baolong', 'banner_baolong'] },
  { id: 'c4_6', ch: 4, at: 'wulinroof', name: N('揭面', 'Unmasked'),
    pre: [
      L(null, '回到武林城的夜裡。盟主府的戰旗庫屋頂上，一個戴鬼面的人影正撬開天窗。', 'Night, back in Wulin City. On the roof of the Alliance banner store, a figure in a ghost mask is prying open a skylight.'),
      L('tiewusi', '我收到一封信，說今晚戰旗庫有賊。署名是……龍門奕叡。', 'I received a letter saying a thief would come to the banner store tonight. It was signed... Yi Rui of Longmen.'),
      L('yirui', '是我寫的。人贓俱獲，你要的證據。', 'I wrote it. Caught with the goods — the evidence you wanted.'),
      L('tiewusi', '……那就讓我看看，鬼面底下是誰。', '...Then let me see who is under the mask.'),
      L('guimian', '執法堂和龍門，一起來了？正好，一次收拾。', 'The Law Hall and Longmen together? Good. I\'ll deal with you all at once.'),
    ],
    battle: { theme: 'rooftops', seed: 4606, w: 13, h: 13, lv: 29, foes: [F('cike', 1, { who: 'guimian', boss: true, lv: 5, retreat: 0.3, noDrop: true }), ymKiller(3), ymArcher(2), ymDaoist(1, { lv: 2 })], guests: ['tiewusi'], goal: { type: 'boss', name: N('鬼面護法', 'The Ghost-mask Warden') } },
    post: [
      L(null, '鬼面護法跪倒在屋脊上。鐵無私的鐵鍊一捲，白色的鬼面飛了出去。', 'The Ghost-mask Warden falls to his knees on the ridge. Tie Wusi\'s chain coils out, and the white mask flies away.'),
      L('xiaowuying', '……哼。', '...Hmph.'),
      L('tiewusi', '掌旗使，蕭無影。', 'Banner Steward. Xiao Wuying.'),
      L('xiaowuying', '鐵堂主，你只認證據。可是證據，也會跑。', 'Master Tie, you believe only evidence. But evidence can run.'),
      L(null, '一陣黑煙炸開。等煙散了，屋脊上只剩一件掌旗使的官服。', 'A burst of black smoke. When it clears, only a Banner Steward\'s robe lies on the ridge.'),
      L('tiewusi', '……是我錯了。奕家兄弟，通緝令今晚就撤。執法堂欠你們一個公道。', '...I was wrong. Brothers Yi, the wanted notice comes down tonight. The Law Hall owes you justice.'),
      L('tiewusi', '他會逃回幽冥谷。這一趟，我的鐵鍊跟你們走。', 'He will run back to the Netherworld Valley. This time, my chain goes with you.'),
    ],
    join: ['tiewusi'], flags: ['joined_tiewusi', 'job_zhifa'] },
  { id: 'c4_7', ch: 4, at: 'huoyan', name: N('火焰谷', 'Fire Valley'),
    pre: [
      L(null, '去幽冥谷的路，要穿過火焰谷。地上的石頭燙得冒煙，天上盤旋著一隻三條腿的火鴉。', 'The road to the Netherworld Valley runs through Fire Valley. The stones smoke with heat, and a three-legged fire crow circles overhead.'),
      L('xiaotian', '幽冥教養的看門鳥。哈，難看。', 'The Netherworld\'s watch-bird. Ha. Ugly thing.'),
      L('liuhanyan', '我的寒江劍，在這裡會融的。', 'My Cold River sword will melt here.'),
      L('yishuo', '那就快點打完！', 'Then let\'s finish quickly!'),
    ],
    battle: { theme: 'volcano', seed: 4707, w: 13, h: 12, lv: 30, foes: [F('crow', 1, { boss: true, lv: 2 }), F('lavawolf', 2), F('firehornet', 2), F('lavascorpion', 1)], goal: { type: 'boss', name: N('三足火鴉', 'The Three-legged Fire Crow') } },
    post: [
      L(null, '火鴉墜進岩漿裡。谷口的黑霧後面，隱約看得見一座黑色的大殿。', 'The fire crow plunges into the lava. Beyond the black mist at the valley mouth, a great black hall can just be seen.'),
      L('kuchan', '幽冥殿。被搶走的戰旗，都在裡面。', 'The Netherworld Hall. Every stolen banner is inside.'),
      L('yirui', '弟。', 'Brother.'),
      L('yishuo', '我知道，跟緊你。', 'I know. Stay close to you.'),
      L('yirui', '不。這次，你在前面。我信你。', 'No. This time you go first. I trust you.'),
    ] },

  // ================================================================ FINALE
  { id: 'c5_1', ch: 5, at: 'youming', name: N('幽冥谷口', 'The Mouth of the Valley'),
    pre: [
      L(null, '幽冥谷口，黑霧裡站滿了幽冥教的教眾。白骨燈籠一盞接著一盞亮起來。', 'At the valley mouth the black mist is packed with Netherworld followers. Bone lanterns light up one after another.'),
      L('tiewusi', '執法堂奉命，拿黑旗會一干人等！', 'By order of the Law Hall, all of the Black Banner Society are under arrest!'),
      L('xiaotian', '哈，跟他們講律條？', 'Ha. Reading them the statutes?'),
      L('tiewusi', '先講律條，再動手。這也是律條。', 'First the statutes, then the fists. That is also a statute.'),
    ],
    battle: { theme: 'nether', seed: 5101, w: 14, h: 14, lv: 32, foes: [ymKiller(2), ymArcher(2), ymBlack(1), F('blackbone', 2), F('coldpool', 1), F('bronzejiangshi', 1)], goal: { type: 'rout' } },
    post: [
      L(null, '谷口的教眾潰散了。山路上，一個白髮紅袍的人提著血刀等在那裡。', 'The followers at the valley mouth scatter. On the path ahead, a white-haired man in red waits with a blood-red blade.'),
      L('lihanshan', '我說過，我的刀還會來找你。', 'I told you my blade would come for you again.'),
    ] },
  { id: 'c5_2', ch: 5, at: 'youming', name: N('血刀再戰', 'The Blood Sabre Again'),
    pre: [
      L('lihanshan', '九斬之下不留人。上一回，我只出了七斬。', 'No one survives my nine cuts. Last time I used only seven.'),
      L('yirui', '那這一回，我也不只一刀。', 'Then this time I won\'t stop at one cut either.'),
      L('chutiankuo', '（遠處）等等！奕叡的對手是我！要打敗他，也只能是我楚天闊！', '(From afar) Wait! Yi Rui\'s rival is me! If anyone beats him, it\'s going to be Chu Tiankuo!'),
      L('yishuo', '他怎麼又來了！', 'How is he here again?'),
    ],
    battle: { theme: 'nether', seed: 5202, w: 13, h: 13, lv: 33, foes: [F('daowang', 1, { who: 'lihanshan', boss: true, lv: 5, eq: { w: 'ex_xuedao', h: 'helm7', b: 'heavy7' }, drops: ['ex_xuedao'] }), bloodBlade(3, { lv: 2 }), bloodThug(2, { lv: 2 })], guests: ['chutiankuo'], goal: { type: 'boss', name: N('厲寒山', 'Li Hanshan') } },
    post: [
      L('lihanshan', '……輸了。我平生最恨的字……原來，也沒那麼難說出口。', '...I lost. The word I hated most... is not so hard to say after all.'),
      L(null, '厲寒山把血刀插在地上，轉身走進黑霧裡，再也沒有回頭。', 'Li Hanshan plants the blood sabre in the ground, turns into the black mist, and never looks back.'),
      L('chutiankuo', '第一百零四……不對，這一場不算我輸！我站在你們這邊！', 'Number one hundred and four... no, this one doesn\'t count as my loss! I was on your side!'),
      L('yirui', '那就一起走到最後。', 'Then walk with us to the end.'),
    ],
    join: ['chutiankuo'] },
  { id: 'c5_3', ch: 5, at: 'youmingdian', name: N('無影', 'The Shadowless'),
    pre: [
      L(null, '幽冥殿前的白玉階上，蕭無影換回了黑衣，手上抓著七面卷起來的戰旗。', 'On the white steps before the Netherworld Hall, Xiao Wuying has changed back into black, seven rolled banners in his grip.'),
      L('xiaowuying', '十年。我替武林盟管了十年的旗，每一面旗的針腳我都數過。', 'Ten years. Ten years I kept the Alliance\'s banners. I have counted every stitch in every one.'),
      L('xiaowuying', '可是坐在大會上舉旗的，從來不是我。這一次，旗是我湊齊的。', 'Yet the one raising them at the Assembly was never me. This time, I gathered them.'),
      L('tiewusi', '湊齊的方法，是偷、是搶、是嫁禍。', 'And you gathered them by theft, robbery and frame-ups.'),
      L('xiaowuying', '江湖上的事，誰不是這樣。', 'Who in the jianghu does otherwise?'),
      L('yishuo', '我們就不是！', 'We don\'t!'),
    ],
    battle: { theme: 'nether', seed: 5303, w: 13, h: 13, lv: 34, foes: [F('cike', 1, { who: 'xiaowuying', boss: true, lv: 6, eq: { w: 'bishou9', b: 'light9', a: 'cloak_haste' }, drops: ['ex_guimianju'] }), ymKiller(2, { lv: 2 }), ymAssassin(2, { lv: 2 }), ymArcher(1, { lv: 2 })], goal: { type: 'boss', name: N('蕭無影', 'Xiao Wuying') } },
    post: [
      L(null, '蕭無影倒在白玉階上。七面戰旗從他手裡滾落，一面一面攤開在階前。', 'Xiao Wuying falls on the white steps. The seven banners roll from his hands and spread open one by one.'),
      L('xiaowuying', '……第八面……在教主手裡……你們……打不過他……', '...The eighth... is in the master\'s hands... you... can\'t beat him...'),
      L('liuhanyan', '寒江閣、千佛寺、慈雲庵、錢家、暴龍崖、蘇河書院……還有青竹寨的旗。', 'The Cold River, the Thousand Buddhas, the Mercy Cloud, the Qian house, Tyrant Dragon Cliff, the Suhe Academy... and the Green Bamboo Stockade.'),
      L('aman', '我的，寨子的旗！', 'My — stockade\'s banner!'),
      L('yirui', '第八面，是龍門的。他要的，是我們背上這一面。', 'The eighth is Longmen\'s. What he wants is the one on our backs.'),
    ],
    flags: ['banner_qingzhu'] },
  { id: 'c5_4', ch: 5, at: 'youmingdian', name: N('幽冥殿', 'The Netherworld Hall'),
    pre: [
      L(null, '幽冥殿深處，一個臉色蒼白的男人坐在白骨王座上，半張臉藏在銀色鬼面下，白骨扇輕輕搖著。', 'In the depths of the hall a pale man sits on a throne of bone, half his face behind a silver ghost mask, gently waving a bone fan.'),
      L('tuqianqiu', '辛苦了。七面旗，替我送到了門口；最後一面，還親自背了進來。', 'Thank you for your trouble. Seven banners brought to my door, and the last one carried in on your own backs.'),
      L('yirui', '屠千秋。旗，你拿不走。', 'Tu Qianqiu. You won\'t take the banner.'),
      L('tuqianqiu', '我說話向來客客氣氣。聽過我說話的人，大多再也沒說過話。', 'I always speak courteously. Most who have heard me speak never spoke again.'),
      L('xiaotian', '哈。哈。哈。我倒想聽聽，你等一下還能不能這麼客氣。', 'Ha. Ha. Ha. I\'d like to hear whether you can stay so courteous in a moment.'),
      L('yishuo', '哥！一起！', 'Brother! Together!'),
      L('yirui', '一起。', 'Together.'),
    ],
    battle: { theme: 'nether', seed: 5404, w: 14, h: 14, lv: 36, music: 'boss', foes: [F('zhenren', 1, { who: 'tuqianqiu', boss: true, lv: 7, eq: { w: 'ex_baigu', h: 'hat10', b: 'robe10', a: 'beads_regen' }, drops: ['ex_baigu'] }), ymBlack(2, { lv: 2 }), ymKiller(2, { lv: 3 }), F('netherflame', 2, { lv: 2 }), F('goldbone', 1)], goal: { type: 'boss', name: N('屠千秋', 'Tu Qianqiu') } },
    post: [
      L(null, '白骨扇裂成兩半。屠千秋從王座上滑下來，銀色鬼面落在地上，叮的一聲。', 'The bone fan splits in two. Tu Qianqiu slides from the throne, and the silver mask falls to the floor with a clink.'),
      L('tuqianqiu', '……八面旗，原來不是舉起來的。是一群人，一起扛著走的。', '...Eight banners, it seems, are not raised. They are carried — by many people, together.'),
      L('tiewusi', '屠千秋，執法堂拿你。到了堂上，你可以慢慢客氣。', 'Tu Qianqiu, the Law Hall arrests you. In court you may be as courteous as you like.'),
      L(null, '殿外的黑霧散了。八面戰旗插在幽冥殿前，在晨風裡一起飄了起來。', 'The black mist outside the hall lifts. The eight banners stand planted before it, flying together in the morning wind.'),
    ],
    flags: ['ending'] },
];

// the ending: [中文, English] lines rolled up the screen
export const ENDING = [
  ['十天之後，戰旗大會在武林城舉行。', 'Ten days later, the Banner Assembly was held in Wulin City.'],
  ['八派的人捧著八面戰旗走進大殿。', 'The people of the eight houses carried the eight banners into the great hall.'],
  ['鐵無私當著天下英雄，念完了蕭無影的帳本，也念完了自己的錯。', 'Before all the heroes of the land, Tie Wusi read out Xiao Wuying\'s ledger — and his own mistake.'],
  ['錢萬里說，這一回的帳，終於對上了。', 'Qian Wanli said the accounts balanced at last.'],
  ['柳寒煙把寒江閣的旗交到小蓮手上：「下一次大會，換你送。」', 'Liu Hanyan put the Cold River banner in Xiaolian\'s hands: "Next Assembly, you carry it."'],
  ['苦禪大師說，他記性不好，只記得好事。這一路的事，他都記得。', 'Master Kuchan said his memory was poor; he remembered only the good things. He remembered all of this journey.'],
  ['冷笑天沒有留下來吃酒。崖上的風，比酒好。', 'Leng Xiaotian did not stay for the wine. The wind on his cliff was better than wine.'],
  ['武大膽回到鏢局，鏢局的人說，他現在膽子真的很大了。', 'Wu Dadan went back to the escort agency. They said he really was brave now.'],
  ['文對仗寫了一副長聯，掛在書院門口，沒有人看得懂。', 'Wen Duizhang wrote a long couplet for the Academy gate. No one could understand it.'],
  ['阿蠻帶著狼回了青竹寨。寨子的旗，插在最高的竹樓上。', 'A-Man went home to the Green Bamboo Stockade with her wolf. Its banner flies from the highest bamboo house.'],
  ['楚天闊在小冊子上寫：第一百零四戰，平手。', 'In his booklet Chu Tiankuo wrote: Bout one hundred and four — a draw.'],
  ['瘦猴說，他要把這一路的事記下來，以後去茶樓說給人聽。', 'Skinny Monkey said he would write it all down and tell it in a teahouse one day.'],
  ['', ''],
  ['十字鎮，聽雨樓。', 'The Crossroads. The Listening Rain House.'],
  ['醒木一拍。', 'The block claps.'],
  ['「各位，今兒個說一段新鮮的：龍門雙奕，八派戰旗——」', '"Friends, today a fresh tale: the twin Yi of Longmen, and the eight banners—"'],
  ['奕碩坐在台下，聽得眼睛發亮：「先生，好多事明明只有我們知道，你怎麼也知道？」', 'Yi Shuo sat below the stage, eyes shining: "Sir, so much of this only we knew. How do you know it too?"'],
  ['白先生笑了笑，換了一隻手拿醒木。', 'Mr Bai smiled, and moved his clapper block to his other hand.'],
  ['「說書的，什麼都聽。下回分解。」', '"A storyteller listens to everything. To be continued."'],
  ['', ''],
  ['《龍門戰記》　完', 'Longmen Tactics — The End'],
];
