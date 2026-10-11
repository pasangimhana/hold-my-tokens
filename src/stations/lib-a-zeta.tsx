// Owner A: the real ln|zeta(sigma + it)| landscape (zeta.json) as a hidden-line
// ink surface lying on the page at x 164.5..183.9, t running along +x and sigma
// toward -z (sigma = 1/2 on z = 0). The wells at the zeros touch the paper.
// Scene III (RIEMANN, B 24..32) is a hard cut in at B 24 into a drawing that is
// already racing: the whole landscape PENS IN live, no copy over it:
//  - the constant-sigma lanes race along t, the constant-t rows chase them;
//  - the bold critical-line pen (sigma = 1/2) steps from zero to zero and every
//    zero POPS on the 8th-note grid (a ring stamps, a pin shoots up, a ripple);
//  - the dashed edges of the critical strip (sigma = 0 and 1) race back;
//  - the 1/2 line inks heavier on the kick the card's title lands;
//  - HIT (B 30, F 50): the hatched wall stands up at sigma = 7/8.
// Film beat F = 41 + 1.5 (B - 24) inside the scene (warp.ts).
import React from 'react';
import * as THREE from 'three';
import zeta from '../data/zeta.json';
import {Ink, Occluder, V3} from '../ink3d';
import {PAPER} from '../style';
import {backOut, clamp01, lerp} from '../core/anim';
import {ez} from './lib-a-type';

type ZData = {sigma: number[]; t: number[]; logabs: number[][]; zeros: number[]};
const ZD = zeta as unknown as ZData;
const NS = ZD.sigma[2]; // 81
const NT = ZD.t[2]; // 511
const T0 = ZD.t[0], T1 = ZD.t[1]; // 1 .. 52
const sigAt = (i: number) => ZD.sigma[0] + ((ZD.sigma[1] - ZD.sigma[0]) * i) / (NS - 1);
const tAt = (j: number) => T0 + ((T1 - T0) * j) / (NT - 1);

export const ZX0 = 164.5;
export const ZXT = 0.38; // world x per unit t (compressed: the strip fits a 3/4 view beside the card)
export const ZZS = 4.2; // world z per unit sigma
export const XT = (t: number) => ZX0 + (t - 1) * ZXT;
export const ZS = (s: number) => -(s - 0.5) * ZZS;
const LO = -3.0, HI = 2.6, YK = 0.48;
export const YL = (l: number) => (Math.max(LO, Math.min(HI, l)) - LO) * YK;
export const ZX1 = XT(T1);

// ------------------------------------------------------------------ timing (story beats B)
const BF = (F: number) => 24 + (F - 41) / 1.5; // film beat -> story beat inside the scene
export const Z_CUT = 24; // F 41: hard cut in, the drawing already racing
// every zero pops on the grid: F 42, then 8ths from 43 to the kick on 47
export const ZERO_F = [42, 43, 43.5, 44, 44.5, 45, 45.5, 46, 46.5, 47];
export const ZERO_AT = ZERO_F.map(BF);
const PEN_START = BF(40.5); // the pen leaves t = 1 half a kick before the cut
const PEN_END = BF(47.45); // ... and runs off the far end
export const EDGE_AT = BF(47); // the dashed strip edges race back (F 47 -> 48.1)
export const EDGE_DUR = 1.6 / 1.5;
export const TAG_AT = BF(46.5); // F 47.5: the tag rises as the strip drifts right
export const CARD_AT = BF(47); // ~2.2 s to read the name before "Solved." (was F 48) // F 48 (kick): the title; the 1/2 line inks heavier
export const WALL_RISE = 30; // F 50 (kick): HIT, the wall stands up at 7/8; "Solved."
export const LEAN_AT = BF(50.5); // F 50.5: check Lean
export const wallT = (B: number) => ez(B, WALL_RISE - 0.03, 0.5);
// the lanes / rows race at constant speed (pre-rolled so the cut lands mid-race)
const LANES = [BF(39.8), BF(44.6)] as const;
const ROWS = [BF(40.2), BF(45.2)] as const;
const lin = (B: number, [a, b]: readonly [number, number]) => clamp01((B - a) / (b - a));

// the critical-line pen: steps from zero to zero, each step partly eased so it
// surges between zeros and lands on each one on its beat
const PEN_KB = [PEN_START, ...ZERO_AT, PEN_END];
const PEN_KT = [T0, ...ZD.zeros, T1];
export const penT = (B: number) => {
  if (B <= PEN_KB[0]) return T0;
  if (B >= PEN_KB[PEN_KB.length - 1]) return T1;
  let i = 0;
  while (B > PEN_KB[i + 1]) i++;
  const s = (B - PEN_KB[i]) / (PEN_KB[i + 1] - PEN_KB[i]);
  const e = s * s * (3 - 2 * s);
  return lerp(PEN_KT[i], PEN_KT[i + 1], lerp(s, e, 0.55));
};

// ------------------------------------------------------------------ geometry (built once)
type Keyed = {k: number; p: number[]};
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const keyed = (segs: Keyed[]) => {
  segs.sort((a, b) => a.k - b.k);
  const pos = new Float32Array(segs.length * 6);
  const keys = new Float32Array(segs.length);
  segs.forEach((s, n) => {
    pos.set(s.p, n * 6);
    keys[n] = s.k;
  });
  return {pos, keys, k0: keys[0], k1: keys[keys.length - 1]};
};
// number of segments whose key is <= K (binary search)
const upTo = (keys: Float32Array, K: number) => {
  let lo = 0, hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keys[mid] <= K) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
const drawn = (set: {keys: Float32Array; k0: number; k1: number}, f: number) => (f >= 1 ? set.keys.length : upTo(set.keys, lerp(set.k0 - 0.01, set.k1, f)));
const I0 = 10; // crop to sigma >= -1/4
const SURF = (() => {
  const nx = NS - I0, nz = NT;
  const pos = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) pos.set([XT(tAt(j)), YL(ZD.logabs[j][i + I0]), ZS(sigAt(i + I0))], (j * nx + i) * 3);
  const P = (i: number, j: number): V3 => [pos[(j * nx + i) * 3], pos[(j * nx + i) * 3 + 1] + 0.004, pos[(j * nx + i) * 3 + 2]];
  const idx: number[] = [];
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  // Every line set is drawn by a KEYED draw range: segments sorted by a key in t
  // units, and the frontier K(B) runs at constant speed; count = #keys <= K.
  // constant-sigma lanes (every 2nd): lane i lags its leaders by off(i) (lanes
  // near 1/2 lead, plus a fixed jitter), so the tips race ragged, like many pens
  const lanes: Keyed[] = [];
  for (let i = 0; i < nx; i += 2) {
    const off = 5 * Math.abs(sigAt(i + I0) - 0.5) + 4 * hash(i);
    for (let j = 0; j < nz - 1; j++) lanes.push({k: tAt(j) + off, p: [...P(i, j), ...P(i, j + 1)]});
  }
  // constant-t rows (every 4th): each row sweeps front (sigma -1/4) to back over 3 t
  const rows: Keyed[] = [];
  for (let j = 0; j < nz; j += 4) for (let i = 0; i < nx - 1; i++) rows.push({k: tAt(j) + (3 * i) / (nx - 2), p: [...P(i, j), ...P(i + 1, j)]});
  return {geo, lanes: keyed(lanes), rows: keyed(rows)};
})();

export const ZEROS = ZD.zeros.map((t) => ({t, x: XT(t)}));
const ring = (r: number, n = 36, y = 0) => {
  const a: number[] = [];
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
    a.push(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r);
  }
  return new Float32Array(a);
};
// local geometry (placed at each zero): a well ring, a pin (stem + head) and a
// shock ring that runs out from the head in the air (never hidden by the surface)
const PIN_H_ = 2.4;
const RING = ring(0.2);
const RIPPLE = ring(1, 48, PIN_H_);
export const PIN_H = PIN_H_;
const STEM = new Float32Array([0, 0, 0, 0, PIN_H, 0]);
const HEAD = ring(0.13, 24, PIN_H);

// a constant-sigma profile along t (optionally reversed, so a draw range runs back)
const profile = (sig: number, dy = 0.014, rev = false) => {
  const fi = ((sig - ZD.sigma[0]) / (ZD.sigma[1] - ZD.sigma[0])) * (NS - 1);
  const i0 = Math.floor(fi), u = fi - i0;
  const h = (j: number) => YL((1 - u) * ZD.logabs[j][i0] + u * ZD.logabs[j][Math.min(NS - 1, i0 + 1)]);
  const a: number[] = [];
  const js = Array.from({length: NT - 1}, (_, k) => (rev ? NT - 2 - k : k));
  for (const j of js) {
    const p0 = [XT(tAt(j)), h(j) + dy, ZS(sig)], p1 = [XT(tAt(j + 1)), h(j + 1) + dy, ZS(sig)];
    if (rev) a.push(...p1, ...p0);
    else a.push(...p0, ...p1);
  }
  return new Float32Array(a);
};
const CRIT = profile(0.5);
const ONE = profile(1, 0.02, true);
const NIL = profile(0, 0.02, true);

// the hatched wall at sigma = 7/8
export const WALL_Z = ZS(7 / 8);
export const WALL_H = 3.5;
const WALL = (() => {
  const geo = new THREE.PlaneGeometry(ZX1 - ZX0 + 0.6, WALL_H);
  geo.translate((ZX0 + ZX1) / 2, WALL_H / 2, WALL_Z);
  const hatch: number[] = [];
  const x0 = ZX0 - 0.3, x1 = ZX1 + 0.3, step = 0.6; // sparse: 0.2 moiréd at 360p and when platforms downscale
  for (let s = x0 - WALL_H; s < x1; s += step) {
    let xa = s, ya = 0, xb = s + WALL_H, yb = WALL_H;
    if (xa < x0) { ya = x0 - xa; xa = x0; }
    if (xb > x1) { yb = WALL_H - (xb - x1); xb = x1; }
    if (xb > xa) hatch.push(xa, ya, WALL_Z + 0.01, xb, yb, WALL_Z + 0.01);
  }
  const frame = new Float32Array([x0, 0, WALL_Z + 0.012, x1, 0, WALL_Z + 0.012, x0, WALL_H, WALL_Z + 0.012, x1, WALL_H, WALL_Z + 0.012, x0, 0, WALL_Z + 0.012, x0, WALL_H, WALL_Z + 0.012, x1, 0, WALL_Z + 0.012, x1, WALL_H, WALL_Z + 0.012]);
  return {geo, hatch: new Float32Array(hatch), frame};
})();

const ZeroMark: React.FC<{B: number; k: number}> = ({B, k}) => {
  const at = ZERO_AT[k];
  if (B < at - 0.01) return null;
  const d = B - at;
  const stamp = ez(B, at, 0.3); // the well ring stamps down from 3x
  const up = backOut(clamp01(d / 0.32), 2.2); // the pin shoots up, overshoots, settles
  const rip = clamp01((d - 0.06) / 0.5); // the shock ring runs out from the head and fades
  const z = ZEROS[k];
  return (
    <group position={[z.x, 0.012, 0]}>
      <Ink positions={RING} width={2.3} scale={[lerp(3, 1, stamp), 1, lerp(3, 1, stamp)]} opacity={clamp01(d / 0.04)} />
      {rip > 0 && rip < 1 ? <Ink positions={RIPPLE} width={2} scale={[lerp(0.15, 1.1, Math.sqrt(rip)), 1, lerp(0.15, 1.1, Math.sqrt(rip))]} opacity={(1 - rip) * 0.85} /> : null}
      <group scale={[1, Math.max(0.001, up), 1]}>
        <Ink positions={STEM} width={2.1} />
        <Ink positions={HEAD} width={2.7} />
      </group>
    </group>
  );
};

export const ZetaWorld: React.FC<{B: number}> = ({B}) => {
  if (B < Z_CUT) return null;
  const wt = wallT(B);
  const heavy = ez(B, CARD_AT, 0.5);
  const pen = (penT(B) - T0) / (T1 - T0);
  const edge = ez(B, EDGE_AT, EDGE_DUR, (t) => 1 - Math.pow(1 - t, 2));
  return (
    <group>
      <Occluder geometry={SURF.geo} color={PAPER} />
      <Ink positions={SURF.lanes.pos} width={0.85} opacity={0.72} count={drawn(SURF.lanes, lin(B, LANES))} />
      <Ink positions={SURF.rows.pos} width={1.05} count={drawn(SURF.rows, lin(B, ROWS))} />
      <Ink positions={CRIT} width={2.8} upto={pen} />
      {heavy > 0 ? <Ink positions={CRIT} width={4.8} opacity={heavy} /> : null}
      <Ink positions={ONE} width={2.7} dashed={[0.26, 0.15]} upto={edge} />
      <Ink positions={NIL} width={1.8} dashed={[0.26, 0.15]} upto={edge} opacity={0.75} />
      {ZEROS.map((_, k) => (
        <ZeroMark key={k} B={B} k={k} />
      ))}
      {wt > 0 ? (
        <group scale={[1, Math.max(0.001, wt), 1]}>
          <Occluder geometry={WALL.geo} color={PAPER} />
          <Ink positions={WALL.hatch} width={1.1} opacity={0.6} />
          <Ink positions={WALL.frame} width={2.2} />
        </group>
      ) : null}
    </group>
  );
};
