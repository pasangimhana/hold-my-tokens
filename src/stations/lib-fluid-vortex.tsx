// V · FLUIDS hero (owner B): OpenAI's Navier–Stokes vortex figure, re-drawn in
// ink. Real streamlines of an axisymmetric, incompressible Burgers-like vortex
//   u_r = -a r s(r),  u_z = a z (2 s + r s'),  u_θ = (Γ/2πr)(1 - e^(-r²/δ²))
// (s ≡ 1 is exactly Burgers). Here s(r) = c(r) / (1 + (r/R_f)²) with
// c = s0 + (1 - s0)(1 - e^(-r²/σ²)): the weaker strain inside the core keeps
// the column from collapsing onto the axis, and far out the flow becomes a
// planar sink (no axial strain), so the inflow comes in at every height of a
// thick skirt and only lifts near the column: the spindle of the figure.
// Continuity holds exactly for any s(r). Deterministic RK4 from
// seeded starting points, three families like the figure:
//   inflow  far out near the mid-plane, spiralling in      (dim grey, thin)
//   coils   helices wrapping the column, tight at the middle (paper white)
//   inner   tight helices close to the axis, up and down    (brightest)
// plus the axis with its arrowhead. All geometry is built once at module scope;
// per frame only draw counts, group transforms and a few hundred comet
// segments (particles riding the flow) change.
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {rng, clamp01} from '../core/anim';
import {Ink} from '../ink3d';
import {PAPER} from '../style';

// ------------------------------------------------------------------ the flow
const A = 1, K = 17, DL = 1.15, S0 = 0.05, SG = 1.6, RF = 4.5;
export const VH = 4.4; // half height of the column (flow units = world units)
const vel = (x: number, y: number, z: number, o: number[]) => {
  const r2 = x * x + z * z, r = Math.sqrt(r2) + 1e-9;
  const e = Math.exp(-r2 / (SG * SG));
  const c = S0 + (1 - S0) * (1 - e), cp = (1 - S0) * ((2 * r) / (SG * SG)) * e;
  const q = 1 + r2 / (RF * RF), qp = (2 * r) / (RF * RF);
  const s = c / q, sp = (cp * q - c * qp) / (q * q);
  const ur = -A * r * s, ut = (K / r) * (1 - Math.exp(-r2 / (DL * DL)));
  // e_r = (x, z)/r, e_θ = (z, -x)/r: the sense of a positive rotation about +y
  o[0] = (ur * x + ut * z) / r;
  o[1] = A * y * (2 * s + r * sp);
  o[2] = (ur * z - ut * x) / r;
};

// an S on top of the body tilt (see Vortex): the column ends lean apart; as
// the body spins they gyrate, which is what makes the turning read
const BEND = 0.3;
const bend = (y: number) => -BEND * Math.tanh(y / 2.2);

type Line = {P: Float32Array; T: Float32Array; U: Float32Array; n: number; tmax: number};
const trace = (r0: number, th0: number, y0: number, stop: (r: number, y: number) => boolean, curv = 0.075, maxT = 9): Line => {
  let x = r0 * Math.cos(th0), y = y0, z = -r0 * Math.sin(th0);
  const P: number[] = [x, y, z], T: number[] = [0], S: number[] = [0];
  const k1 = [0, 0, 0], k2 = [0, 0, 0], k3 = [0, 0, 0], k4 = [0, 0, 0];
  let t = 0, s = 0, acc = 0;
  for (let i = 0; i < 60000 && t < maxT; i++) {
    vel(x, y, z, k1);
    const sp = Math.hypot(k1[0], k1[1], k1[2]);
    const h = Math.min(0.01, 0.015 / sp);
    vel(x + (h / 2) * k1[0], y + (h / 2) * k1[1], z + (h / 2) * k1[2], k2);
    vel(x + (h / 2) * k2[0], y + (h / 2) * k2[1], z + (h / 2) * k2[2], k3);
    vel(x + h * k3[0], y + h * k3[1], z + h * k3[2], k4);
    const nx = x + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    const ny = y + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    const nz = z + (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    const dl = Math.hypot(nx - x, ny - y, nz - z);
    x = nx; y = ny; z = nz; t += h; s += dl; acc += dl;
    const r = Math.hypot(x, z);
    const done = stop(r, y);
    // sample density follows the curvature (~ the radius of the spiral)
    if (acc >= Math.min(0.3, Math.max(0.022, curv * r)) || done) {
      P.push(x, y, z); T.push(t); S.push(s);
      acc = 0;
    }
    if (done) break;
  }
  const n = T.length;
  const PB = new Float32Array(n * 3), U = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const yy = P[3 * i + 1];
    PB[3 * i] = P[3 * i] + bend(yy);
    PB[3 * i + 1] = yy;
    PB[3 * i + 2] = P[3 * i + 2];
    U[i] = S[i] / Math.max(1e-6, s);
  }
  return {P: PB, T: new Float32Array(T), U, n, tmax: t};
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lin = (g: number) => Math.pow(g, 2.2); // sRGB grey -> linear vertex colour

// A family: static coloured segments, sorted by their reveal key so a single
// draw count pens every line in from its seed at once (no per-frame upload).
type Fam = {lines: Line[]; segs: Float32Array; cols: Float32Array; keys: Float32Array; prof: (u: number) => number; gain: Float32Array};
const family = (lines: Line[], prof: (u: number) => number, grey: number, r: () => number, spread = 0.75): Fam => {
  let total = 0;
  for (const L of lines) total += L.n - 1;
  const key = new Float32Array(total), idx = new Uint32Array(total);
  const raw = new Float32Array(total * 6), rawc = new Float32Array(total * 6);
  const gain = new Float32Array(lines.length);
  let k = 0;
  lines.forEach((L, li) => {
    const delay = r() * (1 - spread);
    const g = grey * (0.62 + 0.38 * r());
    gain[li] = g;
    for (let j = 0; j < L.n - 1; j++) {
      key[k] = delay + spread * L.U[j];
      for (let c = 0; c < 3; c++) {
        raw[6 * k + c] = L.P[3 * j + c];
        raw[6 * k + 3 + c] = L.P[3 * (j + 1) + c];
      }
      const c0 = lin(g * prof(L.U[j])), c1 = lin(g * prof(L.U[j + 1]));
      for (let c = 0; c < 3; c++) {
        rawc[6 * k + c] = c0;
        rawc[6 * k + 3 + c] = c1;
      }
      idx[k] = k;
      k++;
    }
  });
  idx.sort((a, b) => key[a] - key[b]);
  const segs = new Float32Array(total * 6), cols = new Float32Array(total * 6), keys = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const s = idx[i];
    segs.set(raw.subarray(6 * s, 6 * s + 6), 6 * i);
    cols.set(rawc.subarray(6 * s, 6 * s + 6), 6 * i);
    keys[i] = key[s];
  }
  return {lines, segs, cols, keys, prof, gain};
};
const drawn = (f: Fam, R: number) => {
  // number of segments with key <= R (keys sorted)
  let lo = 0, hi = f.keys.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (f.keys[m] <= R) lo = m + 1;
    else hi = m;
  }
  return lo;
};

const signed = (r: () => number, i: number) => (i % 2 === 0 ? 1 : -1) * (r() < 0.12 ? -1 : 1);

// outer inflow threads: far out, hugging the mid-plane, spiralling in
const INFLOW = (() => {
  const r = rng(5101);
  const lines: Line[] = [];
  // bundled into arms like the figure's: the arms visibly sweep round as it spins
  const N = 104, ARMS = 7;
  for (let i = 0; i < N; i++) {
    const arm = i % ARMS;
    const th = ((arm + 0.25 * r()) / ARMS) * Math.PI * 2 + 0.55 * (r() - 0.5) * (r() < 0.75 ? 0.5 : 2.2);
    const r0 = 5.6 + 2.0 * r();
    const y0 = signed(r, i) * 0.85 * Math.pow(r(), 1.5);
    lines.push(trace(r0, th, y0, (rr, y) => rr < 1.4 || Math.abs(y) > VH, 0.07));
  }
  // tapered both ends: thin tips far out, dissolving into the column
  return family(lines, (u) => smoothstep(0, 0.36, u) * (1 - smoothstep(0.6, 1, u)), 0.46, r, 0.7);
})();

// coil helices wrapping the column: tightest at the mid-plane, opening up and down
const COILS = (() => {
  const r = rng(7303);
  const lines: Line[] = [];
  // loose ribbons of 2-4 neighbouring threads, like the figure's tubes
  const N = 44;
  let th = 0, r0 = 2, y0 = 0.2, left = 0, sg = 1;
  for (let i = 0; i < N; i++) {
    if (left <= 0) {
      left = 2 + Math.floor(r() * 3);
      th = r() * Math.PI * 2;
      r0 = 1.95 + 0.7 * r();
      sg = -sg;
      y0 = sg * (0.12 + 0.36 * Math.pow(r(), 1.2));
    }
    left--;
    th += 0.07 + 0.05 * r();
    r0 += 0.03 * (r() - 0.5);
    y0 *= 1 + 0.12 * (r() - 0.3);
    const top = VH + 0.2 * r();
    lines.push(trace(r0, th, y0, (rr, y) => Math.abs(y) > top, 0.07));
  }
  return family(lines, (u) => smoothstep(0, 0.12, u) * (1 - smoothstep(0.84, 1, u)), 0.5, r, 0.8);
})();

// tight inner helices close to the axis: the outflow up and down
const INNER = (() => {
  const r = rng(9907);
  const lines: Line[] = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const th = ((i + r()) / N) * Math.PI * 2;
    const r0 = 0.88 + 0.22 * r();
    const y0 = signed(r, i) * (0.4 + 0.25 * r());
    const top = VH + 0.5 + 0.3 * r();
    lines.push(trace(r0, th, y0, (rr, y) => Math.abs(y) > top, 0.09));
  }
  return family(lines, (u) => smoothstep(0, 0.12, u) * (1 - smoothstep(0.86, 1, u)), 0.66, r, 0.85);
})();

export const VORTEX_STATS = {
  inflow: INFLOW.keys.length, coils: COILS.keys.length, inner: INNER.keys.length,
};

// ------------------------------------------------------------------ comets
// Particles riding the streamlines in flow time τ (real particle motion: slow
// far out, fast in the core). Each comet = M short segments, bright head,
// fading tail. Positions/colours are rewritten in place every frame.
const M = 14;
type Comet = {li: number; phase: number; cyc: number; amp: number};
const comets = (f: Fam, per: number, seed: number, amp: number): Comet[] => {
  const r = rng(seed);
  const out: Comet[] = [];
  f.lines.forEach((L, li) => {
    const n = per >= 1 ? per : r() < per ? 1 : 0;
    for (let c = 0; c < n; c++) {
      const cyc = L.tmax * (1.25 + 0.9 * r());
      out.push({li, phase: cyc * ((c + r() * 0.8) / Math.max(1, n)), cyc, amp: amp * (0.7 + 0.3 * r())});
    }
  });
  return out;
};
const C_IN = comets(INFLOW, 1, 31, 1.0);
const C_CO = comets(COILS, 3, 37, 1.0);
const C_IR = comets(INNER, 3, 41, 1.0);

// point on line L at flow time t (clamped); writes into o at offset k
const atT = (L: Line, t: number, o: Float32Array, k: number) => {
  const T = L.T;
  const tt = Math.max(0, Math.min(L.tmax, t));
  let lo = 0, hi = L.n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T[m] <= tt) lo = m;
    else hi = m;
  }
  const w = T[hi] > T[lo] ? (tt - T[lo]) / (T[hi] - T[lo]) : 0;
  for (let c = 0; c < 3; c++) o[k + c] = L.P[3 * lo + c] + (L.P[3 * hi + c] - L.P[3 * lo + c]) * w;
  return L.U[lo] + (L.U[hi] - L.U[lo]) * w;
};

// ------------------------------------------------------------------ line objects
type Obj = {o: LineSegments2; m: LineMaterial; pos?: Float32Array; col?: Float32Array; ib?: any; cb?: any};
const makeLines = (segs: Float32Array, cols: Float32Array, width: number): Obj => {
  const g = new LineSegmentsGeometry();
  g.setPositions(segs);
  g.setColors(cols);
  const m = new LineMaterial({
    color: new THREE.Color(PAPER), linewidth: width, vertexColors: true, transparent: true, depthWrite: false, fog: true,
    blending: THREE.AdditiveBlending,
  } as any);
  m.resolution.set(1920, 1080);
  // butt ends: with additive blending, round caps of consecutive segments
  // overlap at every joint and the thread looks beaded
  m.onBeforeCompile = (sh: any) => {
    sh.fragmentShader = sh.fragmentShader.replace('if ( len2 > 1.0 ) discard;', 'discard;');
  };
  const o = new LineSegments2(g, m);
  o.frustumCulled = false;
  return {o, m, ib: (g.attributes as any).instanceStart.data, cb: (g.attributes as any).instanceColorStart.data};
};
const useObj = (make: () => Obj) => {
  const obj = useMemo(make, []);
  useEffect(() => () => {
    obj.o.geometry.dispose();
    obj.m.dispose();
  }, [obj]);
  return obj;
};

const FamLines: React.FC<{f: Fam; width: number; R: number; gain: number}> = ({f, width, R, gain}) => {
  const obj = useObj(() => makeLines(f.segs, f.cols, width));
  const n = drawn(f, R);
  (obj.o.geometry as any).instanceCount = n;
  obj.m.color.set(PAPER).multiplyScalar(gain);
  obj.o.visible = n > 0 && gain > 0.002;
  return <primitive object={obj.o} />;
};

const CometLines: React.FC<{f: Fam; C: Comet[]; width: number; flowT: number; tail: number; R: number; gain: number}> = ({f, C, width, flowT, tail, R, gain}) => {
  const obj = useObj(() => {
    const segs = new Float32Array(C.length * M * 6), cols = new Float32Array(C.length * M * 6);
    return makeLines(segs, cols, width);
  });
  const pos: Float32Array = obj.ib.array, col: Float32Array = obj.cb.array;
  const pt = new Float32Array(3 * (M + 1)), uu = new Float32Array(M + 1);
  C.forEach((c, ci) => {
    const L = f.lines[c.li];
    const head = (((c.phase + flowT) % c.cyc) + c.cyc) % c.cyc; // flow time of the head
    const vis = head - tail < L.tmax;
    for (let j = 0; j <= M; j++) uu[j] = atT(L, head - (tail * j) / M, pt, 3 * j);
    for (let j = 0; j < M; j++) {
      const k = (ci * M + j) * 6;
      for (let q = 0; q < 3; q++) {
        pos[k + q] = pt[3 * j + q];
        pos[k + 3 + q] = pt[3 * (j + 1) + q];
      }
      const lit = (jj: number) => {
        const tj = head - (tail * jj) / M;
        if (!vis || tj < 0 || tj > L.tmax || uu[jj] > R) return 0;
        const fall = Math.pow(1 - jj / M, 1.6);
        return lin(Math.min(1, c.amp * fall * (0.25 + 0.75 * Math.sqrt(f.prof(uu[jj])))));
      };
      const a = lit(j), b = lit(j + 1);
      for (let q = 0; q < 3; q++) {
        col[k + q] = a;
        col[k + 3 + q] = b;
      }
    }
  });
  obj.ib.needsUpdate = true;
  obj.cb.needsUpdate = true;
  obj.m.color.set(PAPER).multiplyScalar(gain);
  return <primitive object={obj.o} />;
};

// ------------------------------------------------------------------ the rings (mid-plane flash on the HIT)
const UNIT_RING = (() => {
  const a: number[] = [];
  const n = 96;
  for (let k = 0; k < n; k++) {
    const t0 = (k / n) * Math.PI * 2, t1 = ((k + 1) / n) * Math.PI * 2;
    a.push(Math.cos(t0), 0, Math.sin(t0), Math.cos(t1), 0, Math.sin(t1));
  }
  return new Float32Array(a);
})();
const AXIS_TOP = VH + 1.0;
const AXIS = new Float32Array([0, -VH - 0.55, 0, 0, AXIS_TOP, 0]);

// ------------------------------------------------------------------ the vortex, animated
// Everything is a pure function of the story beat B.
export type VortexDrive = {
  reveal: number; // 0..1+ pen-in progress (draw-on)
  spin: number; // integrated spin (rad of the coil family)
  flow: number; // integrated flow time for the comets
  squeeze: number; // radial tightening of the column (0 = none)
  surge: number; // brightness surge (0..1)
  rings: Ring[]; // ring flashes on the mid-plane (keep the list length fixed)
};
// t: beats since the flash (<0 or >1.6: none), size: final radius (1 = past the skirt), amp: opacity, w: px
export type Ring = {t: number; size: number; amp: number; w: number};

// tilt: [axis x, axis y, axis z, angle]: the body leans off the (upright) arrow axis, as in the figure
export const Vortex: React.FC<{d: VortexDrive; position: [number, number, number]; tilt: [number, number, number, number]; scale?: number}> = ({d, position, tilt, scale = 1}) => {
  const q = useMemo(() => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(tilt[0], tilt[1], tilt[2]).normalize(), tilt[3]), [tilt[0], tilt[1], tilt[2], tilt[3]]);
  const R = d.reveal;
  const g = 1 + 0.45 * d.surge;
  const sq = 1 - d.squeeze, st = 1 + 0.35 * d.squeeze;
  return (
    <group position={position} scale={scale}>
      {/* the axis, with its arrowhead */}
      <Ink positions={AXIS} color="#D9D4CA" width={1.4} upto={clamp01((R + 0.15) * 1.6)} />
      {R > 0.5 ? (
        <mesh position={[0, AXIS_TOP, 0]} scale={clamp01((R - 0.5) * 4)}>
          <coneGeometry args={[0.13, 0.42, 20]} />
          <meshBasicMaterial color={PAPER} />
        </mesh>
      ) : null}
      <group quaternion={q}>
      <group rotation={[0, d.spin * 0.45, 0]}>
        <FamLines f={INFLOW} width={1.15} R={R * 1.15} gain={g} />
        <CometLines f={INFLOW} C={C_IN} width={2.3} flowT={d.flow * 0.85} tail={0.17} R={R * 1.15} gain={g} />
      </group>
      <group rotation={[0, d.spin, 0]} scale={[sq, st, sq]}>
        <FamLines f={COILS} width={1.45} R={R * 1.05} gain={g} />
        <CometLines f={COILS} C={C_CO} width={2.6} flowT={d.flow} tail={0.15} R={R * 1.05} gain={g} />
      </group>
      <group rotation={[0, d.spin * 1.9, 0]} scale={[sq * sq, st, sq * sq]}>
        <FamLines f={INNER} width={1.8} R={R} gain={g} />
        <CometLines f={INNER} C={C_IR} width={2.8} flowT={d.flow * 0.9} tail={0.22} R={R} gain={g} />
      </group>
      {/* hits: rings burst out along the (tilted) mid-plane */}
      {d.rings.map((g, i) => {
        if (g.t < 0 || g.t > 1.6) return null;
        const rr = 0.7 + 7.5 * g.size * (1 - Math.pow(1 - clamp01(g.t / 1.25), 3));
        return <Ink key={i} positions={UNIT_RING} color={PAPER} width={g.w} opacity={Math.exp(-2.1 * g.t) * g.amp} scale={[rr, 1, rr]} fog={false} renderOrder={4} />;
      })}
      </group>
    </group>
  );
};
