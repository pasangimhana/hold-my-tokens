// Bundle once, render many stills in one browser, optional contact sheet.
// usage: node scripts/stills.mjs Release:0.5,4,9 Zeta:2,6 [--sheet name] [--cols 4] [--width 480]
// Numbers are beats local to the composition (Film uses global beats).
import path from 'node:path';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const B = 0.7179, FPS = 60;
const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
const sheet = opt('--sheet', null);
const cols = parseInt(opt('--cols', '4'), 10);
const width = parseInt(opt('--width', '480'), 10);
const skip = new Set();
['--sheet', '--cols', '--width'].forEach((k) => {
  const i = argv.indexOf(k);
  if (i >= 0) skip.add(i).add(i + 1);
});
const jobs = argv
  .filter((_, i) => !skip.has(i))
  .flatMap((a) => {
    const [comp, beats] = a.split(':');
    return beats.split(',').map((b) => ({comp, beat: parseFloat(b)}));
  });
if (!jobs.length) {
  console.log('usage: node scripts/stills.mjs Comp:beat,beat ... [--sheet name]');
  process.exit(1);
}
fs.mkdirSync('stills', {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const chromiumOptions = {gl: 'angle'};
const browser = await openBrowser('chrome', {chromiumOptions});
const comps = {};
const outs = [];
for (const j of jobs) {
  comps[j.comp] ??= await selectComposition({serveUrl, id: j.comp, puppeteerInstance: browser, chromiumOptions});
  const c = comps[j.comp];
  const frame = Math.max(0, Math.min(c.durationInFrames - 1, Math.round(j.beat * B * FPS)));
  const out = `stills/${j.comp}-${String(j.beat).padStart(5, '0')}.jpg`;
  await renderStill({composition: c, serveUrl, output: out, frame, imageFormat: 'jpeg', jpegQuality: 90, puppeteerInstance: browser, chromiumOptions, overwrite: true});
  outs.push(out);
  console.log(out);
}
await browser.close({silent: true});
if (sheet) {
  const list = `stills/.${sheet}.txt`;
  fs.writeFileSync(list, outs.map((o) => `file '${path.resolve(o)}'`).join('\n'));
  const rows = Math.ceil(outs.length / cols);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=${width}:-1,tile=${cols}x${rows}:padding=4:color=gray`, '-frames:v', '1', `stills/${sheet}-sheet.png`]);
  console.log(`stills/${sheet}-sheet.png`);
}
