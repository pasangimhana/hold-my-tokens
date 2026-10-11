// Eight hidden-line ink figures for §3, one per result. All geometry is real
// mathematics computed at module load; each component takes the card-local
// beat `lb` (0 = its kick) and animates purely from it.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {Ink, Occluder, V3} from '../ink3d';
import {clamp01, seg, lerp, cubicInOut, expoOut, backOut} from '../core/anim';
import {PAPER, INK} from '../style';

const GREY = '#8D887D';
const ease = (b: number, at: number, dur: number, f = expoOut) => f(seg(b, at, dur));

// Fat ink segments whose geometry changes every frame (growth, colour by
// depth) without rebuilding the object: a fixed capacity of `cap` segments,
// rewritten in place. `positions` holds n segment pairs (a, b, a, b, ...);
// `colors` (optional, same layout, linear RGB) switches on vertex colours.
// halo: a paper-coloured underlay that writes depth and sits a hair behind the
// ink, so lines further back break where a nearer line crosses them.
export const LiveInk: React.FC<{
  cap: number;
  positions: Float32Array;
  n: number;
  colors?: Float32Array;
  color?: string;
  width?: number;
  opacity?: number;
  halo?: boolean;
  renderOrder?: number;
}> = ({cap, positions, n, colors, color = INK, width = 1.4, opacity = 1, halo = false, renderOrder}) => {
  const vc = !!colors;
  const obj = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array(cap * 6));
    if (vc) g.setColors(new Float32Array(cap * 6));
    const m = new LineMaterial({
      color: new THREE.Color(halo ? PAPER : vc ? '#ffffff' : color), linewidth: width, transparent: true, vertexColors: vc,
      depthTest: true, depthWrite: halo, polygonOffset: halo, polygonOffsetFactor: halo ? 2 : 0, polygonOffsetUnits: halo ? 2 : 0,
    } as any);
    m.resolution.set(1920, 1080);
    const o = new LineSegments2(g, m);
    o.frustumCulled = false;
    return o;
  }, [cap, vc, halo, color, width]);
  React.useEffect(() => () => {
    obj.geometry.dispose();
    (obj.material as LineMaterial).dispose();
  }, [obj]);
  const k = Math.max(0, Math.min(cap, n));
  const g = obj.geometry as any;
  const pb = g.attributes.instanceStart.data;
  (pb.array as Float32Array).set(positions.subarray(0, k * 6));
  pb.needsUpdate = true;
  if (vc && colors) {
    const cb = g.attributes.instanceColorStart.data;
    (cb.array as Float32Array).set(colors.subarray(0, k * 6));
    cb.needsUpdate = true;
  }
  g.instanceCount = k;
  (obj.material as LineMaterial).opacity = opacity;
  obj.renderOrder = renderOrder ?? (halo ? 1 : 2);
  obj.visible = k > 0 && opacity > 0.002;
  return <primitive object={obj} />;
};

// ------------------------------------------------------------------ 017 π
// approximation exponent e(q) = -ln|π - p/q| / ln q for the best p, q = 2..360,
// set as a polar stem plot (q runs round the circle), with the plane at e = 2.
const PI_R = 2.7;
const PI_A0 = -Math.PI * 0.62, PI_A1 = Math.PI * 1.38;
export const PI_Q = (() => {
  const out: {q: number; p: number; e: number; x: number; z: number}[] = [];
  for (let q = 2; q <= 360; q++) {
    const p = Math.round(Math.PI * q);
    const e = -Math.log(Math.abs(Math.PI - p / q)) / Math.log(q);
    const a = lerp(PI_A0, PI_A1, (q - 2) / 358 * 0.94);
    out.push({q, p, e, x: PI_R * Math.cos(a), z: PI_R * Math.sin(a)});
  }
  return out;
})();
const PI_H = 0.72;
export const piTop = (q: number): V3 => {
  const s = PI_Q[q - 2];
  return [s.x, s.e * PI_H, s.z];
};
const PI_GEO = (() => {
  const stems: number[] = [];
  const high: number[] = [];
  const tops: number[] = [];
  for (const s of PI_Q) {
    const y = s.e * PI_H;
    (s.e >= 2 ? high : stems).push(s.x, 0, s.z, s.x, y, s.z);
    const d = s.e >= 2 ? 0.07 : 0.035;
    tops.push(s.x - d, y, s.z, s.x + d, y, s.z, s.x, y - d, s.z, s.x, y + d, s.z);
  }
  const y2 = 2 * PI_H;
  const ring = (r: number, y: number, n = 160) => {
    const a: number[] = [];
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      a.push(r * Math.cos(a0), y, r * Math.sin(a0), r * Math.cos(a1), y, r * Math.sin(a1));
    }
    return a;
  };
  const plane = [...ring(PI_R - 0.45, y2), ...ring(PI_R + 0.45, y2)];
  const hatch: number[] = [];
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * Math.PI * 2, b = a + 0.09;
    hatch.push((PI_R - 0.45) * Math.cos(a), y2, (PI_R - 0.45) * Math.sin(a), (PI_R + 0.45) * Math.cos(b), y2, (PI_R + 0.45) * Math.sin(b));
  }
  const axis: number[] = [...ring(PI_R, 0), 0, 0, 0, 0, 3.0, 0];
  for (let k = 1; k <= 3; k++) axis.push(0, k * PI_H, 0, 0.15, k * PI_H, 0);
  return {stems: new Float32Array(stems), high: new Float32Array(high), tops: new Float32Array(tops), plane: new Float32Array(plane), hatch: new Float32Array(hatch), axis: new Float32Array(axis)};
})();
export const piRot = (lb: number) => 0.4 + lb * 0.16;
export const PiStems: React.FC<{lb: number}> = ({lb}) => {
  const p = ease(lb, -0.3, 1.3, (t) => 1 - Math.pow(1 - t, 2));
  return (
    <group rotation={[0, piRot(lb), 0]}>
      <Ink positions={PI_GEO.axis} width={1.2} upto={ease(lb, -0.4, 0.6)} />
      <Ink positions={PI_GEO.stems} width={1} color={GREY} upto={p} />
      <Ink positions={PI_GEO.tops} width={1.1} upto={p} />
      <Ink positions={PI_GEO.high} width={2.6} upto={ease(lb, 0.4, 0.6)} />
      <Ink positions={PI_GEO.plane} width={1.5} upto={ease(lb, 0.5, 0.6)} />
      <Ink positions={PI_GEO.hatch} width={1} color={GREY} upto={ease(lb, 0.6, 0.8)} />
    </group>
  );
};

// ------------------------------------------------------------------ 157 K7
export const K7_V: V3[] = (() => {
  const v: V3[] = [[0, 1.55, 0], [0, -1.55, 0]];
  for (let k = 0; k < 5; k++) v.push([1.5 * Math.cos((k * 2 * Math.PI) / 5), 0.12 * (k % 2 ? 1 : -1), 1.5 * Math.sin((k * 2 * Math.PI) / 5)]);
  return v;
})();
const K7_E = (() => {
  const a: number[] = [];
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) a.push(...K7_V[i], ...K7_V[j]);
  return new Float32Array(a);
})();
export const k7Rot = (lb: number) => 0.6 + lb * 0.42;
export const K7: React.FC<{lb: number}> = ({lb}) => (
  <group rotation={[0.32, k7Rot(lb), 0.12]}>
    <Ink positions={K7_E} width={1.5} upto={ease(lb, -0.3, 1.2, (t) => t)} />
  </group>
);
export const k7Project = (lb: number, v: V3): V3 => {
  const e = new THREE.Euler(0.32, k7Rot(lb), 0.12);
  const p = new THREE.Vector3(...v).applyEuler(e);
  return [p.x, p.y, p.z];
};

// ------------------------------------------------------------------ 158 hex 7-colouring + Moser spindle
// The classic 7-colouring of the plane: hexagons of diameter 0.9 < 1, colour
// (q + 3r) mod 7, so same-coloured cells are never adjacent and always more
// than 1 apart. Filled in muted print inks (the only colour in the gallery),
// thin ink outlines on top. The fills bloom in as a wave from the centre; the
// Moser spindle (unit-distance graph) floats above, each vertex dotted with
// the colour of the cell under it: points 1 apart always land on different
// colours. Card-local beat lb: 0 = the landing kick, 0.5 = the verdict.
const HEX_R = 0.45; // circumradius: diameter 0.9 < 1
const HEX_RIM = 5.4;
const HEX = (() => {
  const cells: {c: number; cx: number; cz: number}[] = [];
  const N = 7;
  for (let q = -N; q <= N; q++)
    for (let r = -N; r <= N; r++) {
      const s = -q - r;
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) > N) continue;
      const cx = HEX_R * Math.sqrt(3) * (q + r / 2);
      const cz = HEX_R * 1.5 * r;
      if (Math.hypot(cx, cz) > HEX_RIM) continue;
      cells.push({c: (((q + 3 * r) % 7) + 7) % 7, cx, cz});
    }
  return cells;
})();
// pointy-top hexagon vertices
const hexV = (cx: number, cz: number): [number, number][] =>
  Array.from({length: 6}, (_, k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    return [cx + HEX_R * Math.cos(a) * 0.985, cz + HEX_R * Math.sin(a) * 0.985];
  });
// muted print inks, one per colour class: terracotta, ochre, sage, slate blue,
// dusty rose, teal, plum
export const HEX_INKS = ['#CB7D60', '#D8AE5E', '#A2B493', '#8196B2', '#D9A8A0', '#71A29C', '#9A7E96'];
const hexCellAt = (x: number, z: number) => {
  let best = 0, bd = 1e9;
  HEX.forEach((h, i) => {
    const d = Math.hypot(h.cx - x, h.cz - z);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return HEX[best];
};
const HEXG = (() => {
  const outline: number[] = [];
  const order = HEX.map((h, i) => ({i, d: Math.hypot(h.cx, h.cz)})).sort((a, b) => a.d - b.d);
  for (const {i} of order) {
    const h = HEX[i];
    const poly = hexV(h.cx, h.cz);
    for (let k = 0; k < 6; k++) outline.push(poly[k][0], 0, poly[k][1], poly[(k + 1) % 6][0], 0, poly[(k + 1) % 6][1]);
  }
  // fills: one fan per cell (centre + 6 corners), grouped by colour class;
  // every vertex remembers its cell centre and the cell's distance (0..1)
  const fills = Array.from({length: 7}, (_, c) => {
    const base: number[] = [], ctr: number[] = [], d: number[] = [], idx: number[] = [];
    HEX.filter((h) => h.c === c).forEach((h) => {
      const o = base.length / 3;
      const dd = Math.hypot(h.cx, h.cz) / HEX_RIM;
      for (const [x, z] of [[h.cx, h.cz] as [number, number], ...hexV(h.cx, h.cz)]) {
        base.push(x, 0, z);
        ctr.push(h.cx, h.cz);
        d.push(dd);
      }
      for (let k = 0; k < 6; k++) idx.push(o, o + 1 + k, o + 1 + ((k + 1) % 6));
    });
    return {base: new Float32Array(base), ctr: new Float32Array(ctr), d: new Float32Array(d), idx, color: HEX_INKS[c]};
  });
  return {outline: new Float32Array(outline), fills};
})();
export const MOSER: V3[] = (() => {
  const s3 = Math.sqrt(3);
  const phi = 2 * Math.asin(1 / (2 * s3));
  const rh = (rot: number) => {
    const R = (x: number, z: number): [number, number] => [x * Math.cos(rot) - z * Math.sin(rot), x * Math.sin(rot) + z * Math.cos(rot)];
    return [R(Math.cos(-Math.PI / 6), Math.sin(-Math.PI / 6)), R(Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)), R(s3, 0)];
  };
  const [p1, q1, t1] = rh(-phi / 2);
  const [p2, q2, t2] = rh(phi / 2);
  const off: [number, number] = [-0.9, 0.25];
  const Y = 1.0;
  return [[0, 0], p1, q1, t1, p2, q2, t2].map(([x, z]) => [x + off[0], Y, z + off[1]] as V3);
})();
const MOSER_E: [number, number][] = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [0, 4], [0, 5], [4, 5], [4, 6], [5, 6], [3, 6]];
const MOSER_G = (() => {
  const a: number[] = [];
  for (const [i, j] of MOSER_E) a.push(...MOSER[i], ...MOSER[j]);
  const drops: number[] = [];
  for (const v of MOSER) drops.push(v[0], v[1], v[2], v[0], 0.002, v[2]);
  // each vertex takes the colour of the cell it stands over
  const dots = MOSER.map((v) => HEX_INKS[hexCellAt(v[0], v[2]).c]);
  return {edges: new Float32Array(a), drops: new Float32Array(drops), dots};
})();
// timings (card-local beats)
const HEX_WAVE0 = -0.2; // the centre cell blooms (already blooming on the cut, lb 0)
const HEX_WAVE = 0.55; // ... the rim this much later
const HEX_BLOOM = 0.2; // one cell's bloom
const HEX_SPINDLE = 0.5; // on the verdict
// a colour class: positions rewritten each frame (each cell scales up about its centre)
const HexFill: React.FC<{f: (typeof HEXG.fills)[number]; lb: number}> = ({f, lb}) => {
  const {geo, mat} = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(f.base.slice(), 3));
    g.setIndex(f.idx);
    const m = new THREE.MeshBasicMaterial({color: f.color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
    return {geo: g, mat: m};
  }, [f]);
  React.useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  const P = geo.getAttribute('position') as THREE.BufferAttribute;
  const A = P.array as Float32Array;
  let any = false;
  for (let i = 0; i < f.d.length; i++) {
    const t = seg(lb, HEX_WAVE0 + f.d[i] * HEX_WAVE, HEX_BLOOM);
    const s = t <= 0 ? 0 : 1 - Math.pow(1 - t, 3); // cubic out
    if (s > 0) any = true;
    const cx = f.ctr[i * 2], cz = f.ctr[i * 2 + 1];
    A[i * 3] = cx + (f.base[i * 3] - cx) * s;
    A[i * 3 + 2] = cz + (f.base[i * 3 + 2] - cz) * s;
  }
  P.needsUpdate = true;
  return <mesh geometry={geo} material={mat} renderOrder={1} visible={any} />;
};
// a coloured bead with an ink rim (inverted hull)
const HexDot: React.FC<{at: V3; color: string; s: number}> = ({at, color, s}) => (
  <group position={at} scale={Math.max(1e-3, s)} visible={s > 0.001}>
    <mesh renderOrder={2}>
      <sphereGeometry args={[0.1, 20, 14]} />
      <meshBasicMaterial color={color} />
    </mesh>
    <mesh renderOrder={2}>
      <sphereGeometry args={[0.128, 20, 14]} />
      <meshBasicMaterial color={INK} side={THREE.BackSide} />
    </mesh>
  </group>
);
export const hexRot = (lb: number) => 0.335 + lb * 0.1;
export const HexPlane: React.FC<{lb: number}> = ({lb}) => (
  <group rotation={[0, hexRot(lb), 0]}>
    {HEXG.fills.map((f, c) => (
      <HexFill key={c} f={f} lb={lb} />
    ))}
    <Ink positions={HEXG.outline} width={1.0} color={INK} upto={ease(lb, -0.45, 0.7, (t) => t)} />
    <Ink positions={MOSER_G.drops} width={1} color={GREY} dashed={[0.05, 0.05]} upto={ease(lb, HEX_SPINDLE + 0.1, 0.4)} />
    <Ink positions={MOSER_G.edges} width={2.4} upto={ease(lb, HEX_SPINDLE - 0.05, 0.45, (t) => t)} />
    {MOSER.map((v, i) => (
      <HexDot key={i} at={v} color={MOSER_G.dots[i]} s={ease(lb, HEX_SPINDLE + 0.04 * i, 0.25, (t) => backOut(t, 2.2))} />
    ))}
  </group>
);

// ------------------------------------------------------------------ 159 primes + an arithmetic progression
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};
const NMAX = 48;
const PX = (n: number) => (n - 24) * 0.24;
const AP = [5, 11, 17, 23, 29];
const box = (x0: number, x1: number, y1: number, z0: number, z1: number) => {
  const c: V3[] = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return E.flatMap(([i, j]) => [...c[i], ...c[j]]);
};
const PRIMES_G = (() => {
  const edges: number[] = [];
  const geos: THREE.BufferGeometry[] = [];
  for (let n = 1; n <= NMAX; n++) {
    const p = isPrime(n);
    const h = p ? 1.25 : 0.14;
    const w = 0.085;
    edges.push(...box(PX(n) - w, PX(n) + w, h, -w, w));
    const g = new THREE.BoxGeometry(2 * w, h, 2 * w);
    g.translate(PX(n), h / 2, 0);
    geos.push(g);
  }
  // merge geometries
  const pos: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (const g of geos) {
    const P = g.getAttribute('position');
    for (let i = 0; i < P.count; i++) pos.push(P.getX(i), P.getY(i), P.getZ(i));
    const I = g.getIndex()!;
    for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + off);
    off += P.count;
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  mg.setIndex(idx);
  // arcs between consecutive AP terms
  const arcs: number[] = [];
  for (let k = 0; k < AP.length - 1; k++) {
    const a = PX(AP[k]), b = PX(AP[k + 1]);
    let prev: V3 | null = null;
    for (let s = 0; s <= 24; s++) {
      const u = s / 24;
      const p: V3 = [lerp(a, b, u), 1.3 + Math.sin(Math.PI * u) * 0.8, 0];
      if (prev) arcs.push(...prev, ...p);
      prev = p;
    }
  }
  const base = [PX(0.4), 0, 0.2, PX(NMAX + 0.6), 0, 0.2];
  return {edges: new Float32Array(edges), geo: mg, arcs: new Float32Array(arcs), base: new Float32Array(base)};
})();
export const primeX = PX;
export const AP_TERMS = AP;
export const Primes: React.FC<{lb: number}> = ({lb}) => (
  <group>
    <Occluder geometry={PRIMES_G.geo} color={PAPER} />
    <Ink positions={PRIMES_G.base} width={1.2} upto={ease(lb, -0.4, 0.6)} />
    <Ink positions={PRIMES_G.edges} width={1.15} upto={ease(lb, -0.3, 0.9, (t) => t)} />
    <Ink positions={PRIMES_G.arcs} width={2.4} upto={clamp01((lb - 0.55) / 1.1)} />
  </group>
);

// ------------------------------------------------------------------ 028 Gaussian moat
const WIN = 15;
const U = 0.26;
const isGP = (a: number, b: number) => {
  if (a !== 0 && b !== 0) return isPrime(a * a + b * b);
  const p = Math.abs(a || b);
  return isPrime(p) && p % 4 === 3;
};
const GAUSS = (() => {
  const pts: [number, number][] = [];
  const idx = new Map<string, number>();
  for (let a = -WIN; a <= WIN; a++)
    for (let b = -WIN; b <= WIN; b++)
      if (isGP(a, b)) {
        idx.set(`${a},${b}`, pts.length);
        pts.push([a, b]);
      }
  const depth = new Int16Array(pts.length).fill(-1);
  const queue: number[] = [];
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const i = idx.get(`${a},${b}`)!;
    depth[i] = 0;
    queue.push(i);
  }
  for (let h = 0; h < queue.length; h++) {
    const [a, b] = pts[queue[h]];
    for (let da = -1; da <= 1; da++)
      for (let db = -1; db <= 1; db++) {
        if (!da && !db) continue;
        const j = idx.get(`${a + da},${b + db}`);
        if (j !== undefined && depth[j] < 0) {
          depth[j] = depth[queue[h]] + 1;
          queue.push(j);
        }
      }
  }
  const maxD = Math.max(...Array.from(depth));
  const stems: number[] = [];
  const comp: number[] = [];
  const edges: {d: number; s: number[]}[] = [];
  pts.forEach(([a, b], i) => {
    const x = a * U, z = -b * U;
    const inC = depth[i] >= 0;
    const h = inC ? 0.55 : 0.16;
    (inC ? comp : stems).push(x, 0, z, x, h, z);
    if (inC)
      for (let da = -1; da <= 1; da++)
        for (let db = -1; db <= 1; db++) {
          const j = idx.get(`${a + da},${b + db}`);
          if (j !== undefined && j > i && depth[j] >= 0) edges.push({d: Math.max(depth[i], depth[j]), s: [x, h, z, (a + da) * U, 0.55, -(b + db) * U]});
        }
  });
  edges.sort((p, q) => p.d - q.d);
  // lattice + axes
  const grid: number[] = [];
  for (let k = -WIN; k <= WIN; k += 5) grid.push(k * U, 0, -WIN * U, k * U, 0, WIN * U, -WIN * U, 0, k * U, WIN * U, 0, k * U);
  const axes = [-WIN * U - 0.3, 0, 0, WIN * U + 0.3, 0, 0, 0, 0, WIN * U + 0.3, 0, 0, -WIN * U - 0.3];
  const ncomp = queue.length;
  return {stems: new Float32Array(stems), comp: new Float32Array(comp), edges: new Float32Array(edges.flatMap((e) => e.s)), grid: new Float32Array(grid), axes: new Float32Array(axes), ncomp, maxD, nall: pts.length};
})();
export const GAUSS_INFO = {n: GAUSS.nall, comp: GAUSS.ncomp};
const GAUSS_MAP = (() => {
  // rebuild as a map: rings for every Gaussian prime, terraces for the component
  const pts: [number, number][] = [];
  const idx = new Map<string, number>();
  for (let a = -WIN; a <= WIN; a++)
    for (let b = -WIN; b <= WIN; b++)
      if (isGP(a, b)) {
        idx.set(`${a},${b}`, pts.length);
        pts.push([a, b]);
      }
  const depth = new Int16Array(pts.length).fill(-1);
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
          q.push(j);
        }
      }
  }
  const DY = 0.07;
  const rings: number[] = [];
  const dots: number[] = [];
  const drops: number[] = [];
  const edges: {d: number; s: number[]}[] = [];
  const ring = (x: number, y: number, z: number, r: number, n: number, out: number[]) => {
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      out.push(x + r * Math.cos(a0), y, z + r * Math.sin(a0), x + r * Math.cos(a1), y, z + r * Math.sin(a1));
    }
  };
  pts.forEach(([a, b], i) => {
    const x = a * U, z = -b * U;
    if (depth[i] < 0) ring(x, 0, z, 0.06, 10, rings);
    else {
      const y = depth[i] * DY;
      ring(x, y, z, 0.075, 12, dots);
      ring(x, y, z, 0.045, 10, dots);
      ring(x, y, z, 0.018, 6, dots);
      drops.push(x, 0, z, x, y, z);
      for (let da = -1; da <= 1; da++)
        for (let db = -1; db <= 1; db++) {
          const j = idx.get(`${a + da},${b + db}`);
          if (j !== undefined && j > i && depth[j] >= 0) edges.push({d: Math.max(depth[i], depth[j]), s: [x, y, z, (a + da) * U, depth[j] * DY, -(b + db) * U]});
        }
    }
  });
  edges.sort((p2, q2) => p2.d - q2.d);
  const axes = [-WIN * U - 0.3, 0, 0, WIN * U + 0.3, 0, 0, 0, 0, WIN * U + 0.3, 0, 0, -WIN * U - 0.3];
  const frame: number[] = [];
  const E = WIN * U + 0.2;
  frame.push(-E, 0, -E, E, 0, -E, E, 0, -E, E, 0, E, E, 0, E, -E, 0, E, -E, 0, E, -E, 0, -E);
  return {rings: new Float32Array(rings), dots: new Float32Array(dots), drops: new Float32Array(drops), edges: new Float32Array(edges.flatMap((e) => e.s)), axes: new Float32Array(axes), frame: new Float32Array(frame)};
})();
export const gaussRot = (lb: number) => 0.5 + lb * 0.12;
export const Gauss: React.FC<{lb: number}> = ({lb}) => (
  <group rotation={[0, gaussRot(lb), 0]}>
    <Ink positions={GAUSS_MAP.frame} width={1.2} upto={ease(lb, -0.4, 0.6)} />
    <Ink positions={GAUSS_MAP.axes} width={1.1} color={GREY} upto={ease(lb, -0.4, 0.6)} />
    <Ink positions={GAUSS_MAP.rings} width={1.1} upto={ease(lb, -0.3, 0.9, (t) => t)} />
    <Ink positions={GAUSS_MAP.drops} width={1} color={GREY} upto={ease(lb, 0.1, 0.9)} />
    <Ink positions={GAUSS_MAP.edges} width={1.8} upto={clamp01((lb - 0.15) / 1.2)} />
    <Ink positions={GAUSS_MAP.dots} width={1.4} upto={clamp01((lb - 0.1) / 1.1)} />
  </group>
);

// ------------------------------------------------------------------ 074 Kakeya: the deltoid needle as a ruled surface
const KAKEYA = (() => {
  const P = (t: number): [number, number] => [2 * Math.cos(t) + Math.cos(2 * t), 2 * Math.sin(t) - Math.sin(2 * t)];
  const NS = 2400;
  const curve = Array.from({length: NS + 1}, (_, k) => P((k / NS) * Math.PI * 2));
  const N = 120;
  const segs: number[] = [];
  const floor: number[] = [];
  const S = 0.62; // world scale: tangent chord length 4 -> 2.48 world
  const H = 2.6;
  for (let k = 0; k < N; k++) {
    const t = (k / N) * Math.PI * 2;
    const [px, py] = P(t);
    const dx0 = -2 * Math.sin(t) - 2 * Math.sin(2 * t), dy0 = 2 * Math.cos(t) - 2 * Math.cos(2 * t);
    const L = Math.hypot(dx0, dy0);
    let dx = dx0 / L, dy = dy0 / L;
    if (L < 1e-6) { dx = Math.cos(-t / 2); dy = Math.sin(-t / 2); }
    // intersections of the tangent line with the deltoid
    const sd = (q: [number, number]) => (q[0] - px) * dy - (q[1] - py) * dx;
    let smin = 0, smax = 0;
    for (let i = 0; i < NS; i++) {
      const a = sd(curve[i]), b = sd(curve[i + 1]);
      if (a === 0 || a * b < 0) {
        const u = a / (a - b);
        const qx = lerp(curve[i][0], curve[i + 1][0], u), qy = lerp(curve[i][1], curve[i + 1][1], u);
        const s = (qx - px) * dx + (qy - py) * dy;
        smin = Math.min(smin, s);
        smax = Math.max(smax, s);
      }
    }
    const y = (k / N) * H;
    const ax = (px + smin * dx) * S, az = (py + smin * dy) * S, bx = (px + smax * dx) * S, bz = (py + smax * dy) * S;
    segs.push(ax, y, az, bx, y, bz);
    floor.push(ax, 0, az, bx, 0, bz);
  }
  const outline: number[] = [];
  for (let k = 0; k < 240; k++) {
    const a = P((k / 240) * Math.PI * 2), b = P(((k + 1) / 240) * Math.PI * 2);
    outline.push(a[0] * S, 0.002, a[1] * S, b[0] * S, 0.002, b[1] * S);
  }
  return {segs: new Float32Array(segs), floor: new Float32Array(floor), outline: new Float32Array(outline), N, H};
})();
export const Kakeya: React.FC<{lb: number}> = ({lb}) => {
  const up = clamp01((lb + 0.2) / 1.6);
  const k = Math.min(KAKEYA.N - 1, Math.floor(up * KAKEYA.N));
  const needle = useMemo(() => KAKEYA.segs.slice(k * 6, k * 6 + 6), [k]);
  return (
    <group rotation={[0, 0.3 + lb * 0.25, 0]} position={[0, -KAKEYA.H / 2 + 0.2, 0]}>
      <Ink positions={KAKEYA.outline} width={1.6} upto={ease(lb, -0.4, 0.7)} />
      <Ink positions={KAKEYA.floor} width={0.9} color={GREY} upto={up} />
      <Ink positions={KAKEYA.segs} width={1.1} upto={up} />
      <Ink positions={needle} width={3.2} />
    </group>
  );
};

// ------------------------------------------------------------------ 287 Cayley tree of F3, in three dimensions
// The free group on three generators a, b, c: every element is a node, every
// node has six neighbours (times a, a⁻¹, b, b⁻¹, c, c⁻¹), and no path ever
// comes back. Drawn as a real 3D tree: a, b, c along three perpendicular
// directions, each level shorter than the last (ratio < 1/2, so it never
// touches itself), tilted so no generator faces the camera. Depth cues: line
// weight by level, ink fading to grey with distance, small node beads, paper
// halos so nearer branches cut the ones behind, and a slow turn.
// Growth: levels 1–3 sprout as the card lands; the last level bursts out on the verdict.
const CAY_DEPTH = 4;
const CAY_DIRS: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const CAY_L = 1.3, CAY_RATIO = 0.47;
const CAY_W = [3.6, 2.5, 1.6, 0.85]; // px, by level
const CAY_BEAD = [0.105, 0.07, 0.046, 0.025, 0]; // node bead radius, by depth (none on the leaves)
const CAY_TILT = new THREE.Euler(0.62, 0, 0.5); // fixed tilt of the tree's frame
export const CAY_GROW: [number, number][] = [[-0.5, 0.26], [-0.3, 0.26], [-0.1, 0.28], [0.5, 0.22]]; // per level: start, duration (card-local beats)
const CAY_FAR = new THREE.Color('#BDB8AD');
const CAY_NEAR = new THREE.Color(INK);
const CAY_LEAF = new THREE.Color('#CFCABF').toArray();
const TREE = (() => {
  const parent: number[] = [-1], gen: number[] = [-1], depth: number[] = [0];
  const byLevel: number[][] = [[0]];
  let frontier = [0];
  for (let d = 0; d < CAY_DEPTH; d++) {
    const next: number[] = [];
    for (const n of frontier)
      for (let g = 0; g < 6; g++) {
        if (gen[n] >= 0 && g === (gen[n] ^ 1)) continue; // never step straight back
        parent.push(n);
        gen.push(g);
        depth.push(d + 1);
        next.push(parent.length - 1);
      }
    byLevel.push(next);
    frontier = next;
  }
  return {parent, gen, depth, byLevel, n: parent.length};
})();
const cayRot = (lb: number) => -0.35 + lb * 0.3;
const smooth3 = (t: number) => t * t * (3 - 2 * t);
// view: unit vector from the figure toward the camera, in the figure's parent frame
export const Cayley: React.FC<{lb: number; view?: V3}> = ({lb, view = [0.09, 0.3, 0.95]}) => {
  const st = useMemo(() => {
    const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({color: '#ffffff'}), TREE.n);
    beads.frustumCulled = false;
    beads.renderOrder = 2;
    for (let i = 0; i < TREE.n; i++) beads.setColorAt(i, CAY_NEAR);
    return {
      beads,
      pos: new Float32Array(TREE.n * 3),
      lv: TREE.byLevel.slice(1).map((ids) => ({ids, P: new Float32Array(ids.length * 6), C: new Float32Array(ids.length * 6)})),
      m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color(), tmp: new Float32Array(3), t: 0,
    };
  }, []);
  React.useEffect(() => () => {
    st.beads.geometry.dispose();
    (st.beads.material as THREE.Material).dispose();
  }, [st]);
  // rotation of the tree frame into the parent frame (spin about y after the tilt), for depth shading
  const R = new THREE.Matrix4().makeRotationY(cayRot(lb)).multiply(new THREE.Matrix4().makeRotationFromEuler(CAY_TILT));
  const V = new THREE.Vector3(...view).normalize();
  const ext = CAY_L / (1 - CAY_RATIO);
  const shade = (x: number, y: number, z: number, out: Float32Array, o: number) => {
    const s = st.v.set(x, y, z).applyMatrix4(R).dot(V); // + near the camera
    const t = Math.min(1, Math.max(0, (ext * 0.7 - s) / (ext * 1.4)));
    st.t = t;
    st.c.copy(CAY_NEAR).lerp(CAY_FAR, Math.pow(t, 1.6));
    out[o] = st.c.r;
    out[o + 1] = st.c.g;
    out[o + 2] = st.c.b;
    return st.c;
  };
  const pos = st.pos;
  const grown: number[] = [1];
  st.lv.forEach((L, li) => {
    const [a, d] = CAY_GROW[li];
    const g = seg(lb, a, d);
    const gg = g <= 0 ? 0 : 1 - Math.pow(1 - g, 3);
    grown.push(gg);
    const len = CAY_L * Math.pow(CAY_RATIO, li) * gg;
    L.ids.forEach((i, k) => {
      const p = TREE.parent[i], v = CAY_DIRS[TREE.gen[i]];
      const x = pos[p * 3] + v[0] * len, y = pos[p * 3 + 1] + v[1] * len, z = pos[p * 3 + 2] + v[2] * len;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      L.P.set([pos[p * 3], pos[p * 3 + 1], pos[p * 3 + 2], x, y, z], k * 6);
      shade(pos[p * 3], pos[p * 3 + 1], pos[p * 3 + 2], L.C, k * 6);
      shade(x, y, z, L.C, k * 6 + 3);
      if (li === CAY_DEPTH - 1) for (let j = 0; j < 6; j++) L.C[k * 6 + j] = lerp(L.C[k * 6 + j], CAY_LEAF[j % 3], 0.45); // the leaves: fine hairlines
    });
  });
  // beads: grow with their edge
  for (let i = 0; i < TREE.n; i++) {
    const d = TREE.depth[i];
    st.beads.setColorAt(i, shade(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], st.tmp, 0));
    const r = CAY_BEAD[d] * (d === 0 ? ease(lb, -0.55, 0.3) : grown[d]) * (1.3 - 0.6 * st.t); // nearer beads read bigger
    st.m.compose(st.v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), st.q, st.s.setScalar(Math.max(1e-4, r)));
    st.beads.setMatrixAt(i, st.m);
  }
  st.beads.instanceMatrix.needsUpdate = true;
  if (st.beads.instanceColor) st.beads.instanceColor.needsUpdate = true;
  return (
    <group rotation={[0, cayRot(lb), 0]}>
      <group rotation={[CAY_TILT.x, CAY_TILT.y, CAY_TILT.z]}>
        <primitive object={st.beads} />
        {st.lv.map((L, li) => {
          const n = grown[li + 1] > 0 ? L.ids.length : 0;
          return (
            <React.Fragment key={li}>
              {li < CAY_DEPTH - 1 ? <LiveInk cap={L.ids.length} positions={L.P} n={n} width={CAY_W[li] + 3.5} halo /> : null}
              <LiveInk cap={L.ids.length} positions={L.P} n={n} colors={L.C} width={CAY_W[li]} />
            </React.Fragment>
          );
        })}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ 032 complex torus
const TOR = (() => {
  const R = 1.45, r = 0.6, NU = 96, NV = 48;
  const P = (u: number, v: number): V3 => [(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)];
  const geo = new THREE.TorusGeometry(R, r * 0.995, 48, 128);
  geo.rotateX(Math.PI / 2);
  const mer: number[] = [];
  for (let i = 0; i < NU; i += 3) for (let j = 0; j < NV; j++) mer.push(...P((i / NU) * 2 * Math.PI, (j / NV) * 2 * Math.PI), ...P((i / NU) * 2 * Math.PI, ((j + 1) / NV) * 2 * Math.PI));
  const par: number[] = [];
  for (let j = 0; j < NV; j += 3) for (let i = 0; i < NU; i++) par.push(...P((i / NU) * 2 * Math.PI, (j / NV) * 2 * Math.PI), ...P(((i + 1) / NU) * 2 * Math.PI, (j / NV) * 2 * Math.PI));
  const a: number[] = [], b: number[] = [];
  for (let j = 0; j < NV; j++) a.push(...P(1.75, (j / NV) * 2 * Math.PI), ...P(1.75, ((j + 1) / NV) * 2 * Math.PI));
  for (let i = 0; i < NU; i++) b.push(...P((i / NU) * 2 * Math.PI, Math.PI / 2 - 0.0), ...P(((i + 1) / NU) * 2 * Math.PI, Math.PI / 2));
  return {geo, mer: new Float32Array(mer), par: new Float32Array(par), a: new Float32Array(a), b: new Float32Array(b)};
})();
export const Torus: React.FC<{lb: number}> = ({lb}) => (
  <group rotation={[0.55 + lb * 0.04, lb * 0.28, 0.1]}>
    <Occluder geometry={TOR.geo} color={PAPER} />
    <Ink positions={TOR.mer} width={0.95} upto={ease(lb, -0.4, 1.1, (t) => t)} />
    <Ink positions={TOR.par} width={0.95} upto={ease(lb, -0.2, 1.1, (t) => t)} />
    <Ink positions={TOR.a} width={3} upto={ease(lb, 0.6, 0.6, (t) => t)} />
    <Ink positions={TOR.b} width={3} upto={ease(lb, 0.9, 0.8, (t) => t)} />
  </group>
);
