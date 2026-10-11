// Owner B: clearer variants of two of the shared result figures (copied from
// src/lib/objects.tsx and adapted; the shared file stays untouched).
//  - PrimesB: the integers 1..40, primes standing tall; the progression
//    5, 11, 17, 23, 29 in heavier ink with bold +6 hops (labels printed by
//    Results.tsx at AP_FOOT).
//  - GaussB: the Gaussian moat as a walk: stepping stones on a lattice floor,
//    a walker with a step circle, the reachable region flooding out hop by
//    hop, then the moat drawn round it on the verdict.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ink, Occluder} from '../ink3d';
import {LiveInk} from '../lib/objects';
import type {V3} from '../world/station';
import {clamp01, seg, expoOut, backOut} from '../core/anim';
import {PAPER, INK, INK2} from '../style';

const GREY = '#8D887D';
const LIGHT = '#B3AEA3';
const ease = (b: number, at: number, dur: number, f = expoOut) => f(seg(b, at, dur));
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

// ------------------------------------------------------------------ primes + a progression
const NMAX = 32;
export const PXB = (n: number) => (n - 16.5) * 0.32;
export const AP_B = [5, 11, 17, 23, 29];
const W = 0.11;
const box = (x0: number, x1: number, y1: number, z0: number, z1: number) => {
  const c: V3[] = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return E.flatMap(([i, j]) => [...c[i], ...c[j]]);
};
const PRIMES = (() => {
  const edges: number[] = [];
  const ap: number[] = [];
  const pos: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (let n = 1; n <= NMAX; n++) {
    const h = isPrime(n) ? 2.0 : 0.18;
    (AP_B.includes(n) ? ap : edges).push(...box(PXB(n) - W, PXB(n) + W, h, -W, W));
    const g = new THREE.BoxGeometry(2 * W, h, 2 * W);
    g.translate(PXB(n), h / 2, 0);
    const P = g.getAttribute('position');
    for (let i = 0; i < P.count; i++) pos.push(P.getX(i), P.getY(i), P.getZ(i));
    const I = g.getIndex()!;
    for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + off);
    off += P.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  // one arc per hop, ordered so a draw range hops 5 -> 11 -> 17 -> 23 -> 29
  const arcs: number[] = [];
  for (let k = 0; k < AP_B.length - 1; k++) {
    const a = PXB(AP_B[k]), b = PXB(AP_B[k + 1]);
    let prev: V3 | null = null;
    for (let s = 0; s <= 28; s++) {
      const u = s / 28;
      const p: V3 = [a + (b - a) * u, 2.08 + Math.sin(Math.PI * u) * 1.05, 0];
      if (prev) arcs.push(...prev, ...p);
      prev = p;
    }
  }
  const base = [PXB(0.4), 0, 0.22, PXB(NMAX + 0.6), 0, 0.22];
  return {edges: new Float32Array(edges), ap: new Float32Array(ap), geo, arcs: new Float32Array(arcs), base: new Float32Array(base)};
})();
// where the printed label of AP term n sits (figure-local, on the page)
export const AP_FOOT = (n: number): V3 => [PXB(n), 0, 1.3];
// the hop onto AP term i lands at figure-local beat AP_HOP(i) (i = 0: the start)
export const AP_HOP = (i: number) => 0.55 + 0.275 * i;
export const PrimesB: React.FC<{lb: number}> = ({lb}) => (
  <group>
    <Occluder geometry={PRIMES.geo} color={PAPER} />
    <Ink positions={PRIMES.base} width={1.3} upto={ease(lb, -0.4, 0.6)} />
    <Ink positions={PRIMES.edges} width={1.15} upto={ease(lb, -0.3, 0.9, (t) => t)} />
    <Ink positions={PRIMES.ap} width={2.2} upto={ease(lb, -0.1, 0.7, (t) => t)} />
    <Ink positions={PRIMES.arcs} width={3.6} upto={clamp01((lb - 0.55) / 1.1)} />
  </group>
);

// ------------------------------------------------------------------ the Gaussian moat
// Stepping stones: every Gaussian prime a+bi (a²+b² prime, or ±p, ±pi with
// p ≡ 3 mod 4) on a round lattice floor of radius 13. A walker starts at 1+i
// and may only hop to a prime at most √2 away (its step circle). The region it
// can reach (every prime reachable from ±1±i) floods out hop by hop, then
// stalls: the walker stands on the farthest tip and nothing new is inside its
// circle. On the verdict the moat draws in, sweeping round from the walker:
// the band around the reached region that holds no prime (every other prime
// is at least 2 away, more than one step).
const GW = 13; // floor radius, lattice units
export const GU = 0.29; // world units per lattice unit
const STEP = Math.SQRT2;
const MOAT_IN = 0.95, MOAT_OUT = 1.65; // the band, as distance from the reached primes
// layer d of the flood (and hop d of the walker) lands at card-local beat gT(d), on 16ths
export const G_HOP0 = -0.875, G_HOP = 0.125; // layer 6 is in at the cut (lb 0); hops 7..10 land on 0, 1/8, 1/4, 3/8
export const gT = (d: number) => G_HOP0 + d * G_HOP;
const HOP_DUR = 0.1;
export const G_STALL = 0.375; // the last hop lands; the circle searches
export const G_MOAT = 0.5; // the verdict: the moat draws in
const isGP = (a: number, b: number) => {
  if (a !== 0 && b !== 0) return isPrime(a * a + b * b);
  const p = Math.abs(a || b);
  return isPrime(p) && p % 4 === 3;
};
const disc = (x: number, z: number, r: number, y: number, n: number, pos: number[], idx: number[]) => {
  const o = pos.length / 3;
  pos.push(x, y, z);
  for (let k = 0; k < n; k++) pos.push(x + r * Math.cos((k / n) * 2 * Math.PI), y, z + r * Math.sin((k / n) * 2 * Math.PI));
  for (let k = 0; k < n; k++) idx.push(o, o + 1 + k, o + 1 + ((k + 1) % n));
};
const ringSegs = (r: number, n: number, y = 0) => {
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * 2 * Math.PI, a1 = ((k + 1) / n) * 2 * Math.PI;
    out.push(r * Math.cos(a0), y, r * Math.sin(a0), r * Math.cos(a1), y, r * Math.sin(a1));
  }
  return new Float32Array(out);
};
const GAUSS = (() => {
  const W = (a: number, b: number): V3 => [a * GU, 0, -b * GU];
  const pts: [number, number][] = [];
  const idx = new Map<string, number>();
  for (let a = -GW; a <= GW; a++)
    for (let b = -GW; b <= GW; b++)
      if (Math.hypot(a, b) <= GW - 0.3 && isGP(a, b)) {
        idx.set(`${a},${b}`, pts.length);
        pts.push([a, b]);
      }
  // flood: breadth-first from the four associates of 1+i, steps of at most √2
  const depth = new Int16Array(pts.length).fill(-1);
  const parent = new Int32Array(pts.length).fill(-1);
  const q: number[] = [];
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const i = idx.get(`${a},${b}`)!;
    depth[i] = 0;
    q.push(i);
  }
  for (let h = 0; h < q.length; h++) {
    const [a, b] = pts[q[h]];
    for (let da = -1; da <= 1; da++)
      for (let db = -1; db <= 1; db++) {
        const j = idx.get(`${a + da},${b + db}`);
        if ((da || db) && j !== undefined && depth[j] < 0) {
          depth[j] = depth[q[h]] + 1;
          parent[j] = q[h];
          q.push(j);
        }
      }
  }
  const comp = q; // in flood order (depth ascending)
  const maxD = depth[comp[comp.length - 1]];
  // the walker's route: 1-i ... out to the tip 11-4i (one of the eight farthest)
  let tip = idx.get('11,-4');
  if (tip === undefined || depth[tip] < 0) tip = comp[comp.length - 1];
  const path: number[] = [];
  for (let i = tip; i >= 0; i = parent[i]) path.unshift(i);
  const onPath = new Set(path.slice(1));
  // stones
  const greyP: number[] = [], greyI: number[] = [];
  pts.forEach(([a, b]) => {
    const [x, , z] = W(a, b);
    disc(x, z, 0.17 * GU, 0.003, 12, greyP, greyI);
  });
  const inkP: number[] = [], inkI: number[] = [], inkC: number[] = [], inkD: number[] = [];
  comp.forEach((i) => {
    const [x, , z] = W(...pts[i]);
    const o = inkP.length / 3;
    disc(x, z, 0.27 * GU, 0.005, 14, inkP, inkI);
    for (let k = o; k < inkP.length / 3; k++) {
      inkC.push(x, z);
      inkD.push(depth[i]);
    }
  });
  // links of the flood (each prime to the one it was reached from), and the walker's own
  const links: {d: number; a: V3; b: V3}[] = [];
  const route: {d: number; a: V3; b: V3}[] = [];
  comp.forEach((i) => {
    if (parent[i] < 0) return;
    const e = {d: depth[i], a: W(...pts[parent[i]]), b: W(...pts[i])};
    (onPath.has(i) ? route : links).push(e);
  });
  // the floor: a round lattice
  const R = GW + 0.6;
  const grid: number[] = [];
  for (let k = -GW; k <= GW; k++) {
    const h = Math.sqrt(R * R - k * k);
    grid.push(k * GU, 0, -h * GU, k * GU, 0, h * GU, -h * GU, 0, k * GU, h * GU, 0, k * GU);
  }
  // the moat: distance field to the reached primes on a raster, with lakes
  // enclosed by the reached region filled in (only the water outside counts)
  const MR = 14.5, H = 0.1, N = Math.round((2 * MR) / H) + 1;
  const F = new Float32Array(N * N).fill(99);
  for (const i of comp) {
    const [a, b] = pts[i];
    const i0 = Math.max(0, Math.floor((a - 2.2 + MR) / H)), i1 = Math.min(N - 1, Math.ceil((a + 2.2 + MR) / H));
    const j0 = Math.max(0, Math.floor((b - 2.2 + MR) / H)), j1 = Math.min(N - 1, Math.ceil((b + 2.2 + MR) / H));
    for (let j = j0; j <= j1; j++)
      for (let ii = i0; ii <= i1; ii++) {
        const d = Math.hypot(-MR + ii * H - a, -MR + j * H - b);
        if (d < F[j * N + ii]) F[j * N + ii] = d;
      }
  }
  const ext = new Uint8Array(N * N);
  const fq: number[] = [];
  for (let k = 0; k < N; k++)
    for (const c of [k, (N - 1) * N + k, k * N, k * N + N - 1])
      if (!ext[c] && F[c] > MOAT_IN) {
        ext[c] = 1;
        fq.push(c);
      }
  for (let h = 0; h < fq.length; h++) {
    const c = fq[h], ci = c % N, cj = (c - ci) / N;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const nc = nj * N + ni;
      if (!ext[nc] && F[nc] > MOAT_IN) {
        ext[nc] = 1;
        fq.push(nc);
      }
    }
  }
  for (let c = 0; c < N * N; c++) if (!ext[c]) F[c] = 0;
  const at = (x: number, y: number) => {
    const fi = (x + MR) / H, fj = (y + MR) / H;
    const i = Math.max(0, Math.min(N - 2, Math.floor(fi))), j = Math.max(0, Math.min(N - 2, Math.floor(fj)));
    const u = fi - i, v = fj - j;
    return (F[j * N + i] * (1 - u) + F[j * N + i + 1] * u) * (1 - v) + (F[(j + 1) * N + i] * (1 - u) + F[(j + 1) * N + i + 1] * u) * v;
  };
  // marching squares at one level -> segments (lattice coords)
  const contour = (L: number) => {
    const out: [number, number, number, number][] = [];
    const lerpE = (x0: number, y0: number, v0: number, x1: number, y1: number, v1: number): [number, number] => {
      const t = (L - v0) / (v1 - v0);
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    };
    for (let j = 0; j < N - 1; j++)
      for (let i = 0; i < N - 1; i++) {
        const x0 = -MR + i * H, y0 = -MR + j * H, x1 = x0 + H, y1 = y0 + H;
        const a = F[j * N + i], b = F[j * N + i + 1], c = F[(j + 1) * N + i + 1], d = F[(j + 1) * N + i];
        const s = (a > L ? 1 : 0) | (b > L ? 2 : 0) | (c > L ? 4 : 0) | (d > L ? 8 : 0);
        if (s === 0 || s === 15) continue;
        const eB = () => lerpE(x0, y0, a, x1, y0, b); // bottom
        const eR = () => lerpE(x1, y0, b, x1, y1, c); // right
        const eT = () => lerpE(x0, y1, d, x1, y1, c); // top
        const eL = () => lerpE(x0, y0, a, x0, y1, d); // left
        const add = (p: [number, number], q2: [number, number]) => out.push([p[0], p[1], q2[0], q2[1]]);
        switch (s) {
          case 1: case 14: add(eL(), eB()); break;
          case 2: case 13: add(eB(), eR()); break;
          case 3: case 12: add(eL(), eR()); break;
          case 4: case 11: add(eR(), eT()); break;
          case 6: case 9: add(eB(), eT()); break;
          case 7: case 8: add(eL(), eT()); break;
          case 5: add(eL(), eT()); add(eB(), eR()); break;
          case 10: add(eL(), eB()); add(eR(), eT()); break;
        }
      }
    return out;
  };
  // hatching at 45° inside the band
  const hatch: [number, number, number, number][] = [];
  const SP = 0.32, DS = 0.04, ext2 = MR * Math.SQRT2;
  for (let o = -ext2; o <= ext2; o += SP) {
    let run: [number, number] | null = null;
    let prev: [number, number] = [0, 0];
    for (let t = -ext2; t <= ext2; t += DS) {
      const x = (o - t) / Math.SQRT2, y = (o + t) / Math.SQRT2;
      const inside = Math.abs(x) < MR - H && Math.abs(y) < MR - H && (() => {
        const v = at(x, y);
        return v >= MOAT_IN && v <= MOAT_OUT;
      })();
      if (inside && !run) run = [x, y];
      if (!inside && run) {
        hatch.push([run[0], run[1], prev[0], prev[1]]);
        run = null;
      }
      prev = [x, y];
    }
  }
  // draw order: sweeping both ways round from the walker's tip
  const [ta, tb] = pts[tip];
  const a0 = Math.atan2(tb, ta);
  const key = (s: [number, number, number, number]) => {
    let d = Math.atan2((s[1] + s[3]) / 2, (s[0] + s[2]) / 2) - a0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    return Math.abs(d);
  };
  const toWorld = (S: [number, number, number, number][]) =>
    new Float32Array(S.sort((p, q2) => key(p) - key(q2)).flatMap(([x0, y0, x1, y1]) => [x0 * GU, 0.004, -y0 * GU, x1 * GU, 0.004, -y1 * GU]));
  const geo = (P: number[], I: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setIndex(I);
    return g;
  };
  return {
    grey: geo(greyP, greyI),
    ink: {base: new Float32Array(inkP), ctr: new Float32Array(inkC), d: new Float32Array(inkD), idx: inkI},
    links: links.sort((p, q2) => p.d - q2.d),
    route: route.sort((p, q2) => p.d - q2.d),
    path: path.map((i) => W(...pts[i])),
    grid: new Float32Array(grid),
    rim: ringSegs(R * GU, 160),
    shoreIn: toWorld(contour(MOAT_IN)),
    shoreOut: toWorld(contour(MOAT_OUT)),
    hatch: toWorld(hatch),
    maxD,
  };
})();
const STEP_RING = ringSegs(STEP * GU, 64);
const STEP_DISC = (() => {
  const P: number[] = [], I: number[] = [];
  disc(0, 0, STEP * GU, 0.001, 48, P, I);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  return g;
})();
const WALKER_R = 0.11;
// the walker's position at card-local beat lb (hop d lands on gT(d))
const walkerAt = (lb: number): {p: V3; h: number} => {
  const P = GAUSS.path;
  let k = 0;
  while (k < P.length - 1 && lb >= gT(k + 1)) k++;
  if (k >= P.length - 1) return {p: P[P.length - 1], h: 0};
  const u = seg(lb, gT(k + 1) - HOP_DUR, HOP_DUR);
  const a = P[k], b = P[k + 1];
  const s = u * u * (3 - 2 * u);
  return {p: [a[0] + (b[0] - a[0]) * s, 0, a[2] + (b[2] - a[2]) * s], h: 4 * 0.2 * u * (1 - u)};
};
// links growing out from their parents during their hop
const linkBuf = (L: typeof GAUSS.links, lb: number, out: Float32Array) => {
  let n = 0;
  for (const e of L) {
    const t = seg(lb, gT(e.d) - HOP_DUR, HOP_DUR);
    if (t <= 0) break;
    const s = t * t * (3 - 2 * t);
    out.set([e.a[0], 0.004, e.a[2], e.a[0] + (e.b[0] - e.a[0]) * s, 0.004, e.a[2] + (e.b[2] - e.a[2]) * s], n * 6);
    n++;
  }
  return n;
};
const InkStones: React.FC<{lb: number}> = ({lb}) => {
  const {geo, mat} = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(GAUSS.ink.base.slice(), 3));
    g.setIndex(GAUSS.ink.idx);
    return {geo: g, mat: new THREE.MeshBasicMaterial({color: INK, side: THREE.DoubleSide})};
  }, []);
  React.useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  const {base, ctr, d} = GAUSS.ink;
  const A = (geo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
  let any = false;
  for (let i = 0; i < d.length; i++) {
    const t = seg(lb, gT(d[i]) - 0.02, 0.12);
    const s = t <= 0 ? 0 : backOut(t, 2.6);
    if (s > 0) any = true;
    const cx = ctr[i * 2], cz = ctr[i * 2 + 1];
    A[i * 3] = cx + (base[i * 3] - cx) * s;
    A[i * 3 + 2] = cz + (base[i * 3 + 2] - cz) * s;
  }
  (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  return <mesh geometry={geo} material={mat} renderOrder={2} visible={any} />;
};
const bump = (b: number, at: number, dur: number) => {
  const t = seg(b, at, dur);
  return t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0;
};
export const gaussRotB = (lb: number) => -0.42 + lb * 0.04;
export const GaussB: React.FC<{lb: number}> = ({lb}) => {
  const bufs = useMemo(() => ({links: new Float32Array(GAUSS.links.length * 6), route: new Float32Array(GAUSS.route.length * 6)}), []);
  const nL = linkBuf(GAUSS.links, lb, bufs.links);
  const nR = linkBuf(GAUSS.route, lb, bufs.route);
  const w = walkerAt(lb);
  // the stall: the step circle reaches out twice and finds nothing new
  const pulse = 0.14 * (bump(lb, G_STALL + 0.01, 0.11) + bump(lb, G_MOAT + 0.12, 0.12));
  const moat = ease(lb, G_MOAT, 0.42, (t) => 1 - Math.pow(1 - t, 2));
  const ringO = 1 - 0.45 * ease(lb, G_MOAT + 0.3, 0.5);
  return (
    <group rotation={[0, gaussRotB(lb), 0]}>
      <Ink positions={GAUSS.grid} width={0.8} color="#DAD5C9" upto={ease(lb, -0.65, 0.5)} />
      <Ink positions={GAUSS.rim} width={1.3} color={GREY} upto={ease(lb, -0.65, 0.5)} />
      <mesh geometry={GAUSS.grey} renderOrder={2}>
        <meshBasicMaterial color={LIGHT} side={THREE.DoubleSide} />
      </mesh>
      <LiveInk cap={GAUSS.links.length} positions={bufs.links} n={nL} width={1.3} />
      <LiveInk cap={GAUSS.route.length} positions={bufs.route} n={nR} width={3.2} />
      <InkStones lb={lb} />
      {/* the walker, its shadow and its step circle */}
      <group position={[w.p[0], 0, w.p[2]]}>
        <mesh geometry={STEP_DISC} renderOrder={1} scale={1 + pulse}>
          <meshBasicMaterial color="#E8E3D7" side={THREE.DoubleSide} />
        </mesh>
        <Ink positions={STEP_RING} width={1.8} scale={1 + pulse} opacity={ringO} />
        <mesh position={[0, WALKER_R + w.h, 0]} renderOrder={3}>
          <sphereGeometry args={[WALKER_R, 24, 16]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      </group>
      {/* the moat */}
      <Ink positions={GAUSS.hatch} width={0.9} color={INK2} upto={moat} />
      <Ink positions={GAUSS.shoreIn} width={1.5} upto={moat} />
      <Ink positions={GAUSS.shoreOut} width={1.7} upto={moat} />
    </group>
  );
};
