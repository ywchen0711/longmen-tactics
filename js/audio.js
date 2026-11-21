// Music and sound. The score is the game's own, recorded with real instrument samples (assets/music/*.m4a, made by
// tools/orch.py); one reused <audio> element plays it, so iOS lets it through after the first tap. Sound effects are
// short synthesised hits, swishes, gongs and chimes made with the Web Audio API.
let ctx = null, master = null, muted = false, musicOff = false, current = null, pending = null;
try { muted = localStorage.getItem('ltac.mute') === '1'; musicOff = localStorage.getItem('ltac.music') === '0'; } catch (e) { /* ignore */ }
export const isMuted = () => muted;
export const isMusicMuted = () => musicOff;
const ONCE = new Set(['victory', 'defeat', 'ending']);
const VOL = 0.55;
let el = null, unlocked = false, fadeT = 0;
function audioEl() {
  if (el || typeof Audio === 'undefined') return el;
  el = new Audio(); el.preload = 'auto'; el.setAttribute('playsinline', ''); el.volume = VOL;
  el.addEventListener('ended', () => { if (current && ONCE.has(current) && current !== 'ending') { const after = { victory: 'world', defeat: 'calm' }[current]; current = null; if (after) music(after); } });
  return el;
}
export function unlock() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  const a = audioEl();
  if (a && !unlocked) { unlocked = true; if (pending) { const p = pending; pending = null; current = null; music(p); } }
}
// iOS only accepts a real tap (touchend / click / keydown), not touchstart or pointerdown
if (typeof addEventListener !== 'undefined') for (const t of ['touchend', 'click', 'keydown']) addEventListener(t, unlock, { passive: true });
export function toggleMute() { muted = !muted; try { localStorage.setItem('ltac.mute', muted ? '1' : '0'); } catch (e) { /* ignore */ } if (master) master.gain.value = muted ? 0 : 0.5; return muted; }
export function toggleMusic() {
  musicOff = !musicOff; try { localStorage.setItem('ltac.music', musicOff ? '0' : '1'); } catch (e) { /* ignore */ }
  const a = audioEl(); if (a) { if (musicOff) a.pause(); else if (current) { const c = current; current = null; music(c); } }
  return musicOff;
}
// play a track by name; a fade of a quarter second between tracks
export function music(name) {
  if (current === name) return;
  current = name;
  const a = audioEl(); if (!a) return;
  if (!unlocked) { pending = name; return; }
  if (musicOff) return;
  clearInterval(fadeT);
  const start = () => {
    a.src = `assets/music/${name}.m4a?v=1`; a.loop = !ONCE.has(name); a.currentTime = 0; a.volume = VOL;
    const p = a.play(); if (p && p.catch) p.catch(() => { pending = name; unlocked = false; });
  };
  if (!a.src || a.paused) return start();
  let v = a.volume; fadeT = setInterval(() => { v -= 0.08; if (v <= 0.02) { clearInterval(fadeT); start(); } else a.volume = v; }, 25);
}
document.addEventListener && document.addEventListener('visibilitychange', () => { const a = el; if (!a) return; if (document.hidden) a.pause(); else if (current && !musicOff && unlocked) a.play().catch(() => {}); });

// ---------------------------------------------------------------- sound effects
function noiseBuf() {
  if (noiseBuf.b) return noiseBuf.b;
  const n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return (noiseBuf.b = b);
}
// a burst of filtered noise: swishes, thuds, cymbals
function burst(t, dur, f0, f1, q, vol, type = 'bandpass') {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
// a struck tone with a few partials: gongs, bells, wood blocks
function strike(t, f, dur, vol, partials = [[1, 1]], type = 'sine') {
  for (const [m, a] of partials) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f * m;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
}
export function sfx(name) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const S = {
    hit: () => { burst(t, 0.09, 3200, 900, 1.2, 0.5); burst(t, 0.12, 400, 90, 0.8, 0.5, 'lowpass'); },          // a blade's swish and a thud
    hurt: () => { burst(t, 0.16, 300, 70, 0.7, 0.6, 'lowpass'); strike(t, 110, 0.12, 0.15, [[1, 1]], 'triangle'); },
    magic: () => { burst(t, 0.5, 600, 4000, 2, 0.18); strike(t, 880, 0.6, 0.08, [[1, 1], [2.76, 0.4]]); strike(t + 0.08, 1320, 0.5, 0.06, [[1, 1]]); },  // a rush of qi and a chime
    skill: () => { burst(t, 0.18, 1800, 5200, 1.5, 0.35); burst(t + 0.05, 0.12, 500, 120, 0.7, 0.35, 'lowpass'); },
    die: () => { burst(t, 0.4, 260, 50, 0.6, 0.6, 'lowpass'); strike(t, 70, 0.5, 0.2, [[1, 1]], 'triangle'); },
    treasure: () => { [1046, 1318, 1568, 2093].forEach((f, i) => strike(t + i * 0.07, f, 0.5, 0.08, [[1, 1], [3, 0.2]])); },
    levelup: () => { [784, 988, 1175, 1568].forEach((f, i) => strike(t + i * 0.08, f, 0.6, 0.09, [[1, 1], [2, 0.3]])); },
    turn: () => strike(t, 1200, 0.12, 0.08, [[1, 1], [2.3, 0.3]]),                                             // a wood block
    ok: () => strike(t, 1500, 0.08, 0.06, [[1, 1]]),
    jump: () => { burst(t, 0.35, 400, 3000, 1.2, 0.25); },                                                     // the whoosh of a qinggong leap
    gong: () => strike(t, 98, 2.2, 0.25, [[1, 1], [1.48, 0.5], [2.09, 0.35], [2.76, 0.2]]),
    win: () => music('victory'),
    lose: () => music('defeat'),
  };
  (S[name] || S.ok)();
}
