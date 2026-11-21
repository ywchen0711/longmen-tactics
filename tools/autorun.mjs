// node tools/autorun.mjs [port] — the automated browser play-through: needs puppeteer-core and Chrome, and the game served on
// 127.0.0.1:<port> (default 8445). Opens index.html?test=1 and runs the driver below to the ending.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const DRIVER = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'autorun-driver.js'), 'utf8');
const scriptFile = '__inline__', out = 'autorun', W = '1280', H = '720';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=512'], protocolTimeout: 1800000 });
const p = await b.newPage(); await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 1, isMobile: !!process.env.MOBILE, hasTouch: !!process.env.MOBILE }); const errs = [];
p.on('pageerror', (e) => errs.push('PAGE ' + e.message)); p.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/hub\.js|save\.js|404|Failed to load resource/.test(t)) errs.push(m.type() + ' ' + t); if (m.type() === 'log') console.log('LOG', t); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (n) => { await p.screenshot({ path: out + '-' + n + '.png' }); console.log('shot', n); };
await p.goto('http://127.0.0.1:' + (process.argv[2] || 8445) + '/index.html?test=1'); await wait(+(process.env.BOOT || 3000));
try {
  await (new Function('p', 'wait', 'shot', 'errs', 'return (async () => {' + DRIVER + '})()'))(p, wait, shot, errs);
} catch (e) { console.log('SCRIPT ERROR', e.message); }
console.log('ERRORS', errs.slice(0, 30).join('\n'));
await b.close();
