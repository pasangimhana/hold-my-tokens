// Text printed INTO the 3D world. A CSS3D projection that matches the WebGL
// camera of <Stage> exactly (same maths as three's CSS3DRenderer, but pure
// React, recomputed from the camera every frame). DOM stays crisp (KaTeX,
// CM fonts), moves with the world, and never pops in screen space.
// Note: DOM is composited above the canvas: keep planes clear of 3D objects
// that should be in front of them.
import React from 'react';
import {useVideoConfig} from 'remotion';
import {Euler, Matrix4, PerspectiveCamera, Quaternion, Vector3} from 'three';
import type {Cam} from '../core/Stage';
import {clamp01} from '../core/anim';
import type {V3} from './station';

const eps = (v: number) => (Math.abs(v) < 1e-10 ? 0 : v);

const cameraCSS = (m: Matrix4) => {
  const e = m.elements;
  return `matrix3d(${eps(e[0])},${eps(-e[1])},${eps(e[2])},${eps(e[3])},${eps(e[4])},${eps(-e[5])},${eps(e[6])},${eps(e[7])},${eps(e[8])},${eps(-e[9])},${eps(e[10])},${eps(e[11])},${eps(e[12])},${eps(-e[13])},${eps(e[14])},${eps(e[15])})`;
};
const objectCSS = (m: Matrix4) => {
  const e = m.elements;
  return `matrix3d(${eps(e[0])},${eps(e[1])},${eps(e[2])},${eps(e[3])},${eps(-e[4])},${eps(-e[5])},${eps(-e[6])},${eps(-e[7])},${eps(e[8])},${eps(e[9])},${eps(e[10])},${eps(e[11])},${eps(e[12])},${eps(e[13])},${eps(e[14])},${eps(e[15])})`;
};

export const makeCamera = (cam: Cam, w: number, h: number) => {
  const c = new PerspectiveCamera(cam.fov ?? 35, w / h, 0.05, 400);
  const roll = cam.roll ?? 0;
  const t = cam.target ?? [0, 0, 0];
  c.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  c.up.set(Math.sin(roll), Math.cos(roll), 0);
  c.lookAt(t[0], t[1], t[2]);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
};

const Ctx = React.createContext<{c: PerspectiveCamera} | null>(null);

export const TextLayer: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => {
  const {width: W, height: H} = useVideoConfig();
  const c = makeCamera(cam, W, H);
  const fovPx = c.projectionMatrix.elements[5] * (H / 2);
  // transform-origin 0 0 everywhere: no percentage/origin ambiguity
  const camT = `translate(${W / 2}px, ${H / 2}px) translateZ(${fovPx}px) ${cameraCSS(c.matrixWorldInverse)}`;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', perspective: `${fovPx}px`, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformStyle: 'preserve-3d', transformOrigin: '0 0', transform: camT}}>
        <Ctx.Provider value={{c}}>{children}</Ctx.Provider>
      </div>
    </div>
  );
};

// Orientation presets. 'floor': lying on the paper (y up), text reads with its
// top pointing along `yaw` (0 = top toward -z, i.e. away from a camera at +z).
// 'wall': standing up, facing +z rotated by `yaw` about y.
export type Orient = 'floor' | 'wall' | V3;
const quatOf = (o: Orient, yaw: number, tilt: number) => {
  const q = new Quaternion();
  if (o === 'floor') q.setFromEuler(new Euler(-Math.PI / 2 + tilt, yaw, 0, 'YXZ'));
  else if (o === 'wall') q.setFromEuler(new Euler(tilt, yaw, 0, 'YXZ'));
  else q.setFromEuler(new Euler(o[0], o[1], o[2], 'YXZ'));
  return q;
};

export type Anchor9 = 'center' | 'tl' | 'tc' | 'tr' | 'cl' | 'cr' | 'bl' | 'bc' | 'br';
const anchorOff = (a: Anchor9, w: number, h: number): [number, number] => {
  // offset (plane-local px, y up) from the anchor point to the element centre
  const col = a === 'center' ? 'c' : a[1];
  const row = a === 'center' ? 'c' : a[0];
  const ax = col === 'l' ? w / 2 : col === 'r' ? -w / 2 : 0;
  const ay = row === 't' ? -h / 2 : row === 'b' ? h / 2 : 0;
  return [ax, ay];
};

export const Plane: React.FC<{
  at: V3; // world position of the anchor point
  w: number; // element size in CSS px
  h: number;
  px?: number; // world units per CSS px (default 0.01: 100 px = 1 unit)
  orient?: Orient;
  yaw?: number;
  tilt?: number; // extra rotation about the plane's x axis (e.g. lift floor text toward the camera)
  anchor?: Anchor9;
  opacity?: number;
  fade?: [number, number]; // camera distance: fully visible before [0], gone after [1]
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({at, w, h, px = 0.01, orient = 'floor', yaw = 0, tilt = 0, anchor = 'center', opacity = 1, fade, children, style}) => {
  const ctx = React.useContext(Ctx);
  if (!ctx || opacity <= 0.002) return null;
  const q = quatOf(orient, yaw, tilt);
  const [ox, oy] = anchorOff(anchor, w, h);
  const off = new Vector3(ox * px, oy * px, 0).applyQuaternion(q);
  const centre = new Vector3(at[0] + off.x, at[1] + off.y, at[2] + off.z);
  // depth for fade / culling
  const v = centre.clone().applyMatrix4(ctx.c.matrixWorldInverse);
  const depth = -v.z;
  if (depth < 0.2) return null;
  let o = opacity;
  if (fade) o *= 1 - clamp01((depth - fade[0]) / Math.max(1e-3, fade[1] - fade[0]));
  if (o <= 0.002) return null;
  const m = new Matrix4().compose(centre, q, new Vector3(px, px, px));
  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: '0 0', transform: `${objectCSS(m)} translate(${-w / 2}px, ${-h / 2}px)`,
        opacity: o, backfaceVisibility: 'hidden', ...style,
      }}
    >
      {children}
    </div>
  );
};
