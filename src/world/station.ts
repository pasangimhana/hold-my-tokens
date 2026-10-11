// One continuous take. The film is a single paper world with one camera.
// Each section is a STATION: it owns a window of global beats, a camera
// function for that window, its 3D content, and the text printed into the
// world. Between stations the camera glides (blend of the two station cams,
// lifted into an arc) so there is never a cut, a blank page or a reset.
import type {Cam} from '../core/Stage';
import {clamp01, lerp} from '../core/anim';

export type V3 = [number, number, number];

export type StationProps = {B: number}; // B = GLOBAL beat
export type TextProps = {B: number; cam: Cam};

export type Station = {
  id: string;
  from: number; // global beat the station "owns" the camera from (a kick)
  to: number; // global beat it hands over
  cam: (B: number) => Cam; // must be defined a little outside [from, to] too
  World?: React.FC<StationProps>; // 3D content (inside <Stage>)
  Text?: React.FC<TextProps>; // DOM planes printed in the world (inside <TextLayer>)
  Screen?: React.FC<TextProps>; // screen-space extras (Anchors), drawn above
  mount?: [number, number]; // beats before `from` / after `to` the content stays mounted (default [2, 2])
  bg?: (B: number) => string; // clear colour while this station is active (default paper)
  fog?: (B: number) => [number, number]; // linear fog near/far
  // hand-over INTO this station: glide window [from - lead, from + tail]
  lead?: number;
  tail?: number;
  arc?: number; // extra lift (world units) at the middle of the glide
  cut?: boolean; // true: HARD CUT into this station exactly on `from` (no glide). Use between major scenes.
  hits?: number[]; // story beats of big moments: the whole frame gets a camera punch + short shake
};

// smootherstep: zero velocity and acceleration at both ends
export const smoother = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const mixV = (a: V3, b: V3, w: number): V3 => [lerp(a[0], b[0], w), lerp(a[1], b[1], w), lerp(a[2], b[2], w)];

const hexToRgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mixHex = (a: string, b: string, w: number) => {
  const A = hexToRgb(a), C = hexToRgb(b);
  const r = A.map((v, i) => Math.round(lerp(v, C[i], clamp01(w))));
  return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
};

// Which station(s) drive the camera at global beat B, and with what weight.
export const stationMix = (S: Station[], B: number) => {
  for (let i = 1; i < S.length; i++) {
    const nx = S[i];
    if (nx.cut) {
      if (B >= nx.from && B < nx.from + 1e-9) return {a: nx, b: nx, w: 0};
      continue;
    }
    const lead = nx.lead ?? 0.6, tail = nx.tail ?? 0.3;
    if (B >= nx.from - lead && B < nx.from + tail) {
      const w = smoother((B - (nx.from - lead)) / (lead + tail));
      return {a: S[i - 1], b: nx, w};
    }
  }
  let cur = S[0];
  for (const s of S) if (B >= s.from) cur = s;
  return {a: cur, b: cur, w: 0};
};

export const worldCam = (S: Station[], B: number): Cam => {
  const {a, b, w} = stationMix(S, B);
  const ca = a.cam(B);
  if (a === b || w <= 0) return ca;
  const cb = b.cam(B);
  const pos = mixV(ca.pos, cb.pos, w);
  const target = mixV(ca.target ?? [0, 0, 0], cb.target ?? [0, 0, 0], w);
  // arc: lift proportional to the distance travelled (crane over, not through)
  const dist = Math.hypot(cb.pos[0] - ca.pos[0], cb.pos[1] - ca.pos[1], cb.pos[2] - ca.pos[2]);
  const lift = Math.sin(Math.PI * w) * (b.arc ?? Math.min(6, dist * 0.12));
  pos[1] += lift;
  target[1] += lift * 0.35;
  return {
    pos,
    target,
    fov: lerp(ca.fov ?? 35, cb.fov ?? 35, w),
    roll: lerp(ca.roll ?? 0, cb.roll ?? 0, w),
  };
};

export const worldBg = (S: Station[], B: number, paper: string) => {
  const {a, b, w} = stationMix(S, B);
  const ca = a.bg ? a.bg(B) : paper;
  const cb = b.bg ? b.bg(B) : paper;
  return a === b ? ca : mixHex(ca, cb, w);
};

export const worldFog = (S: Station[], B: number): [number, number] => {
  const {a, b, w} = stationMix(S, B);
  const fa = a.fog ? a.fog(B) : [12, 40];
  const fb = b.fog ? b.fog(B) : [12, 40];
  return [lerp(fa[0], fb[0], w), lerp(fa[1], fb[1], w)];
};

// Global "hit": a punch-in (scale) that springs back, plus a short decaying shake.
// Returns {scale, dx, dy, rot} for the whole frame. Deterministic in B.
export const hitFx = (S: Station[], B: number) => {
  let amp = 0;
  for (const s of S) for (const h of s.hits ?? []) {
    const d = B - h;
    if (d >= -0.02 && d < 1.2) amp = Math.max(amp, Math.exp(-6 * Math.max(0, d)));
  }
  if (amp < 1e-3) return {scale: 1, dx: 0, dy: 0, rot: 0};
  const n = (k: number) => Math.sin(B * 97.0 + k * 1.7) * 0.6 + Math.sin(B * 61.0 + k * 3.1) * 0.4;
  return {scale: 1 + 0.035 * amp, dx: n(1) * 9 * amp, dy: n(2) * 7 * amp, rot: n(3) * 0.35 * amp};
};

export const isMounted = (s: Station, B: number) => {
  const [pre, post] = s.mount ?? [2, 2];
  return B >= s.from - pre && B < s.to + post;
};
