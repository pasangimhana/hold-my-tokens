// Owner A: one sheet per manuscript falls into its per-day stack (Sep 10 .. Oct 7). The days
// run along +z (screen left to right for a camera looking +x) on the line x = SX,
// so the chart faces the forward-dollying camera of scene II. Instanced boxes with
// an edge-ink shader (ported from old/sections/release/Stacks.tsx).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {DAYS} from '../data/days';
import {PAPER, INK} from '../style';
import {rng, clamp01} from '../core/anim';
import {Ink, SoftShadow} from '../ink3d';
import {ez} from './lib-a-type';

export const SH = 0.03; // sheet thickness (exaggerated: the peak stands ~5.8 tall)
export const SX = 110; // the row of stacks
export const SDX = 1.0, SWZ = 0.66; // sheet size (x depth, z width)
export const DZ = 0.78; // spacing between days
export const ND = DAYS.length; // 28 days, Sep 10 .. Oct 7
export const zOf = (d: number) => (d - (ND - 1) / 2) * DZ;
export const PEAK = DAYS.indexOf(Math.max(...DAYS)); // Sep 24
export const AXIS_X = SX - SDX / 2 - 0.25; // baseline in front of the stacks
const FALL = 0.34; // beats from release to landing
const DROP_H = 9; // fall height above the stack

// [start, landing of the last sheet] per day (story beats). Film kicks:
// Sep 23 done on F 19 (B 12.667), Sep 24 (the peak) on F 20 (B 13.333), Oct 5 on F 21 (B 14).
export const PEAK_LAND = 40 / 3;
const window = (d: number, n: number): [number, number] => {
  if (d === 13) return [11.3, 38 / 3];
  if (d === 14) return [11.7, PEAK_LAND];
  if (d === 25) return [12.9, 14.0];
  if (d === 15) return [12.0, 13.6];
  if (d === 16 || d === 17) return [12.2 + (d - 16) * 0.1, 13.75 + (d - 16) * 0.08];
  if (d < 13) return [11.1 + d * 0.02, 11.4 + d * 0.02 + 0.06 * n];
  return [12.6 + (d - 18) * 0.05, 13.0 + (d - 18) * 0.05 + 0.02 * n];
};
type Sheet = {d: number; k: number; t0: number; jx: number; jz: number; ry: number; sp: number};
export const SHEETS: Sheet[] = (() => {
  const r = rng(722); // seed only
  const out: Sheet[] = [];
  DAYS.forEach((n, d) => {
    const [a, z] = window(d, n);
    for (let k = 0; k < n; k++) {
      const t0 = n > 1 ? a + (z - FALL - a) * Math.pow(k / (n - 1), 0.85) : z - FALL;
      out.push({d, k, t0, jx: (r() - 0.5) * 0.04, jz: (r() - 0.5) * 0.04, ry: (r() - 0.5) * 0.08, sp: r() < 0.5 ? -1 : 1});
    }
  });
  return out;
})();
export const dayDone = DAYS.map((_, d) => window(d, DAYS[d])[1]);
// height of a day's stack at beat B (for labels)
export const stackH = (d: number, B: number) => SHEETS.filter((s) => s.d === d && B >= s.t0 + FALL).length * SH;

const VERT = /* glsl */ `
varying vec3 vL; varying vec3 vN; varying float vDepth;
void main(){
  vL = position; vN = normal;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
uniform vec3 uPaper; uniform vec3 uInk; uniform float uNear; uniform float uFar;
varying vec3 vL; varying vec3 vN; varying float vDepth;
float edge(float a, float b){
  float da = (0.5 - abs(a)) / max(fwidth(a), 1e-5);
  float db = (0.5 - abs(b)) / max(fwidth(b), 1e-5);
  return min(da, db);
}
void main(){
  vec3 n = abs(vN);
  float e; float shade; float k;
  if (n.y > 0.5) { e = edge(vL.x, vL.z); shade = 1.0; k = 0.95; }
  else if (n.x > 0.5) { e = edge(vL.y, vL.z); shade = 0.84; k = 0.5; }
  else { e = edge(vL.x, vL.y); shade = 0.92; k = 0.5; }
  float ink = 1.0 - smoothstep(0.35, 1.25, e);
  vec3 col = mix(uPaper * shade, uInk, ink * k);
  float f = clamp((vDepth - uNear) / max(1e-3, uFar - uNear), 0.0, 1.0);
  gl_FragColor = vec4(mix(col, uPaper, f), 1.0);
}`;
const hex = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

const Sheets: React.FC<{B: number; fog: [number, number]}> = ({B, fog}) => {
  const mesh = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.ShaderMaterial({
      uniforms: {uPaper: {value: hex(PAPER)}, uInk: {value: hex(INK)}, uNear: {value: 20}, uFar: {value: 80}},
      vertexShader: VERT, fragmentShader: FRAG,
    });
    const im = new THREE.InstancedMesh(g, m, SHEETS.length);
    im.frustumCulled = false;
    return im;
  }, []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  (mesh.material as THREE.ShaderMaterial).uniforms.uNear.value = fog[0];
  (mesh.material as THREE.ShaderMaterial).uniforms.uFar.value = fog[1];
  let n = 0;
  for (const s of SHEETS) {
    const t = clamp01((B - s.t0) / FALL);
    if (B < s.t0 - 0.02) continue;
    const e = t * t; // gravity
    const flut = (1 - e);
    const y = (s.k + 0.5) * SH + flut * DROP_H;
    tmp.position.set(SX + s.jx + flut * 0.4 * Math.cos(t * 5 + s.k), y, zOf(s.d) + s.jz + flut * 0.35 * s.sp * Math.sin(t * 7 + s.k));
    tmp.rotation.set(flut * 0.5 * s.sp * Math.sin(t * 6 + s.k), s.ry + flut * 1.2 * s.sp, flut * 0.35 * Math.cos(t * 4 + s.k));
    tmp.scale.set(SDX, SH * 0.999, SWZ);
    tmp.updateMatrix();
    mesh.setMatrixAt(n++, tmp.matrix);
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

// floor axis: a baseline across the days with a tick per day (toward the camera)
const AXIS = (() => {
  const a: number[] = [];
  a.push(AXIS_X, 0, zOf(0) - 0.6, AXIS_X, 0, zOf(ND - 1) + 0.6);
  for (let d = 0; d < ND; d++) a.push(AXIS_X, 0, zOf(d), AXIS_X - (d === 0 || d === 21 ? 0.36 : 0.16), 0, zOf(d));
  return new Float32Array(a);
})();

export const StacksWorld: React.FC<{B: number; fog: [number, number]}> = ({B, fog}) => {
  if (B < 11.0) return null;
  return (
    <group>
      <Sheets B={B} fog={fog} />
      <Ink positions={AXIS} width={1.4} upto={ez(B, 11.3, 0.9, (t) => 1 - Math.pow(1 - t, 2))} />
      {DAYS.map((n, d) =>
        n > 0 ? (
          <SoftShadow key={d} w={SDX * 1.9} d={SWZ * 2.1} position={[SX + 0.1, 0.001, zOf(d) + 0.1]} opacity={0.3 * clamp01(Math.min(n, 60) / 20) * ez(B, dayDone[d] - 0.7, 0.9)} />
        ) : null,
      )}
    </group>
  );
};
