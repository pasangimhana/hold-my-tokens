// 3D canvas for Remotion. Deterministic: the camera is set from props on every
// frame; animate objects from the beat (pass it down, update in useFrame via a ref).
import React from 'react';
import {continueRender, delayRender, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer, Bloom, Noise, Vignette, DepthOfField} from '@react-three/postprocessing';
import {NoToneMapping, ACESFilmicToneMapping, PerspectiveCamera, Vector3, OrthographicCamera} from 'three';

export type Cam = {pos: [number, number, number]; target?: [number, number, number]; fov?: number; roll?: number};

const CamRig: React.FC<Cam> = ({pos, target = [0, 0, 0], fov = 35, roll = 0}) => {
  const {camera} = useThree();
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(target[0], target[1], target[2]);
  // @ts-ignore perspective camera
  camera.fov = fov;
  camera.updateProjectionMatrix();
  return null;
};

// The postprocessing composer only outputs from its 2nd advance(); a freshly
// mounted canvas (first frame of each render tab) would be blank without this.
const WarmUp: React.FC = () => {
  const {advance} = useThree();
  React.useEffect(() => {
    const h = delayRender('canvas warm-up');
    let n = 0;
    const tick = () => {
      advance(performance.now());
      if (++n < 4) requestAnimationFrame(tick);
      else continueRender(h);
    };
    requestAnimationFrame(tick);
  }, [advance]);
  return null;
};

export const Stage: React.FC<{
  cam: Cam;
  children: React.ReactNode;
  bg?: string; // canvas clear colour (match your page)
  fog?: [number, number] | null; // linear fog near/far in bg colour = atmospheric depth
  tone?: 'none' | 'aces';
  bloom?: number; // 0 = off
  bloomThreshold?: number;
  grain?: number; // 0 = off
  vignette?: number; // 0 = off
  dof?: {focus: number; range: number; bokeh: number} | null; // depth of field (costly)
  style?: React.CSSProperties;
}> = ({cam, children, bg = '#ffffff', fog = null, tone = 'none', bloom = 0, bloomThreshold = 1, grain = 0, vignette = 0, dof = null, style}) => {
  const {width, height} = useVideoConfig();
  const fx = bloom > 0 || grain > 0 || vignette > 0 || dof;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1}
      style={{position: 'absolute', inset: 0, ...style}}
      gl={{antialias: !fx, alpha: false, powerPreference: 'high-performance', stencil: false, toneMapping: tone === 'aces' ? ACESFilmicToneMapping : NoToneMapping}}
      camera={{fov: cam.fov ?? 35, near: 0.05, far: 400, position: cam.pos}}
    >
      <color attach="background" args={[bg]} />
      {fog ? <fog attach="fog" args={[bg, fog[0], fog[1]]} /> : null}
      <CamRig {...cam} />
      {children}
      {fx ? (
        <EffectComposer multisampling={8}>
          {dof ? <DepthOfField focusDistance={dof.focus} focalLength={dof.range} bokehScale={dof.bokeh} /> : <></>}
          {bloom > 0 ? <Bloom mipmapBlur luminanceThreshold={bloomThreshold} luminanceSmoothing={0.3} intensity={bloom} radius={0.75} /> : <></>}
          {grain > 0 ? <Noise opacity={grain} /> : <></>}
          {vignette > 0 ? <Vignette offset={0.3} darkness={vignette} /> : <></>}
        </EffectComposer>
      ) : null}
      <WarmUp />
    </ThreeCanvas>
  );
};

// Project a world point to frame pixels with exactly the Stage camera.
export const project = (cam: Cam, p: [number, number, number], w = 1920, h = 1080) => {
  const c = new PerspectiveCamera(cam.fov ?? 35, w / h, 0.05, 400);
  const roll = cam.roll ?? 0;
  const t = cam.target ?? [0, 0, 0];
  c.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  c.up.set(Math.sin(roll), Math.cos(roll), 0);
  c.lookAt(t[0], t[1], t[2]);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new Vector3(p[0], p[1], p[2]).project(c);
  return {x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, visible: v.z > -1 && v.z < 1};
};

// DOM element pinned to a 3D point. Render it as a SIBLING of <Stage>, never inside.
// (drei <Html> silently drops elements in Remotion renders: don't use it.)
export const Anchor: React.FC<{cam: Cam; at: [number, number, number]; children: React.ReactNode; opacity?: number; origin?: string}> = ({
  cam, at, children, opacity = 1, origin = 'translate(-50%, -50%)',
}) => {
  const {width, height} = useVideoConfig();
  const q = project(cam, at, width, height);
  if (!q.visible || opacity <= 0) return null;
  return (
    <div style={{position: 'absolute', left: q.x, top: q.y, transform: origin, opacity, whiteSpace: 'nowrap', pointerEvents: 'none'}}>
      {children}
    </div>
  );
};
