// Hidden-line ink plotting for R3F. Surfaces are drawn in the page colour with
// polygon offset; ink lines go on top (depth-tested, so back lines are hidden).
// NOTE: inside <Stage> never call useB(): the PreRoll context does not cross the
// R3F reconciler. Pass the beat down as a prop.
import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import type {Cam} from './core/Stage';
import {clamp01} from './core/anim';

export type V3 = [number, number, number];

// Fat ink segments. `positions` holds pairs of points (a, b, a, b, ...).
// `upto` in [0,1] = fraction of segments drawn (pen-plotter draw range).
export const Ink: React.FC<{
  positions: Float32Array;
  color?: string;
  width?: number;
  opacity?: number;
  upto?: number;
  count?: number;
  dashed?: [number, number];
  depthTest?: boolean;
  depthWrite?: boolean;
  renderOrder?: number;
  fog?: boolean;
  position?: V3;
  rotation?: V3;
  scale?: number | V3;
  visible?: boolean;
}> = ({positions, color = '#141414', width = 1.4, opacity = 1, upto = 1, count, dashed, depthTest = true, depthWrite = false, renderOrder = 2, fog = true, position, rotation, scale, visible = true}) => {
  const obj = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(positions);
    const m = new LineMaterial({color: new THREE.Color(color), linewidth: width, transparent: true, depthTest, depthWrite, fog, dashed: !!dashed} as any);
    if (dashed) {
      m.dashSize = dashed[0];
      m.gapSize = dashed[1];
      m.dashScale = 1;
    }
    m.resolution.set(1920, 1080);
    const o = new LineSegments2(g, m);
    if (dashed) o.computeLineDistances();
    o.frustumCulled = false;
    return o;
  }, [positions, color, width, depthTest, depthWrite, fog, dashed ? dashed[0] : 0, dashed ? dashed[1] : 0]);
  useEffect(() => () => {
    obj.geometry.dispose();
    (obj.material as LineMaterial).dispose();
  }, [obj]);
  const total = positions.length / 6;
  const n = count !== undefined ? Math.max(0, Math.min(total, Math.floor(count))) : Math.floor(total * clamp01(upto));
  (obj.geometry as any).instanceCount = n;
  (obj.material as LineMaterial).opacity = opacity;
  obj.renderOrder = renderOrder;
  obj.visible = visible && n > 0 && opacity > 0.002;
  return <primitive object={obj} position={position} rotation={rotation} scale={scale} />;
};

// Paper (or ink) coloured occluder surface for hidden-line rendering.
export const Occluder: React.FC<{geometry: THREE.BufferGeometry; color?: string; opacity?: number; position?: V3; rotation?: V3; scale?: number | V3; side?: THREE.Side; visible?: boolean}> = ({
  geometry, color = '#F4F1EA', opacity = 1, position, rotation, scale, side = THREE.DoubleSide, visible = true,
}) => (
  <mesh geometry={geometry} position={position} rotation={rotation} scale={scale} renderOrder={1} visible={visible}>
    <meshBasicMaterial color={color} side={side} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} transparent={opacity < 1} opacity={opacity} />
  </mesh>
);

// Soft printed drop shadow (radial falloff), lying on y = const.
let SHADOW_TEX: THREE.Texture | null = null;
const shadowTex = () => {
  if (SHADOW_TEX) return SHADOW_TEX;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.25)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  SHADOW_TEX = new THREE.CanvasTexture(c);
  return SHADOW_TEX;
};
export const SoftShadow: React.FC<{w: number; d: number; position: V3; opacity?: number; rotation?: number}> = ({w, d, position, opacity = 0.35, rotation = 0}) => {
  const tex = useMemo(() => shadowTex(), []);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} renderOrder={0}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} color="#3a3328" />
    </mesh>
  );
};

// ------------------------------------------------------------------ geometry builders
export const segs = (arr: number[]) => new Float32Array(arr);

// polyline -> segment pairs
export const polySegs = (pts: V3[], out: number[] = []) => {
  for (let i = 0; i < pts.length - 1; i++) out.push(...pts[i], ...pts[i + 1]);
  return out;
};

// circle in a plane (normal axis 'y' | 'z' | 'x')
export const circlePts = (c: V3, r: number, n = 64, axis: 'x' | 'y' | 'z' = 'y'): V3[] => {
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const u = Math.cos(a) * r, v = Math.sin(a) * r;
    pts.push(axis === 'y' ? [c[0] + u, c[1], c[2] + v] : axis === 'z' ? [c[0] + u, c[1] + v, c[2]] : [c[0], c[1] + u, c[2] + v]);
  }
  return pts;
};

// Grid surface y = f(x, z): returns occluder geometry + ink lines along both directions
export const gridSurface = (
  nx: number, nz: number, at: (i: number, j: number) => V3, stepX = 1, stepZ = 1,
) => {
  const pos = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) pos.set(at(i, j), (j * nx + i) * 3);
  const idx: number[] = [];
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1;
      idx.push(a, b2, c, b2, d, c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const P = (i: number, j: number): V3 => [pos[(j * nx + i) * 3], pos[(j * nx + i) * 3 + 1], pos[(j * nx + i) * 3 + 2]];
  const rows: number[] = []; // lines of constant j (along x)
  for (let j = 0; j < nz; j += stepZ) for (let i = 0; i < nx - 1; i++) rows.push(...P(i, j), ...P(i + 1, j));
  const cols: number[] = []; // lines of constant i (along z)
  for (let i = 0; i < nx; i += stepX) for (let j = 0; j < nz - 1; j++) cols.push(...P(i, j), ...P(i, j + 1));
  return {geo, rows: new Float32Array(rows), cols: new Float32Array(cols)};
};

// ------------------------------------------------------------------ camera
export const orbit = (target: V3, r: number, az: number, el: number, fov = 35, roll = 0): Cam => ({
  pos: [target[0] + r * Math.sin(az) * Math.cos(el), target[1] + r * Math.sin(el), target[2] + r * Math.cos(az) * Math.cos(el)],
  target,
  fov,
  roll,
});
