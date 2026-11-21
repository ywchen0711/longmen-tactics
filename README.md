# 龍門戰記 · Longmen Tactics

An original wuxia tactics RPG with the cast of 龍門雙奕 (the Longmen jianghu). It runs in the browser with no build
step: open `index.html` from any static web server.

十年一度的戰旗大會前夕，黑旗會四處搶奪八大門派的戰旗，想在大會上舉起八面旗，奪下武林盟主之位。龍門刀莊的奕叡和
奕碩背著鯉魚戰旗上路，一面一面把旗護送回來。

## The story
A side story (外傳) of 龍門雙奕, told in a prologue, four chapters and a finale — 33 story battles:

- **序章 龍門刀莊** — the Black Wind Fort raids the manor and carries off the Longmen banner; a bun wins over 瘦猴.
- **第一章 黑旗會** — 白先生 at the Listening Rain House; escorting the timid escort master 武大膽; rooftop
  assassins in Suhe and the couplet-speaking scholar 文對仗; 楚天闊's 103rd defeat; jiangshi on the burial mound;
  seizing a ferry.
- **第二章 寒江煙雨** — 柳寒煙 trusts no one; 小蓮 is kidnapped by the Ghost-mask Warden; boat-to-boat battle with the
  Blood Sabre fleet; the river jiao; 厲寒山 in the Blood Sabre Hall. A letter points to a traitor inside the Alliance.
- **第三章 千佛鐘聲** — the Thousand Buddha Temple and its pagoda, the Mercy Cloud Nunnery, the coffin house, the Miao
  marshes and 阿蠻's stockade, a venom toad and the bells of the Beastbinder Sect.
- **第四章 暴龍崖** — wanted in Wulin City; 錢萬里's accounts; Wild Goose Pass; the snow peaks; a duel with 冷笑天; the
  Ghost Mask unmasked on the banner store's roof — the Banner Steward 蕭無影 — and 鐵無私 joins; Fire Valley.
- **終章 幽冥殿** — the Netherworld Valley, 厲寒山's last fight, 蕭無影, and 屠千秋 on his throne of bone.

Battle goals: rout, defeat the leader, protect someone, hold out for N rounds, reach a place (gold flags), escort
someone to the flags, rescue a bound captive (stand next to them, then rout). Bosses are strong only through the
ordinary rules: higher levels, good gear, abilities from the same jobs, formations and the AI.

Between battles: bilingual conversations with portraits, the journal (the story so far, every conversation, people),
towns with shops and teahouses (hire hands, take requests, hear rumours), skirmishes on the roads, 20 side battles
including companions' own quests (瘦猴, 武大膽, 文對仗, 胡半仙 who joins, 楚天闊 who joins, 柳寒煙, 阿蠻), and four
hidden labyrinths: 古墓 The Old Tomb, 水晶宮 The Crystal Palace, 萬妖窟 The Den of Ten Thousand Beasts (墨無涯 at the
bottom) and 鏡湖幻境 The Mirror Lake Illusion (your own reflections).

## The tactics
Built on the engine of 星痕戰旗 Starscar Tactics (the owner's own game), re-themed to the jianghu:

- Isometric maps with height you can turn, tilt and zoom; inn courtyards, bamboo groves, ridges, highways, villages,
  graveyards, marshes, docks, boats joined by planks, a white jade pavilion over the river, rooftops, temples, a
  nine-storey pagoda, sect halls, mountain passes, snow peaks, cliffs, a fire valley, the Netherworld, an old tomb
  and the sunken Crystal Palace.
- Speed decides the turn order; internal arts (內功) and qinggong leaps charge before they land; facing matters — strikes
  from behind can't be dodged and hit harder; high ground hits harder and lets bows reach farther.
- 35 jobs with 329 abilities: 刀客 槍客 劍客 拳師 弓手 醫者 神偷 鏢師 暗器手 輕功刺客 道士 琴師 僧兵 捕快 毒師 馭獸師
  陣法師 機關師 說書人 書生 and the masters 刀王 劍仙 拳聖 神射手 鬼手 真人; one-person arts for 奕叡 (一刀啟程), 奕碩
  (旋風球), 柳寒煙 (寒江雪劍), 冷笑天 (笑盡天下), 苦禪 (大悲掌, 龜息功) and 鐵無私 (鐵鎖連環); and three lost arts from the
  labyrinths (武聖, 龍王, 萬妖主). Mix and match a secondary art, a reaction, a support and a movement ability.
- Pressure points are the statuses (定身穴, 昏睡穴, 封脈, 走火入魔, 斷魂 ...); five-phase elements plus yin and yang.
- 1,056 pieces of gear generated from wuxia tables (sabres, swords, great blades, spears, staves, fans, whips, fist
  guards, hidden weapons, bows, crossbows, qins, brushes, talismans, gadget boxes, a football ...) and 54 famous
  pieces; pills and salves.
- Stealing (from gold to the weapon in their hand), beast taming (馭獸師) and talking people round (說書人).
- Auto-battle with per-fighter orders; fast mode.

## Art and music
- Characters: the Character Gallery's 8-bit `nes` portraits and sprites (`tools/gallery.py` copies them into
  `assets/art.png` + `js/art.js`). New figures drawn for this game were added to the gallery (`src/nes_tactics.py`):
  奕長風, 蕭無影 and eleven job figures.
- Map tiles and props are drawn in code (`js/ui/deco.js`, `js/ui/iso.js`).
- Music: an original score (`tools/music.py`) played with recorded instrument samples by `tools/orch.py`
  (13 tracks in `assets/music/*.m4a`). See CREDITS.md.

## Phones and tablets
Touch controls, safe areas, portrait and landscape layouts, audio unlocked by the first tap, `.m4a` music, a save
when the page is hidden, an icon and a web app manifest.

## Tests
- `node tools/test.mjs` — the data hangs together, and every story battle is fought AI against AI.
- The automated browser play-through (`?test=1`) starts a new game and plays every story battle with auto-battle on,
  through every conversation, to the ending.

Cache-busting: `python tools/importmap.py <version>` rewrites the import map (currently `?v=1`).
