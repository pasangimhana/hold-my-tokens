// Camera paths for IV GALLERY (Results, B 32–48) and V FLUIDS (B 48–56),
// owner B. Both scenes are cut into (Station.cut), so each path starts composed.
//  - Gallery: one composed shot per figure and a HARD CUT on each figure's
//    landing kick (B = 31 + 2k); no travel between them. Figure 1's shot also
//    carries the opener "And it kept going." (from the cut at B 32). Inside a
//    shot the camera breathes: a slow orbit about the figure and a gentle push.
//    The 2D type column alternates sides (figure 1 right, 2 left, ...); the
//    figure is framed on the other side (ox < 0: left of centre).
//  - Fluids: cut in on a low 3/4 view of the vortex, already moving: a slow
//    constant-rate orbit and a steady push through the HIT (B 54) and the
//    breathing hold until the cut at 56.
import type {Cam} from '../core/Stage';
import type {V3} from '../world/station';
import {orbitCam} from './lib-b-kit';
import {clamp01} from '../core/anim';

// ------------------------------------------------------------------ gallery
export const R_FROM = 32;
export const X0 = 206;
export const GAP = 18;
export const N_RES = 8; // index 0 = the opener (no figure), 1..7 = figures
export const OX = (k: number) => X0 + k * GAP; // figure k stands at (OX(k), 0, 0)
export const LAND = (k: number) => (k === 0 ? R_FROM : 31 + 2 * k); // B of figure k's kick (its cut)
export const SHOT_FROM = (k: number) => (k <= 1 ? R_FROM : LAND(k));
export const SHOT_TO = (k: number) => (k >= N_RES - 1 ? 48 : LAND(k + 1));
export const shotOf = (B: number) => {
  let k = 1;
  for (let i = 2; i < N_RES; i++) if (B >= LAND(i)) k = i;
  return k;
};

// A shot: the camera orbits the figure's visual centre c (relative to
// (OX(k), 0, 0)) at distance r, and aims off it so that c lands (ox, oy) px
// from the frame centre (1920×1080). Over the shot it turns by dAz (and dEl)
// and pushes in by `push` (fraction of r), at a constant slow rate.
type Shot = {c: V3; r: number; az: number; el: number; fov: number; ox: number; oy: number; dAz: number; dEl: number; push: number};
export const SHOTS: (Shot | null)[] = [
  null, // opener: rides on figure 1's shot
  {c: [0, 3, 0], r: 15.23, az: 0.305, el: 0.25, fov: 27, ox: -436, oy: 9, dAz: 0.1, dEl: 0, push: 0.05}, // K7 (+ opener)
  {c: [0, 0.3, 0], r: 30.15, az: -0.057, el: 0.84, fov: 27, ox: 411, oy: -144, dAz: 0.06, dEl: -0.03, push: 0.04}, // hex plane
  {c: [0, 1.2, 0.3], r: 20.46, az: 0.044, el: 0.637, fov: 27, ox: -474, oy: -111, dAz: 0.06, dEl: 0, push: 0.04}, // primes
  {c: [0, 0, 0], r: 32.86, az: 0.039, el: 0.816, fov: 27, ox: 447, oy: -128, dAz: 0.06, dEl: -0.03, push: 0.04}, // Gauss
  {c: [0, 1.85, 0], r: 15.80, az: 0.015, el: 0.656, fov: 27, ox: -400, oy: -73, dAz: 0.08, dEl: 0, push: 0.04}, // Kakeya
  {c: [0, 3.2, 0], r: 14.50, az: 0.088, el: 0.3, fov: 27, ox: 398, oy: -60, dAz: 0.08, dEl: 0, push: 0.04}, // Cayley
  {c: [0, 2.6, 0], r: 16.65, az: 0.258, el: 0.477, fov: 27, ox: -462, oy: -62, dAz: 0.08, dEl: 0, push: 0.05}, // torus
];
export const shotCam = (k: number, u: number): Cam => {
  const s = SHOTS[k]!;
  const az = s.az + s.dAz * (u - 0.5), el = s.el + s.dEl * (u - 0.5);
  const r = s.r * (1 + s.push * (0.5 - u));
  const C: V3 = [OX(k) + s.c[0], s.c[1], s.c[2]];
  const f = 540 / Math.tan(((s.fov / 2) * Math.PI) / 180);
  const a = (s.ox * r) / f, b = (s.oy * r) / f;
  const right: V3 = [Math.cos(az), 0, -Math.sin(az)];
  const up: V3 = [-Math.sin(az) * Math.sin(el), Math.cos(el), -Math.cos(az) * Math.sin(el)];
  const T: V3 = [C[0] - right[0] * a + up[0] * b, C[1] - right[1] * a + up[1] * b, C[2] - right[2] * a + up[2] * b];
  const pos: V3 = [C[0] + r * Math.sin(az) * Math.cos(el), C[1] + r * Math.sin(el), C[2] + r * Math.cos(az) * Math.cos(el)];
  return {pos, target: T, fov: s.fov, roll: 0};
};
// hard cuts: the shot is chosen by the beat; u runs 0 -> 1 across the shot at a constant rate
export const galleryCam = (B: number): Cam => {
  const k = shotOf(B);
  return shotCam(k, clamp01((B - SHOT_FROM(k)) / (SHOT_TO(k) - SHOT_FROM(k))));
};

// ------------------------------------------------------------------ fluids
// The vortex stands on the axis through VC (mid-plane at VC[1]). The camera
// orbits it at a constant slow rate (it also spins on its own) and pushes in
// steadily; the look point sits F_OFF to the left of the axis so the vortex
// fills the right of the frame and the words get the left.
export const VC: V3 = [392, 4.2, -1.0];
export const F_OFF = 3.0;
export const F_FOV = 30;
export const F_AZ = (B: number) => -1.86 + 0.045 * (B - 48);
export const F_EL = (B: number) => 0.29 - 0.035 * clamp01((B - 48) / 8);
export const F_R = (B: number) => 25.4 * (1 - 0.0105 * (B - 48));
export const fluidCam = (B: number): Cam => {
  const az = F_AZ(B);
  const t: V3 = [VC[0] - Math.cos(az) * F_OFF, VC[1] + 0.05, VC[2] + Math.sin(az) * F_OFF];
  return orbitCam(t, F_R(B), az, F_EL(B), F_FOV);
};
