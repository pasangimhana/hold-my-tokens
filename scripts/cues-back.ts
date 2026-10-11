// VI cues (the finale) in STORY beats (B). VI is authored in VI-local film beats F
// (kicks; F_OPEN = 97 at the cut) in lib-lead-chart and converted with bOf.
// `dur` is in seconds (1 F = 0.7179 s).
import fs from 'node:fs';
import {bOf, LADDER, F_OPEN, F_YAH, F_LAUNCH, F_EXIT, F_FLAT, F_END, penAt} from '../src/stations/lib-lead-chart';

const C: {beat: number; type: string; gain: number; dur?: number; pan?: number}[] = [];
const add = (beat: number, type: string, gain = 0.5, extra: {dur?: number; pan?: number} = {}) => C.push({beat: +beat.toFixed(3), type, gain, ...extra});
const SF = 0.7179; // seconds per film beat
const addF = (F: number, type: string, gain = 0.5, extra: {dur?: number; pan?: number} = {}) => add(bOf(F), type, gain, extra);
// nothing before the cut (the 2021 card starts typing just before it)
const addV = (F: number, type: string, gain = 0.5, extra: {dur?: number; pan?: number} = {}) => (F >= F_OPEN ? addF(F, type, gain, extra) : undefined);

// ---- VI (cut in on F 97 straight onto the scroll, the 2021 stat slamming)
addF(F_OPEN, 'thud', 0.6);
addF(F_OPEN, 'paper', 0.3, {dur: 0.4});
// a whoosh through each stretch between landings (the scroll is fastest mid-stretch), louder where it runs faster
LADDER.slice(0, -1).forEach((m, i) => {
  const nx = LADDER[i + 1];
  const rate = (nx.t - m.t) / (nx.kick - m.kick); // years per F
  addF(m.kick + 0.3, 'whoosh', Math.min(0.5, 0.12 + 0.6 * rate), {dur: (nx.kick - m.kick - 0.6) * SF, pan: i % 2 ? -0.3 : 0.3});
});
addF(F_OPEN + 0.4, 'swell', 0.12, {dur: 4.5 * SF}); // under the quick early years
// each milestone lands at centre: its stem (tick), the date types, the stat slams (tap + soft thud), the line types
LADDER.forEach((m) => {
  const long = !!(m as {big2?: string}).big2;
  addV(m.kick - 0.35, 'tick', 0.26);
  for (let k = 0; k < m.date.length; k++) addV(m.kick - 0.35 + (0.25 * k) / m.date.length, 'type', 0.14);
  addV(m.kick, 'tap', 0.45);
  addV(m.kick, 'thud', 0.32);
  if (long) [0.2, 0.4].forEach((d) => addV(m.kick + d, 'tap', 0.3)); // the Erdős lines, "disproved" last
  const s0 = m.kick + (long ? 0.5 : 0.06);
  const nType = Math.min(10, Math.round(m.small.length / 4));
  for (let k = 0; k < nType; k++) addV(s0 + (0.3 * k) / nType, 'type', 0.1);
});
// the pen catches up and climbs the curve: a tick on each dot it passes, a riser into the HIT
LADDER.slice(0, -1).forEach((m) => addF(penAt(m.t), 'tick', 0.3));
addF(112.0, 'pen', 0.24, {dur: (F_YAH - 112.0) * SF});
addF(113.0, 'riser', 0.7, {dur: (F_YAH - 113.0) * SF});
// HIT: "You are here." (the scroll settles on it)
addF(F_YAH, 'impact', 1.0);
addF(F_YAH, 'sub', 0.9);
addF(F_YAH, 'stamp', 0.6);
addF(F_YAH + 1, 'thud', 0.3); // second ripple
// the dolly-out while the trend goes straight up: whoosh out, riser + sub rumble to the exit
addF(F_LAUNCH, 'whoosh', 0.42, {dur: (F_FLAT - F_LAUNCH) * SF});
addF(F_LAUNCH, 'riser', 0.62, {dur: (F_EXIT - F_LAUNCH) * SF});
addF(F_LAUNCH, 'swell', 0.26, {dur: (F_EXIT - F_LAUNCH) * SF});
for (let F = F_LAUNCH + 0.2; F < F_EXIT - 0.05; F += 0.5) addF(F, 'sub', 0.14 + 0.22 * ((F - F_LAUNCH) / (F_EXIT - F_LAUNCH)));
// the button: the tip leaves the frame, HIT the closing line, then a clean decaying tail to the end
addF(F_EXIT, 'impact', 1.0);
addF(F_EXIT, 'sub', 0.9);
addF(F_EXIT, 'stamp', 0.7);
addF(F_EXIT, 'whoosh', 0.22, {dur: 1.0});
[0.5, 1.0, 1.5].forEach((d, i) => addF(F_EXIT + d, 'sub', 0.26 * Math.pow(0.5, i)));
addF(F_EXIT + 1.4, 'swell', 0.12, {dur: (F_END - F_EXIT - 1.6) * SF}); // a soft lift under the hold, into the end card

// ---- END CARD (Credits.tsx, B 74.667–82.667 = film F 141–153; here F = 113 + 1.5 (B − 56))
{
  const bF = (F: number) => 56 + (F - 113) / 1.5; // film beat -> story beat in this stretch
  add(bF(141), 'thud', 0.6); // the hard cut onto fresh paper
  add(bF(141), 'paper', 0.22, {dur: 0.5});
  [141, 142, 143, 144, 145, 146].forEach((F, i) => {
    add(bF(F), 'tick', 0.2); // each figure starts to draw on its kick ...
    add(bF(F) + 0.02, 'pen', 0.13 + 0.01 * (i % 2), {dur: 1.0, pan: i < 3 ? 0.3 : -0.3});
  });
  const MADE = 'Made with';
  for (let j = 0; j < MADE.length; j++) if (MADE[j] !== ' ') add(bF(144.2 + (1.1 * j) / MADE.length), 'type', 0.16); // typed in
  add(bF(146.5), 'riser', 0.65, {dur: 2.5 * SF}); // into the HIT
  add(bF(147.2), 'whoosh', 0.3, {dur: 1.8 * SF}); // the spark spins in
  add(bF(149), 'impact', 1.0); // HIT: "Claude" + the spark slam
  add(bF(149), 'sub', 0.9);
  add(bF(149), 'stamp', 0.75);
  [0.5, 1.0, 1.5].forEach((d, i) => add(bF(149 + d), 'sub', 0.24 * Math.pow(0.5, i)));
  for (let j = 0; j < 8; j++) add(bF(150 + (0.7 * j) / 8), 'type', 0.12); // github.com/openai/math
  add(bF(150.7), 'pen', 0.1, {dur: 0.5}); // the fine print
  add(bF(149.6), 'swell', 0.12, {dur: 3.0 * SF}); // a soft tail into the fade
}

fs.writeFileSync('cues-bc.json', JSON.stringify(C));
console.log(C.length, 'VI story-beat cues');
