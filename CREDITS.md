# Credits

龍門戰記 · Longmen Tactics is an original game. Its story, dialogue, jobs, abilities, items, maps, battle goals, art
and music were made for it, building on the owner's own earlier games: the engine of 星痕戰旗 Starscar Tactics
(battle rules, isometric renderer, menus), the cast of 龍門雙奕 / Wulin Bricks, and the Character Gallery. It is a
genre take on isometric tactics RPGs and uses none of their names, characters, music, text or interface art.

## Art (original)
- **People:** the 龍門武林 cast (奕叡, 奕碩, 白先生, 柳寒煙, 小蓮, 苦禪, 冷笑天, 鐵無私, 錢萬里, 黑熊, 刀疤, 瘦猴, 厲寒山,
  鬼面護法, 屠千秋), the people of Longmen Quest II (胡半仙, 賈八方, 武大膽, 文對仗, 楚天闊, 阿蠻, 墨無涯), 靜慈師太, the
  sect troops of 龍門江湖志, and the figures drawn for this game (奕長風, 蕭無影, 醫者, 女醫, 神偷, 道士, 琴師, 琴姬, 毒師,
  陣法師, 說書人, 書生, 鬼手): original art from the Character Gallery (ywchen0711/character-gallery), `nes` style.
- **Beasts and creatures:** the gallery's common foes and great beasts, original art from the Character Gallery.
- **Maps, tiles, props, the map of the jianghu, the ink-wash title backdrop and the icons:** drawn in code.

## Music and sound (original)
- **Soundtrack:** composed for this game (the score is `tools/music.py`) and played by recorded instruments with the
  sampler and mixer `tools/orch.py` (adapted from Longmen Quest II's): 龍門戰旗 · The Banners of Longmen; 江湖行 ·
  Walking the Jianghu; 茶館閒話 · Gossip over Tea; 說書人 · The Storyteller; 黑旗 · The Black Banner; 寒江雪 · Snow on
  the Cold River; 八方風雨 · Storm from Eight Directions; 刀光劍影 · Flashing Blades; 過關斬將 · Through the Passes;
  幽冥殿 · The Netherworld Hall; 旗開得勝 · Victory at the First Banner; 壯志未酬 · Ambition Unfulfilled; 八旗同風 ·
  Eight Banners in One Wind.
- **Sound effects:** synthesised in the browser with Web Audio.

## Third-party
- **Instrument samples for the soundtrack** (every file is listed in `tools/orch_sources.json`). All are
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication); they are credited with
  thanks, not because the licence asks for it. Changes made: notes cut, trimmed, retuned, level-matched,
  pitch-shifted and mixed into the rendered music.
  - **VS Chamber Orchestra: Community Edition (VSCO-2 CE)** by Versilian Studios (recorded by Sam Gossner and Simon
    Dalzell, sample cutting by Elan Hickler / Soundemote): strings (sustain, spiccato, pizzicato, tremolo), harp,
    flute, bassoon, French horn, trumpet, trombone, glockenspiel, timpani, drums, cymbals, tam-tam, slit drum, claves,
    shaker, tambourine, finger cymbal, wind chimes and bells. https://github.com/sgossner/VSCO-2-CE
  - **Erhu:** "Chinese Erhu" pack by tarane468 (freesound.org). https://freesound.org/people/tarane468/packs/26451/
  - **Dizi:** "Flute Dizi C all notes + pitched semitones" pack by Hypnotriod (freesound.org).
    https://freesound.org/people/Hypnotriod/packs/21613/
  - **Guzheng:** "LOVELY CHINESE GUZHENG PLUCKED.wav" by Pufermufin (freesound.org).
    https://freesound.org/people/Pufermufin/sounds/396868/
  - **Muyu:** "Mokugyo.wav" by jonopodmore. https://freesound.org/people/jonopodmore/sounds/607215/
  - **Temple blocks:** "Temple Blocks (5pcs) - Hard Wood Mallets" by sazanami12.
    https://freesound.org/people/sazanami12/sounds/863784/
  - **Opera cymbal:** "cymbal splash hit nearby chinese opera in park" by kyles.
    https://freesound.org/people/kyles/sounds/452400/
  - **Taiko:** "taiko.wav" and "taiko2.wav" by Anuj_Shrestha1.
    https://freesound.org/people/Anuj_Shrestha1/sounds/486140/ and https://freesound.org/people/Anuj_Shrestha1/sounds/486141/
- **Fonts:** Noto Sans TC and Noto Serif TC (Google Fonts), SIL Open Font License 1.1, loaded from Google Fonts.

## AI-painted portraits and sprites

The busts and map sprites in `assets/ai/` were painted on a local GPU with
[Animagine XL 4.0](https://huggingface.co/cagliostrolab/animagine-xl-4.0) (CreativeML Open RAIL++-M) and, for the
sprites, the [Pixel Art XL](https://huggingface.co/nerijs/pixel-art-xl) LoRA, from prompts written for each character
(`tools/ai_tags.py`). Made with `tools/ai_art.py`, `tools/ai_cut.py` and `tools/ai_pack.py`.
