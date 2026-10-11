// Owner A: camera paths.
//  - prologueCam / releaseCam: scenes I THEN and II THE RELEASE (B 0..24) as
//    SHOTS with hard cuts on kicks (the drop at B 8 is a hard cut too). Every
//    shot moves at a constant slow rate (it breathes); the run is the one big move.
//  - zetaCam / zetaFog: scene III RIEMANN (B 24..32 = F 41..53), a hard cut in on B 24.
// Story beats B; film beats F via core/warp.ts (B 0..8 = F 1..17, B 8..24 = F 17..41).
import type {Cam} from '../core/Stage';
import type {V3} from '../world/station';
import {INK, PAPER} from '../style';
import {clamp01, lerp} from '../core/anim';
import {toB} from '../core/warp';

// ------------------------------------------------------------------ spline
// C1 cubic Hermite in time through keys (non-uniform Catmull-Rom tangents).
export type Key = {b: number; pos: V3; target: V3; fov?: number; roll?: number; hold?: boolean};

const herm = (p0: number, p1: number, m0: number, m1: number, h: number, s: number) => {
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * h * m1;
};
const NCH = 8;
const chan = (k: Key, c: number) => (c < 3 ? k.pos[c] : c < 6 ? k.target[c - 3] : c === 6 ? k.fov ?? 38 : k.roll ?? 0);

export const keyCam = (K: Key[], B: number): Cam => {
  const n = K.length;
  const tan = (i: number, c: number) => {
    if (K[i].hold) return 0;
    if (i === 0) return (chan(K[1], c) - chan(K[0], c)) / (K[1].b - K[0].b);
    if (i === n - 1) return (chan(K[n - 1], c) - chan(K[n - 2], c)) / (K[n - 1].b - K[n - 2].b);
    return (chan(K[i + 1], c) - chan(K[i - 1], c)) / (K[i + 1].b - K[i - 1].b);
  };
  let v: number[];
  if (B <= K[0].b) v = Array.from({length: NCH}, (_, c) => chan(K[0], c) + tan(0, c) * (B - K[0].b));
  else if (B >= K[n - 1].b) v = Array.from({length: NCH}, (_, c) => chan(K[n - 1], c) + tan(n - 1, c) * (B - K[n - 1].b));
  else {
    let i = 0;
    while (i < n - 2 && B > K[i + 1].b) i++;
    const h = K[i + 1].b - K[i].b;
    const s = (B - K[i].b) / h;
    v = Array.from({length: NCH}, (_, c) => herm(chan(K[i], c), chan(K[i + 1], c), tan(i, c), tan(i + 1, c), h, s));
  }
  return {pos: [v[0], v[1], v[2]], target: [v[3], v[4], v[5]], fov: v[6], roll: v[7]};
};

// ------------------------------------------------------------------ I + II
// Client (2026-10-11): "why do we have continuous thing. Just add cuts." The
// opening is now SHOTS: one composed pose per idea, HARD CUTS on kicks (the
// station cam simply switches pose; worldCam never blends inside a station).
// Inside a shot the camera moves at a CONSTANT slow rate (alive on its first
// frame, never easing in from a stop); the run to 100 % is the one shot whose
// move is the idea itself.
type Pose = {pos: V3; target: V3; fov: number; roll?: number};
const mixPose = (a: Pose, b: Pose, u: number): Cam => ({
  pos: [lerp(a.pos[0], b.pos[0], u), lerp(a.pos[1], b.pos[1], u), lerp(a.pos[2], b.pos[2], u)],
  target: [lerp(a.target[0], b.target[0], u), lerp(a.target[1], b.target[1], u), lerp(a.target[2], b.target[2], u)],
  fov: lerp(a.fov, b.fov, u),
  roll: lerp(a.roll ?? 0, b.roll ?? 0, u),
});
// a cut sits half a frame (60 fps) before its kick, so it lands on the frame nearest the kick
export const cutB = (F: number) => toB(F - 0.0116);
type Shot = {from: number; to: number; cam: (B: number) => Cam};
const drift = (from: number, to: number, a: Pose, b: Pose): Shot => ({from, to, cam: (B) => mixPose(a, b, clamp01((B - from) / (to - from)))});
const pick = (S: Shot[], B: number) => {
  let s = S[0];
  for (const x of S) if (B >= x.from) s = x;
  return s.cam(B);
};

// I. THEN (B 0..8 = F 1..17; F 0..1 is the lead-in)
export const CUT_RUN = cutB(9); // B 4: cut from the hook to the run
export const CUT_DROP = cutB(17); // B 8: THE DROP, a hard cut into the release
// the run: low over the ruler, already racing on the cut, down the empty 98 %,
// easing into a slow push on "everything else: out of reach." until the drop
const RUN: Key[] = [
  {b: 3.9, pos: [-2.6, 1.7, 2.75], target: [8.6, 0.1, -0.35], fov: 33, roll: -0.015},
  {b: 4, pos: [-1.6, 1.62, 2.6], target: [9.8, 0.1, -0.3], fov: 32.8, roll: -0.02},
  {b: 5, pos: [7.5, 1.1, 1.95], target: [21.5, 0.15, -0.05], fov: 31, roll: -0.045},
  {b: 6, pos: [19.5, 0.92, 1.55], target: [36, 0.25, 0], fov: 29.5, roll: -0.06},
  {b: 6.8, pos: [27.0, 0.98, 1.35], target: [43.5, 0.6, 0], fov: 28.6, roll: -0.05},
  {b: 8, pos: [30.2, 1.02, 1.2], target: [44.6, 0.7, 0], fov: 28.2, roll: -0.04},
  {b: 8.4, pos: [31.0, 1.02, 1.15], target: [44.8, 0.71, 0], fov: 28.1, roll: -0.037},
];
const PRO: Shot[] = [
  // A. the hook around the start of the ruler: a slow push
  drift(-0.5, CUT_RUN, {pos: [0.0, 11.2, 11.6], target: [2.3, 0, -2.1], fov: 36}, {pos: [0.95, 9.95, 10.1], target: [2.75, 0, -1.9], fov: 35.2}),
  // B. the run
  {from: CUT_RUN, to: CUT_DROP, cam: (B) => keyCam(RUN, B)},
];
export const prologueCam = (B: number): Cam => pick(PRO, B);

// II. THE RELEASE (B 8..24 = F 17..41, 1.5 F per B)
export const CUT_COUNT = cutB(19); // B 9.333: the count
export const CUT_STACKS = cutB(24); // B 12.667: the stacks
export const CUT_HOW = cutB(29); // B 16: 4,000 / 372 / 3 hours
export const CUT_LEAN = cutB(34); // B 19.333: the Lean scroll
const REL: Shot[] = [
  // C1. THE DROP: "October 2026." stamps on the cut, the index pages start filling beyond
  drift(CUT_DROP, CUT_COUNT, {pos: [40.5, 10.5, 0.4], target: [56, 0, 0], fov: 40}, {pos: [41.6, 10.0, 0.3], target: [56.4, 0, 0], fov: 39.4}),
  // C2. the count rolls up with the flood and lands on F 21
  drift(CUT_COUNT, CUT_STACKS, {pos: [73.0, 13.75, 0.0], target: [91.7, 0, 0], fov: 40}, {pos: [75.3, 13.1, 0.25], target: [92.8, 0, 0.12], fov: 39.4}),
  // D. the stacks; the peak day lands on F 26
  drift(CUT_STACKS, CUT_HOW, {pos: [91.1, 9.08, 0], target: [110, 3.0, 0], fov: 38}, {pos: [93.3, 8.82, 0], target: [110.4, 3.0, 0], fov: 37.6}),
  // E. the how: rows land on F 30 / 31, the aside on F 32
  drift(CUT_HOW, CUT_LEAN, {pos: [110.6, 14.5, 0], target: [119.9, 0, 0], fov: 38}, {pos: [111.7, 13.85, 0], target: [120.2, 0, 0], fov: 37.6}),
  // F. the Lean statement scrolling; 242 stamps on F 36, the check on F 37
  drift(CUT_LEAN, 24.05, {pos: [125.0, 14.3, 0], target: [135.9, 0, 0], fov: 38}, {pos: [126.4, 12.95, 0], target: [136.1, 0, 0], fov: 37.4}),
];
export const releaseCam = (B: number): Cam => pick(REL, B);

// ------------------------------------------------------------------ III
// RIEMANN (B 24..32 = F 41..53), entered by a hard cut on B 24. One continuous
// crane: it opens high and close over the near end, looking down on the page
// while the lines race across it, then tilts down and pulls out (easing out)
// with the pen stepping from zero to zero, and lands on F 48 in the card framing: the whole strip receding
// into the right ~55 % of the frame, the 2D card on the left. From there a slow
// push (~3 %) breathes through the HIT (B 30 = F 50) to the cut out on B 32.
export const ZKEYS: Key[] = [
  // the cut: high and close over the near end, looking down on the page as the
  // lines race across it left to right
  {b: 23.9, pos: [165.0, 9.4, 3.6], target: [168.2, 0.6, -0.6], fov: 40},
  {b: 24, pos: [165.1, 9.5, 3.7], target: [168.4, 0.6, -0.6], fov: 40},
  // tilting down and pulling out with the pen: the relief stands up, the whole
  // strip big and centred while the zeros pop (F 42 .. 45)
  {b: 25.33, pos: [163.8, 12.2, 11.0], target: [171.2, 0.4, -1.3], fov: 35},
  {b: 26.67, pos: [159.0, 15.5, 20.0], target: [172.6, 0.3, -1.6], fov: 29},
  {b: 27.67, pos: [156.3, 18.3, 21.9], target: [171.5, 0.2, -2.7], fov: 28.6},
  // ... then it rises and drifts the strip right, making room for the card as
  // its title rises (F 48), and lands (eased) on the card framing on F 48.5
  {b: 29, pos: [147.76, 31.21, 25.88], target: [167.13, -0.2, -6.38], fov: 28, hold: true},
  // the breathing push, along the ray to the strip's middle (it stays put, grows ~3 %)
  {b: 32, pos: [148.4, 30.3, 24.9], target: [167.8, -1.1, -7.3], fov: 28},
  {b: 33, pos: [148.6, 30.0, 24.6], target: [168.0, -1.4, -7.6], fov: 28},
];
export const zetaCam = (B: number): Cam => keyCam(ZKEYS, B);
export const zetaFog = (_B: number): [number, number] => [34, 110];

// ------------------------------------------------------------------ light
export const DROP = 7.99; // the lights come on (frame nearest beat 8)
export const pathBg = (B: number) => (B < DROP ? INK : PAPER);
export const prologueBg = (_B: number) => INK;
export const releaseBg = (_B: number) => PAPER;
export const prologueFog = (_B: number): [number, number] => [6, 34];
export const releaseFog = (_B: number): [number, number] => [26, 90];
