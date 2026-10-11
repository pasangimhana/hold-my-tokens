// VI (lead), the finale: story beats 56 → end of film.
// One camera, always square-on to the chart plane, one lens (the flat view's):
//   1. a straight sideways scroll (+x) along the time axis, zoomed in, already
//      moving on the cut. Its speed is a smooth monotone curve that puts each of
//      six milestones (2021, ChatGPT Nov 2022, 2024, 2025, May 2026, Oct 2026) at
//      centre frame on its kick: quicker through the sparse early years, easing
//      as each card lands, slowing through the dense 2025–2026 end. Each dot pops at its
//      true date with a stem and its card types in above it; cards fade once
//      passed. The pen draws the illustrative exponential behind the camera and
//      catches up in view, climbing the steep end into today on the HIT
//      (B 69.333): "You are here.";
//   2. a dolly-out (same lens, no rotation: a pure zoom-out with a slide to
//      centre the chart) while the dashed trend shoots straight up off the top
//      of frame; HIT (B 72): the closing line; then the flat view holds to the
//      end of the film with the source line.
// Times are authored in VI-local film beats F (kicks are integers, F_OPEN = 97
// at the cut); the station receives story beats B (s = 1.5: F = 97 + 1.5 (B − 56)).
import React from 'react';
import * as THREE from 'three';
import {Ink, Occluder} from '../ink3d';
import {TODAY} from '../data/metr';
import {clamp01, seg, lerp, cubicInOut, expoOut, noise1} from '../core/anim';
import {PAPER, INK} from '../style';
import type {Cam} from '../core/Stage';
import type {V3} from '../world/station';

export const GREY = '#8D887D';
export const ease = (b: number, at: number, dur: number, f = expoOut) => f(seg(b, at, dur));
const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const herm = (p0: number, p1: number, m0: number, m1: number, h: number, s: number) => {
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * h * m1;
};

// ------------------------------------------------------------------ time
export const VI_FROM = 56;
export const F_END = 125; // VI holds its flat chart to here (B 74.667), then the end card cuts in (Credits.tsx)
export const fOf = (B: number) => 97 + (B - 56) * 1.5;
export const bOf = (F: number) => 56 + (F - 97) / 1.5;
export const VI_TO = bOf(F_END); // B 74.667
export const F_OPEN = 97; // the cut: straight onto the scroll, the 2021 card slamming
export const F_QUOTE = 110; // the Gowers quote by the May 2026 card
export const F_YAH = 117; // the pen reaches today: HIT "You are here." (a vocal accent)
export const YAH = bOf(F_YAH); // B 69.333
export const F_LAUNCH = 117.3; // the dashed trend takes off
export const F_EXIT = 121; // its tip leaves the top of frame: HIT, the closing line
export const EXIT = bOf(F_EXIT); // B 72
export const F_FLAT = 121.2; // the dolly-out lands on the flat view, which holds to the end

// ------------------------------------------------------------------ the six milestones (facts.ts MILESTONES as in v5, plus ChatGPT's release)
export const LADDER = [
  {date: '2021', big: '6.9%', small: 'best AI score on competition math (MATH)', t: 2021.2, kick: 97, out: 99.25}, // slams on the cut
  {date: 'Nov 2022', big: 'ChatGPT', small: 'released by OpenAI', t: 2022.91, kick: 100, out: 102.25}, // public release, 30 Nov 2022
  {date: '2024', big: 'Olympiad silver', small: 'AlphaProof at the IMO: 28/42, silver-medal standard', t: 2024.55, kick: 103, out: 105.25},
  {date: '2025', big: 'Olympiad gold', small: 'IMO 2025: 35/42, a gold-medal score', t: 2025.55, kick: 106, out: 108.25},
  {date: 'May 2026', big: 'An 80-year-old', big1: 'Erdős conjecture,', big2: 'disproved', small: 'by an OpenAI model (the unit-distance problem)', t: 2026.38, kick: 109, out: 112.25},
  {date: 'Oct 2026', big: '719 papers', small: 'openai/math', t: TODAY, kick: 113, out: 116.2},
];

// ------------------------------------------------------------------ the chart (illustrative exponential, no data)
export const KX = 6; // world x per year
export const XT = 400; // today's x
export const X = (t: number) => XT + (t - TODAY) * KX;
export const POST_Z = -0.3; // the chart plane (the axis rail sits just in front of it)
export const H_TODAY = 8.7; // curve height at today
export const DBL = 0.6; // years per doubling (illustration)
export const T_C0 = 2019.8; // the curve starts here
const B0 = Math.pow(2, (T_C0 - TODAY) / DBL);
export const curveH = (t: number) => (H_TODAY * (Math.pow(2, (t - TODAY) / DBL) - B0)) / (1 - B0);
export const MS = LADDER.map((m, i) => ({...m, i, x: X(m.t), h: Math.max(0, curveH(m.t))}));
export const Y_AXIS_TOP = 11.4;
export const AXIS_X0 = X(2019.3); // the time axis starts here

// ------------------------------------------------------------------ camera: one lens, always square-on
const FOV = 30;
const FOCAL = 540 / Math.tan(((FOV / 2) * Math.PI) / 180); // px
export const SCROLL_PX = 64; // screen px per world unit while scrolling
export const FLAT_PX = 36; // ... and in the final flat view
const D_SCROLL = FOCAL / SCROLL_PX;
const D_FLAT = FOCAL / FLAT_PX;
const SCROLL_AXIS_Y = 860; // the axis sits at this screen y while scrolling
const CY_SCROLL = (SCROLL_AXIS_Y - 540) / SCROLL_PX;
export const FLAT_X0 = 140; // 2020 (the y-axis) sits at this screen x in the flat view
const FLAT_AXIS_Y = 825;
const FLAT_C: V3 = [X(2020) + (960 - FLAT_X0) / FLAT_PX, (FLAT_AXIS_Y - 540) / FLAT_PX, POST_Z];

// the date at the centre of frame: a monotone C1 curve through the milestones on
// their kicks (already moving on the cut). Each landing is taken at 60% of the
// slower neighbouring stretch, so the scroll eases as a card lands and picks up
// between them; no stops, no reversals, until it settles on the HIT.
const SCROLL_KEYS: [number, number][] = [...LADDER.map((m) => [m.kick, m.t] as [number, number]), [F_YAH, 2026.92]];
const LAND = 0.6;
const SCROLL = (() => {
  const xs = SCROLL_KEYS.map((k) => k[0]), ys = SCROLL_KEYS.map((k) => k[1]);
  const n = xs.length;
  const d = Array.from({length: n - 1}, (_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n).fill(0);
  m[0] = LAND * d[0];
  m[n - 1] = 0; // settles to a stop on the HIT; the dolly-out starts from rest
  for (let i = 1; i < n - 1; i++) m[i] = LAND * Math.min(d[i - 1], d[i]); // ≤ 0.6 of each side's slope: monotone, no overshoot
  const at = (F: number) => {
    if (F <= xs[0]) return ys[0] + m[0] * (F - xs[0]);
    if (F >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (F - xs[n - 1]);
    let i = 0;
    while (i < n - 2 && F > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    return herm(ys[i], ys[i + 1], m[i], m[i + 1], h, (F - xs[i]) / h);
  };
  return {at, endRate: m[n - 1]};
})();
export const centreT = (F: number) => SCROLL.at(Math.min(F, F_YAH));
const scrollPos = (F: number): V3 => [X(centreT(F)), CY_SCROLL, POST_Z + D_SCROLL];
// the dolly-out: one eased move from the HIT to the flat view (C1 with the scroll's
// last creep), then a barely perceptible push to the end
const P_YAH = scrollPos(F_YAH);
const V_YAH: V3 = [SCROLL.endRate * KX, 0, 0]; // 0: at rest on the HIT
const P_FLAT: V3 = [FLAT_C[0], FLAT_C[1], POST_Z + D_FLAT];
const BREATHE = -0.05; // units per F, toward the page
const camPos = (F: number): V3 => {
  if (F <= F_YAH) return scrollPos(F);
  if (F >= F_FLAT) return [P_FLAT[0], P_FLAT[1], P_FLAT[2] + BREATHE * (F - F_FLAT)];
  const h = F_FLAT - F_YAH, s = (F - F_YAH) / h;
  const v1: V3 = [0, 0, BREATHE];
  return [0, 1, 2].map((c) => herm(P_YAH[c], P_FLAT[c], V_YAH[c], v1[c], h, s)) as V3;
};
export const baseCam = (F: number): Cam => {
  const p = camPos(F);
  return {pos: p, target: [p[0], p[1], POST_Z], fov: FOV};
};

// shake: a light jolt as each card's stat lands, a punch on "You are here.",
// a rumble while the line takes off, a jolt as it leaves the frame
export const SHAKE = (F: number) => {
  let a = 0;
  for (const m of LADDER) if (F >= m.kick) a += 0.12 * Math.exp(-6 * (F - m.kick));
  if (F >= F_YAH) a += 0.5 * Math.exp(-3.3 * (F - F_YAH));
  a += 0.3 * Math.pow(Math.sin((Math.PI / 2) * clamp01((F - F_LAUNCH) / (F_EXIT - F_LAUNCH))), 1.5) * (F < F_EXIT ? 1 : Math.exp(-1.6 * (F - F_EXIT)));
  if (F >= F_EXIT) a += 0.42 * Math.exp(-4.2 * (F - F_EXIT));
  return a;
};
export const tfCamF = (F: number): Cam => {
  const c = baseCam(F);
  const a = SHAKE(F);
  if (a < 1e-3) return c;
  const t = c.target ?? [0, 0, 0];
  const d = Math.hypot(c.pos[0] - t[0], c.pos[1] - t[1], c.pos[2] - t[2]);
  const k = a * d * 0.011 * (FOV / 38); // the same on-screen jolt near or far
  const f = F * 7.5;
  const o = [noise1(f, 11), noise1(f, 12), noise1(f, 13)].map((v) => v * k);
  return {
    ...c,
    pos: [c.pos[0] + o[0], c.pos[1] + o[1], c.pos[2] + o[2]],
    target: [t[0] + o[0] * 0.6, t[1] + o[1] * 0.6, t[2] + o[2] * 0.6],
    roll: noise1(f, 14) * a * 0.02,
  };
};
export const tfCam = (B: number) => tfCamF(fOf(B));
export const tfFog = (): [number, number] => [200, 500]; // square-on: no depth to fade

// ------------------------------------------------------------------ the pen
// trails the camera by 1.5 years along the flat early curve, then catches up in
// view and climbs the steep end, arriving at today exactly on the HIT
const LAG = 1.5;
const F_CATCH = 109;
const PEN_V1 = 0.16; // years per F as it lands on today
const penRaw = (F: number) => {
  if (F <= F_CATCH) return centreT(F) - LAG;
  const p0 = centreT(F_CATCH) - LAG, v0 = (centreT(F_CATCH + 0.01) - centreT(F_CATCH - 0.01)) / 0.02;
  if (F >= F_YAH) return TODAY + PEN_V1 * (F - F_YAH);
  return herm(p0, TODAY, v0, PEN_V1, F_YAH - F_CATCH, (F - F_CATCH) / (F_YAH - F_CATCH));
};
export const penT = (F: number) => Math.min(TODAY, Math.max(T_C0, penRaw(F)));
// first F at which the pen reaches date t (for the dot pops and the cues)
export const penAt = (t: number) => {
  let lo = F_OPEN, hi = F_YAH;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (penRaw(mid) < t) lo = mid;
    else hi = mid;
  }
  return hi;
};

// ------------------------------------------------------------------ the trend extended: bends STRAIGHT UP right after today
const EXT_BEND = 0.3; // years: x saturates at KX * EXT_BEND past today
export const extX = (t: number) => XT + KX * EXT_BEND * (1 - Math.exp(-(t - TODAY) / EXT_BEND));
export const extY = (t: number) => curveH(t);
const T_EXIT = 0.86; // years past today when the tip crosses the top edge (tuned to the camera at F_EXIT)
const TIP_P = 2.6;
export const tipT = (F: number) => {
  if (F <= F_LAUNCH) return TODAY;
  const d = F_EXIT - F_LAUNCH;
  if (F <= F_EXIT) return TODAY + T_EXIT * Math.pow((F - F_LAUNCH) / d, TIP_P);
  return TODAY + T_EXIT + ((T_EXIT * TIP_P) / d) * (F - F_EXIT); // keeps going, off-frame
};
const EXT_DT = 2.6;

// ------------------------------------------------------------------ geometry (built once)
const RAIL = (() => {
  const x0 = AXIS_X0, x1 = X(2031), w = 0.18, h = 0.06;
  const geo = new THREE.BoxGeometry(x1 - x0, h, 2 * w);
  geo.translate((x0 + x1) / 2, h / 2, 0);
  return {geo, outline: new Float32Array([x0, h, -w, x1, h, -w, x0, h, w, x1, h, w, x0, 0, w, x1, 0, w, x0, 0, w, x0, h, w])};
})();
// year ticks in the chart plane, just under the axis, and fine month ticks (a ruler
// that streaks past when the scroll is fast)
const YEAR_TICKS = (() => {
  const a: number[] = [];
  for (let y = 2020; y <= 2030; y++) a.push(X(y), 0, 0.2, X(y), -0.26, 0.2);
  return new Float32Array(a);
})();
const MONTH_TICKS = (() => {
  const a: number[] = [];
  for (let y = 2019; y < 2031; y++) for (let k = 1; k < 12; k++) if (X(y + k / 12) >= AXIS_X0) a.push(X(y + k / 12), 0, 0.2, X(y + k / 12), k === 6 ? -0.17 : -0.1, 0.2);
  return new Float32Array(a);
})();
const Y_AXIS = (() => {
  const x = X(2020), top = Y_AXIS_TOP;
  return new Float32Array([x, 0, POST_Z, x, top, POST_Z, x, top, POST_Z, x - 0.16, top - 0.42, POST_Z, x, top, POST_Z, x + 0.16, top - 0.42, POST_Z]);
})();
const CURVE_N = 900;
const CURVE = (() => {
  const a: number[] = [];
  for (let k = 0; k < CURVE_N; k++) {
    const t0 = T_C0 + ((TODAY - T_C0) * k) / CURVE_N, t1 = T_C0 + ((TODAY - T_C0) * (k + 1)) / CURVE_N;
    a.push(X(t0), curveH(t0) + 0.02, POST_Z, X(t1), curveH(t1) + 0.02, POST_Z);
  }
  return new Float32Array(a);
})();
const EXT_N = 900;
const EXT = (() => {
  const a: number[] = [];
  for (let k = 0; k < EXT_N; k++) {
    const t0 = TODAY + (EXT_DT * k) / EXT_N, t1 = TODAY + (EXT_DT * (k + 1)) / EXT_N;
    a.push(extX(t0), extY(t0), POST_Z + 0.01, extX(t1), extY(t1), POST_Z + 0.01);
  }
  return new Float32Array(a);
})();
const extCount = (F: number) => ((tipT(F) - TODAY) / EXT_DT) * EXT_N;
const UNIT_POST = new Float32Array([0, 0, 0, 0, 1, 0]);
const UNIT_RING = (() => {
  const a: number[] = [];
  const n = 40;
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
    a.push(Math.cos(a0), Math.sin(a0), 0, Math.cos(a1), Math.sin(a1), 0);
  }
  return new Float32Array(a);
})();
const DISC = new THREE.CircleGeometry(1, 32);

// ------------------------------------------------------------------ the world
const Knob: React.FC<{at: V3; r: number; fill: string}> = ({at, r, fill}) => (
  <group position={at}>
    <mesh geometry={DISC} scale={r} renderOrder={5}>
      <meshBasicMaterial color={fill} depthTest={false} />
    </mesh>
    <Ink positions={UNIT_RING} width={2} scale={r} depthTest={false} renderOrder={6} />
  </group>
);

// a milestone lands: its stem draws up from the axis, then its dot pops
export const stemK = (i: number, F: number) => ease(F, MS[i].kick - 0.35, 0.3, cubicInOut);
export const popK = (i: number, F: number) => ease(F, MS[i].kick - 0.06, 0.3);

export const ChartWorld: React.FC<{B: number}> = ({B}) => {
  const F = fOf(B);
  const pen = penT(F);
  const nodes: React.ReactNode[] = [];
  MS.forEach((m, i) => {
    const up = stemK(i, F);
    if (up <= 0) return;
    if (m.h > 0.05) nodes.push(<Ink key={'s' + i} positions={UNIT_POST} width={1.6} position={[m.x, 0, POST_Z]} scale={[1, m.h * up, 1]} />);
    const last = i === MS.length - 1;
    if (last && F >= F_YAH - 0.02) return; // today becomes the big black dot
    const pop = popK(i, F);
    if (pop <= 0) return;
    const r = 0.13 * (0.5 + 0.5 * pop) * (1 + 0.6 * (1 - pop));
    nodes.push(<Knob key={'k' + i} at={[m.x, m.h, POST_Z]} r={r} fill={PAPER} />);
    // a small ring as it lands, and another as the pen passes through it
    const r1 = seg(F, m.kick, 0.8);
    if (r1 > 0 && r1 < 1) nodes.push(<Ink key={'a' + i} positions={UNIT_RING} width={1.8} opacity={(1 - r1) * 0.8} position={[m.x, m.h, POST_Z + 0.02]} scale={0.18 + r1 * 0.55} depthTest={false} renderOrder={6} />);
    if (!last) {
      const r2 = seg(F, penAt(m.t), 0.8);
      if (r2 > 0 && r2 < 1) nodes.push(<Ink key={'b' + i} positions={UNIT_RING} width={1.6} opacity={(1 - r2) * 0.7} position={[m.x, m.h, POST_Z + 0.02]} scale={0.18 + r2 * 0.5} depthTest={false} renderOrder={6} />);
    }
  });
  // today: the black dot slams in on the HIT, with ripples (kept small: clear of "You are here.")
  const yahPop = ease(F, F_YAH - 0.03, 0.22);
  const ripples: React.ReactNode[] = [];
  [F_YAH, F_YAH + 1].forEach((k) => {
    const r = seg(F, k, 1.4);
    if (r > 0 && r < 1) ripples.push(<Ink key={'y' + k} positions={UNIT_RING} width={2.2} opacity={(1 - r) * 0.9} position={[XT, H_TODAY, POST_Z + 0.03]} scale={0.35 + r * 0.95} depthTest={false} renderOrder={7} />);
  });
  const nCurve = ((pen - T_C0) / (TODAY - T_C0)) * CURVE_N;
  const yAxis = ease(F, F_YAH + 1.3, 1.0, cubicInOut); // the y-axis draws once we pull back to see it
  return (
    <group>
      {/* the time axis */}
      <Occluder geometry={RAIL.geo} color={PAPER} />
      <Ink positions={RAIL.outline} width={1.5} />
      <Ink positions={YEAR_TICKS} width={1.3} />
      <Ink positions={MONTH_TICKS} width={1} color="#77736B" />
      {nodes}
      {/* the curve, drawn by the pen */}
      <Ink positions={CURVE} width={3.6} count={nCurve} />
      {yahPop > 0 ? (
        <group position={[XT, H_TODAY, POST_Z + 0.04]}>
          <mesh geometry={DISC} renderOrder={8} scale={0.32 * (0.4 + 0.6 * yahPop) * (1 + 0.6 * (1 - yahPop))}>
            <meshBasicMaterial color={INK} depthTest={false} />
          </mesh>
        </group>
      ) : null}
      {ripples}
      {/* the trend, extended: shoots straight up past the top of the frame */}
      {F > F_LAUNCH ? <Ink positions={EXT} width={4} dashed={[0.8, 0.42]} count={extCount(F)} /> : null}
    </group>
  );
};
