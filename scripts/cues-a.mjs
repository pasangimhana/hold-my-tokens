// Story-beat cues (VI–VIII) -> cues.json (warped by cues-warp.ts); film-beat cues come from cues-film.mjs.
import fs from 'node:fs';
const bc = JSON.parse(fs.readFileSync('cues-bc.json', 'utf8'));
fs.writeFileSync('cues.json', JSON.stringify(bc.sort((a, b) => a.beat - b.beat), null, 0));
console.log(bc.length, 'story-beat cues');
