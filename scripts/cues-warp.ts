// cues.json is authored in story beats (B); sfx.py needs film beats (F).
import fs from 'node:fs';
import {toF, legacyToB} from '../src/core/warp';
const cues = JSON.parse(fs.readFileSync('cues.json', 'utf8')) as {beat: number}[];
let out = cues.map((c) => ({...c, beat: +toF(c.beat).toFixed(4)}));
// cues-bF.json (scripts/cues-film.mjs, scenes I–V) is authored in LEGACY film beats (the grid
// before 2026-10-11, see warp.ts legacyToB). Map legacy F -> story B -> current F.
const legacyToF = (F: number) => toF(legacyToB(F));
if (fs.existsSync('cues-bF.json'))
  out = [...out, ...(JSON.parse(fs.readFileSync('cues-bF.json', 'utf8')) as {beat: number}[]).map((c) => ({...c, beat: +legacyToF(c.beat).toFixed(4)}))].sort((a, b) => a.beat - b.beat);
fs.writeFileSync('cues-f.json', JSON.stringify(out));
console.log(out.length, 'cues warped; last at F', out[out.length - 1].beat);
