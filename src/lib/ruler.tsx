// The FrontierMath ruler: 0–100 % laid out as a long engraved rule in 3D.
// Used in the Intro (Nov 2024, under 2 %).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Ink, Occluder} from '../ink3d';

export const RL = 40; // world length of 100 %
export const X = (pct: number) => (pct / 100) * RL;
export const Z0 = -0.9, Z1 = 0.9;
const TH = 0.12;

const build = () => {
  const outline: number[] = [];
  // top face rectangle + front/back drop edges
  outline.push(0, 0, Z0, RL, 0, Z0, 0, 0, Z1, RL, 0, Z1, 0, 0, Z0, 0, 0, Z1, RL, 0, Z0, RL, 0, Z1);
  outline.push(0, -TH, Z1, RL, -TH, Z1, 0, 0, Z1, 0, -TH, Z1, RL, 0, Z1, RL, -TH, Z1);
  const ticks: number[] = [];
  for (let i = 0; i <= 100; i++) {
    const L = i % 10 === 0 ? 0.7 : i % 5 === 0 ? 0.45 : 0.26;
    ticks.push(X(i), 0, Z1, X(i), 0, Z1 - L);
    ticks.push(X(i), 0, Z0, X(i), 0, Z0 + L * 0.55);
  }
  // half-percent ticks for precision
  const fine: number[] = [];
  for (let i = 0; i < 100; i++) fine.push(X(i + 0.5), 0, Z1, X(i + 0.5), 0, Z1 - 0.13);
  return {outline: new Float32Array(outline), ticks: new Float32Array(ticks), fine: new Float32Array(fine)};
};

// hatching of the filled part [0, pct] on the top face (45 degree lines)
export const hatch = (pct: number, step = 0.07) => {
  const a: number[] = [];
  const x1 = X(pct);
  const w = Z1 - Z0;
  for (let s = -w; s < x1; s += step) {
    let xa = s, za = Z0, xb = s + w, zb = Z1;
    if (xa < 0) { za = Z0 - xa; xa = 0; }
    if (xb > x1) { zb = Z1 - (xb - x1); xb = x1; }
    if (xb > xa) a.push(xa, 0.002, za, xb, 0.002, zb);
  }
  return new Float32Array(a);
};

// floor grid for depth (very faint)
const grid = (n: number, step: number, y: number) => {
  const a: number[] = [];
  for (let i = -4; i <= n; i++) a.push(i * step, y, -12, i * step, y, 12);
  for (let j = -12; j <= 12; j += 2) a.push(-4 * step, y, j, n * step, y, j);
  return new Float32Array(a);
};

export const Ruler: React.FC<{
  ink: string; bg: string; faint: string; plot: number; fillPct: number; fillT: number; prevPct?: number; grid?: boolean; width?: number;
}> = ({ink, bg, faint, plot, fillPct, fillT, prevPct, grid: showGrid = true, width = 1.5}) => {
  const g = useMemo(build, []);
  const body = useMemo(() => {
    const geo = new THREE.BoxGeometry(RL, TH, Z1 - Z0);
    geo.translate(RL / 2, -TH / 2, 0);
    return geo;
  }, []);
  const floor = useMemo(() => grid(46, 1, -TH - 0.002), []);
  const fill = useMemo(() => hatch(Math.max(0.0001, fillPct * fillT)), [fillPct, fillT]);
  const prev = useMemo(() => (prevPct ? hatch(prevPct, 0.035) : null), [prevPct]);
  const fillEdge = useMemo(() => {
    const x = X(fillPct * fillT);
    return new Float32Array([x, 0.003, Z0, x, 0.003, Z1]);
  }, [fillPct, fillT]);
  return (
    <group>
      {showGrid ? <Ink positions={floor} color={faint} width={1} upto={plot} renderOrder={0} /> : null}
      <Occluder geometry={body} color={bg} />
      <Ink positions={g.outline} color={ink} width={width} upto={Math.min(1, plot * 1.4)} />
      <Ink positions={g.ticks} color={ink} width={width} upto={plot} />
      <Ink positions={g.fine} color={ink} width={1} upto={plot} opacity={0.6} />
      {fillT > 0 ? <Ink positions={fill} color={ink} width={1.2} /> : null}
      {fillT > 0 ? <Ink positions={fillEdge} color={ink} width={2.4} /> : null}
      {prev ? <Ink positions={prev} color={ink} width={1} /> : null}
    </group>
  );
};
