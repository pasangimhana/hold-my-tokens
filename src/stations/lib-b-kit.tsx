// Shared helpers for Results / Fluid (owner B). Pure functions of the
// global beat; no clocks, no randomness.
import React from 'react';
import type {Cam} from '../core/Stage';
import type {V3} from '../world/station';
import {clamp01, seg, expoOut, lerp} from '../core/anim';

export const ez = (b: number, at: number, dur: number, f: (t: number) => number = expoOut) => f(seg(b, at, dur));
export const cubicOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const quintOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 5);
export const cubicIn = (t: number) => Math.pow(clamp01(t), 3);
export const quadIn = (t: number) => Math.pow(clamp01(t), 2);
export const smooth5 = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// camera orbiting a target: az = angle round y from +z toward +x, el = elevation
export const orbitCam = (t: V3, r: number, az: number, el: number, fov = 34, roll = 0): Cam => ({
  pos: [t[0] + r * Math.sin(az) * Math.cos(el), t[1] + r * Math.sin(el), t[2] + r * Math.cos(az) * Math.cos(el)],
  target: [t[0], t[1], t[2]],
  fov,
  roll,
});

export const mixCam = (a: Cam, b: Cam, w: number): Cam => {
  const ta = a.target ?? [0, 0, 0], tb = b.target ?? [0, 0, 0];
  return {
    pos: [lerp(a.pos[0], b.pos[0], w), lerp(a.pos[1], b.pos[1], w), lerp(a.pos[2], b.pos[2], w)],
    target: [lerp(ta[0], tb[0], w), lerp(ta[1], tb[1], w), lerp(ta[2], tb[2], w)],
    fov: lerp(a.fov ?? 35, b.fov ?? 35, w),
    roll: lerp(a.roll ?? 0, b.roll ?? 0, w),
  };
};

// uniform Catmull-Rom through vals[0..n-1] at parameter p (clamped ends)
export const crSample = (vals: number[], p: number) => {
  const n = vals.length;
  const q = Math.max(0, Math.min(n - 1, p));
  const k = Math.min(n - 2, Math.floor(q));
  const f = q - k;
  const P = (i: number) => vals[Math.max(0, Math.min(n - 1, i))];
  const p0 = P(k - 1), p1 = P(k), p2 = P(k + 1), p3 = P(k + 2);
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
};

// Keyframed camera in TIME: C1 cubic Hermite (non-uniform Catmull-Rom
// tangents); hold:true keys have zero velocity. Optional explicit velocity.
export type Key = {b: number; pos: V3; target: V3; fov?: number; roll?: number; hold?: boolean; vel?: number[]};
const herm = (p0: number, p1: number, m0: number, m1: number, h: number, s: number) => {
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * h * m1;
};
export const keyCam = (K: Key[], B: number): Cam => {
  const n = K.length;
  const get = (k: Key, c: number) => (c < 3 ? k.pos[c] : c < 6 ? k.target[c - 3] : c === 6 ? k.fov ?? 34 : k.roll ?? 0);
  const tan = (i: number, c: number) => {
    if (K[i].vel && K[i].vel![c] !== undefined) return K[i].vel![c];
    if (K[i].hold || i === 0 || i === n - 1) return 0;
    return (get(K[i + 1], c) - get(K[i - 1], c)) / (K[i + 1].b - K[i - 1].b);
  };
  const out = (v: number[]): Cam => ({pos: [v[0], v[1], v[2]], target: [v[3], v[4], v[5]], fov: v[6], roll: v[7]});
  if (B <= K[0].b) return out(Array.from({length: 8}, (_, c) => get(K[0], c)));
  if (B >= K[n - 1].b) return out(Array.from({length: 8}, (_, c) => get(K[n - 1], c)));
  let i = 0;
  while (i < n - 2 && B > K[i + 1].b) i++;
  const h = K[i + 1].b - K[i].b;
  const s = (B - K[i].b) / h;
  return out(Array.from({length: 8}, (_, c) => herm(get(K[i], c), get(K[i + 1], c), tan(i, c), tan(i + 1, c), h, s)));
};

// Pen-plotter reveal for printed type: a soft-edged mask sweeps left to right.
export const Wipe: React.FC<{t: number; soft?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({t, soft = 18, children, style}) => {
  if (t >= 0.999) return <div style={style}>{children}</div>;
  if (t <= 0.001) return <div style={{...style, visibility: 'hidden'}}>{children}</div>;
  const a = t * (100 + soft) - soft;
  const m = `linear-gradient(90deg, #000 ${a}%, transparent ${a + soft}%)`;
  return <div style={{...style, WebkitMaskImage: m, maskImage: m}}>{children}</div>;
};

// Deterministic damped shake (for stamps): returns a small offset.
export const shake = (B: number, at: number, amp: number, decay = 9, freq = 23) => {
  const t = B - at;
  if (t < 0 || t > 1.2) return 0;
  return amp * Math.exp(-decay * t) * Math.sin(freq * t);
};

// Scales the opacity of every material below it (the shared figures expose no
// opacity of their own). Ink resets its line opacity on every render; other
// materials keep their authored opacity in userData.
export const FadeGroup: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => {
  const ref = React.useRef<any>(null);
  React.useLayoutEffect(() => {
    ref.current?.traverse((o: any) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        if (m.isLineMaterial) {
          if (f < 0.999) m.opacity = m.opacity * f;
        } else {
          if (m.userData.base === undefined) m.userData.base = m.opacity;
          if (f < 0.999) m.transparent = true;
          m.opacity = m.userData.base * f;
        }
      }
    });
  });
  return <group ref={ref}>{children}</group>;
};
