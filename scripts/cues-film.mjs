// Scenes I–V (Then, Release, Riemann, Gallery, Fluids): cues in FILM beats (F).
import fs from 'node:fs';
const C = [];
const add = (beat, type, gain = 0.5, extra = {}) => C.push({beat: +beat.toFixed(3), type, gain, ...extra});
// I. Then and II. Release are SHOTS with hard cuts on kicks (lib-a-path). Authored
// in story beats B and mapped with L(B) = 1.5 B (this file's legacy grid; exact here).
// Cuts get a hit (thud; the drop impact + sub), printed words get pen/stamp,
// no travel whooshes (the race to 100 % keeps one: it is motion inside its shot).
{
  const L = (B) => 1.5 * B;
  // I. Then. Shot A, the hook (F 0–9)
  add(L(0), 'pen', 0.22, {dur: 5.2}); // the ruler plots itself
  add(L(0.3), 'tap', 0.4); // Nov 2024.
  add(L(0.93), 'pen', 0.25, {dur: 0.5}); // The best AI could solve
  add(L(2), 'stamp', 0.85); // 2%
  add(L(2), 'thud', 0.5);
  add(L(2.35), 'pen', 0.18, {dur: 0.5}); // of research-level math problems.
  // shot B, the run (cut on F 9): racing past the 10 % marks
  add(L(4), 'thud', 0.55);
  add(L(4), 'whoosh', 0.4, {dur: 2.4});
  [5.047, 5.384, 5.702, 6.046, 6.421, 7.024].forEach((b) => add(L(b), 'tick', 0.32, {pan: 0.25}));
  add(L(5.5625), 'riser', 0.75, {dur: 3.4}); // peaks on the drop
  add(L(6), 'pen', 0.25, {dur: 0.6}); // everything else:
  add(L(6.25), 'pen', 0.2, {dur: 0.5}); // out of reach.
  // THE DROP (B 8 = F 17): the hard cut into the release; "October 2026." stamps on it
  add(L(8), 'impact', 1.0);
  add(L(8), 'sub', 0.9);
  add(L(8), 'stamp', 0.6);
  // II. Release. C1/C2: the flood types its titles; the count cuts in on F 19, lands on F 21
  for (let b = 12.0; b < 15.9; b += 0.16 - 0.06 * ((b - 12) / 3.9)) add(b, 'type', 0.15 + 0.1 * Math.abs(Math.sin(b * 9)));
  add(L(28 / 3), 'thud', 0.45); // cut to the count
  add(L(9.8), 'pen', 0.25, {dur: 0.6}); // new math papers
  add(L(10.27), 'riser', 0.3, {dur: 0.6});
  add(L(32 / 3), 'thud', 0.8); // 719 lands (hit)
  add(L(10.8), 'pen', 0.22, {dur: 0.6}); // written by one AI model.
  // D: the stacks (cut on F 24, sheets already falling); 188 lands on F 26
  add(L(38 / 3), 'thud', 0.6);
  add(L(12.7), 'pen', 0.25, {dur: 0.6}); // In under four weeks.
  for (let b = L(38 / 3); b < L(14.5); b += 0.22) add(b, 'flip', 0.1);
  add(L(40 / 3), 'thud', 0.7);
  add(L(40 / 3), 'stamp', 0.55); // 188 in one day
  add(L(14), 'thud', 0.5);
  // E: the how (cut on F 29). ~4,000 counts from the cut, lands F 30; 372 lands F 31;
  // the aside on F 32
  add(L(16), 'thud', 0.5);
  for (let i = 0; i < 6; i++) add(L(16.05) + i * 0.15, 'tick', 0.24);
  add(L(50 / 3), 'thud', 0.65);
  for (let i = 0; i < 5; i++) add(L(16.93) + i * 0.12, 'tick', 0.24);
  add(L(52 / 3), 'thud', 0.65);
  add(L(18), 'pen', 0.2, {dur: 0.6}); // about 3 hours of thinking each
  // F: the Lean scroll (cut on F 34); 242 stamps on F 36, the check on F 37
  add(L(58 / 3), 'thud', 0.5);
  for (let b = L(58 / 3); b < L(62 / 3); b += 0.06) add(b, 'type', 0.12);
  add(L(62 / 3), 'stamp', 0.8);
  add(L(62 / 3), 'thud', 0.5);
  add(L(64 / 3), 'tick', 0.45);
  add(L(22), 'swell', 0.2, {dur: 2.1}); // into the cut to III on F 41
}
// III. Riemann: authored in CURRENT film beats F (41–53, 1.5 F per story beat B)
// and mapped to the legacy grid this file uses: legacy F = 36 + 2 (B − 24)
// = 36 + 4/3 (F − 41). The warp bends the first segment (F 41–42.5) slightly, so
// those cues use exact values (bisection on warp.ts legacyToB).
// Hard cut in on F 41 into the drawing; zeros pop on F 42, 43 … 47 (8ths);
// edges race back F 47; tag 47.5, title 48; riser into the HIT on F 50 (B 30):
// impact + sub + stamp, "Solved."; ✓ Lean on 50.5; swell into the cut on 53.
{
  const EXACT = {41.25: 36.2974, 41.5: 36.6175, 41.75: 36.9566, 42: 37.3072, 42.25: 37.6586};
  const LZ = (F) => EXACT[F] ?? 36 + (4 / 3) * (F - 41);
  const ZF = [42, 43, 43.5, 44, 44.5, 45, 45.5, 46, 46.5, 47];
  add(LZ(41), 'thud', 0.6); // the cut
  add(LZ(41), 'pen', 0.18, {dur: 3.1}); // the bed: lanes and rows racing in (to F 45.2)
  add(LZ(41), 'whoosh', 0.22, {dur: 2.4}); // the crane tilting down and out
  // the critical-line pen: one stroke per step, landing on each zero
  [41, ...ZF.slice(0, -1)].forEach((f, k) => {
    const next = ZF[k];
    add(LZ(f === 41 ? 41.25 : f), 'pen', 0.2, {dur: (next - (f === 41 ? 41.25 : f)) * 0.7179 * 0.9, pan: -0.45 + 0.09 * k});
  });
  ZF.forEach((f, k) => add(LZ(f), 'tap', k === ZF.length - 1 ? 0.5 : 0.42, {pan: -0.45 + 0.1 * k})); // the zeros pop
  add(LZ(47), 'pen', 0.18, {dur: 0.75}); // the dashed strip edges race back
  for (let i = 0; i < 6; i++) add(LZ(47.1 + i * 0.16), 'tick', 0.15, {pan: 0.4 - 0.15 * i});
  for (let j = 0; j < 4; j++) add(LZ(46.5 + j * 0.12), 'type', 0.12); // tag "open for over a century" types in
  add(LZ(47.49), 'riser', 0.6, {dur: 1.8}); // 1.8 s = 2.5 F: peaks on the HIT
  add(LZ(47), 'thud', 0.3); // title starts typing ...
  for (let j = 0; j < 9; j++) add(LZ(46.95 + j * 0.1), 'type', 0.13 + 0.04 * (j % 2)); // ... "The quasi-Riemann hypothesis"
  add(LZ(48), 'pen', 0.22, {dur: 0.6});
  add(LZ(49.75), 'swoosh', 0.3); // the wall's air
  add(LZ(50), 'impact', 0.95); // HIT: the wall stands up, "Solved."
  add(LZ(50), 'sub', 0.85);
  add(LZ(50), 'stamp', 0.7);
  add(LZ(50.5), 'tick', 0.45); // ✓ Lean
  add(LZ(50.77), 'swell', 0.18, {dur: 1.6}); // into the cut on 53
}
// IV. Gallery (cut in on 52). Hard cuts, no travel: figure k cuts in on its
// landing kick k (figure 1's shot opens on 52 with the figure drawing in; its
// card lands on 54). Every verdict hits (impact + sub + stamp, with the shake).
// After the cut the name types in, the counter rolls (ticks), the verdict stamps on
// k + 2, the copy line rises (pen) and the mark ticks.
add(52.0, 'thud', 0.6);
add(52.0, 'pen', 0.22, {dur: 0.9}); // K7 draws in
// (legacy F: lb story beats after a figure's cut = legacy k + 2·lb; the verdict is at lb 1 = k + 2)
[54, 58, 62, 66, 70, 74, 78].forEach((k, i) => {
  const last = i === 6;
  if (i > 0) add(k, 'thud', 0.55); // the cut
  // the name types in while the figure draws (tag lb 0–0.18, name lb 0.12–0.54)
  for (let j = 0; j < 11; j++) add(k + 0.06 + j * 0.095, 'type', 0.12 + 0.05 * ((j * 7) % 3));
  for (let j = 0; j < 5; j++) add(k + 1.14 + j * 0.1, 'tick', 0.2); // "N years open" rolling
  add(k + 2, 'stamp', 0.7); // the verdict ...
  add(k + 2, 'impact', last ? 0.9 : 0.6); // ... with the hit
  add(k + 2, 'sub', last ? 0.7 : 0.45);
  add(k + 2.16, 'pen', 0.18, {dur: 0.7}); // the line
  add(k + 2.5, 'tick', 0.35); // ✓ Lean / paper
});
add(57.6,'shimmer', 0.12, {dur: 1.6}); // the 7-colouring blooms in from the centre
[62.05, 62.6, 63.15, 63.7].forEach((b) => add(b, 'tap', 0.4)); // +6 hops land on 11, 17, 23, 29
[66.25, 66.5, 66.75].forEach((b) => add(b, 'tap', 0.32)); // the walker's last hops (16ths) ...
add(66.85, 'tick', 0.22); // ... its circle finds nothing
add(67.05, 'pen', 0.26, {dur: 0.85}); // the moat draws round
// V. Fluids (cut in on 84): Navier–Stokes, the run. LEGACY F (V = B 48–56 at
// 1.5 F/B; cues-warp maps it; 1 F = 0.7179 s now). A swirl bed (whooshes
// panning L/R, closing in), the four stat slams on the kicks 88–91 (thud +
// stamp, building), a riser into the HIT on 93 (B 54, "The flow blows up.":
// impact + sub + stamp, the rings burst), a swell into the cut at 96.
add(84.0, 'thud', 0.7);
add(84.0, 'sub', 0.6);
add(84.0, 'whoosh', 0.3, {dur: 1.6});
add(84.05, 'pen', 0.26, {dur: 1.05}); // tag + "A Millennium Prize problem."
{
  let b = 84.6, k = 0;
  while (b < 92.6) {
    const p = (b - 84.6) / 8.0;
    add(b, 'whoosh', 0.1 + 0.2 * p * p, {dur: 1.7 - 0.95 * p, pan: k % 2 ? 0.55 : -0.55});
    b += 1.5 - 1.05 * p;
    k++;
  }
}
[88, 89, 90, 91].forEach((b, i) => {
  // 10,000 AI agents · 88 hours · 2.7 million messages · 130 billion tokens
  add(b, 'thud', 0.5 + 0.06 * i);
  add(b, 'stamp', 0.55 + 0.08 * i);
  if (i >= 2) add(b, 'sub', 0.3 + 0.12 * (i - 2));
  if (i === 3) add(b, 'impact', 0.45);
});
add(89.0, 'riser', 0.7, {dur: 2.87}); // 4 F: peaks on 93
add(92.75, 'swoosh', 0.35, {pan: -0.4});
add(93.0, 'impact', 1.0);
add(93.0, 'sub', 0.9);
add(93.0, 'stamp', 0.85); // "The flow blows up."
add(93.0, 'whoosh', 0.45, {dur: 1.4}); // the rings
add(93.4, 'pen', 0.2, {dur: 0.7}); // the qualifier
[94.0, 94.85].forEach((b, i) => add(b, 'whoosh', 0.2 - 0.06 * i, {dur: 1.1, pan: i % 2 ? 0.5 : -0.5}));
add(93.25, 'swell', 0.2, {dur: 1.97}); // into the cut at 96
fs.writeFileSync('cues-bF.json', JSON.stringify(C));
console.log(C.length, 'film-beat cues');
