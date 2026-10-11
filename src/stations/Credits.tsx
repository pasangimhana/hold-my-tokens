// THE END CARD (B 74.667–82.667 = F 141–153), owner B. A hard cut onto fresh
// paper. The film's 3D figures stand as a small constellation round the
// centre, each drawing itself in on a kick (F 141–146) and then turning, while
// the camera slowly orbits and pushes. "Made with" types in; the Claude spark
// spins in on the riser; HIT on F 149 (B 80): "Claude" and the spark slam.
// Then the repository and the fine print, and the last ~1.5 s breathe to the
// end of the film (F 153). The spark's orange is the only colour added here.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import type {Station, V3} from '../world/station';
import {SERIF, MONO} from '../core/fonts';
import {INK, INK2} from '../style';
import {clamp01, lerp, cubicInOut} from '../core/anim';
import {K7, HexPlane, Kakeya, Cayley, Torus} from '../lib/objects';
import {GaussB} from './lib-b-figs';
import {ez, orbitCam, FadeGroup} from './lib-b-kit';

// this stretch of the warp is linear: F = 113 + 1.5 (B − 56)
const fOfB = (B: number) => 113 + 1.5 * (B - 56);
const bOfF = (F: number) => 56 + (F - 113) / 1.5;
export const CREDITS_FROM = bOfF(141); // the cut (B 74.667)
export const CREDITS_HIT = bOfF(149); // "Claude" slams (B 80)
export const CREDITS_END = bOfF(153); // the end of the film (B 82.667)

// ------------------------------------------------------------------ camera
const C0: V3 = [1400, 0, 0]; // a clean sheet, far from every other station
const R0 = 20, EL = 0.3, FOV = 27;
const FOCAL = 540 / Math.tan(((FOV / 2) * Math.PI) / 180); // px per unit at distance 1
const u = (B: number) => clamp01((B - CREDITS_FROM) / (CREDITS_END - CREDITS_FROM));
// a slow orbit across the centre and a gentle push, at a constant rate to the last frame
const creditsCam = (B: number) => orbitCam(C0, R0 * (1.03 - 0.065 * u(B)), -0.075 + 0.15 * u(B), EL, FOV);

// ------------------------------------------------------------------ the constellation
// Screen spots (1920×1080, at the mid-shot pose) on an ellipse round the type,
// laid out in the plane through C0 facing the camera. R: on-screen radius (px);
// rl: the figure's own radius (its units); tilt lifts the flat figures toward us.
// Each draws in on its kick from its own start l0 to l1 (figure beats) at
// `rate` figure beats per film beat, then eases down to a calm turn (SLOW).
type Spot = {C: React.FC<{lb: number}>; at: [number, number]; R: number; rl: number; tilt?: number; l0: number; l1: number; rate: number; kick: number};
const SPOTS: Spot[] = [
  {C: K7, at: [600, 200], R: 118, rl: 1.6, l0: -0.1, l1: 0.9, rate: 0.95, kick: 141}, // already drawing on the cut
  {C: Cayley, at: [1320, 200], R: 132, rl: 2.1, l0: -0.5, l1: 0.72, rate: 0.95, kick: 142},
  {C: Torus, at: [1700, 545], R: 112, rl: 2.05, l0: -0.4, l1: 1.7, rate: 1.4, kick: 143},
  {C: HexPlane, at: [1340, 895], R: 132, rl: 5.4, tilt: 0.62, l0: -0.45, l1: 0.9, rate: 1.0, kick: 144},
  {C: GaussB, at: [580, 895], R: 132, rl: 3.95, tilt: 0.62, l0: -0.85, l1: 0.92, rate: 1.25, kick: 145},
  {C: Kakeya, at: [220, 545], R: 112, rl: 2.0, l0: -0.4, l1: 1.4, rate: 1.25, kick: 146},
];
const SLOW = 0.3, EASE_F = 1.2; // figure beats per film beat once drawn; the ease-down window (F)
// figure beat after t film beats on stage: `rate` until drawn, a smoothstep down to SLOW, then SLOW
const clockOf = (s: Spot, t: number) => {
  const tD = (s.l1 - s.l0) / s.rate;
  if (t <= tD) return s.l0 + s.rate * t;
  const x = Math.min(1, (t - tD) / EASE_F);
  const blend = s.rate * x * EASE_F + (SLOW - s.rate) * EASE_F * (x * x * x - (x * x * x * x) / 2); // ∫ of the eased rate
  return s.l1 + blend + SLOW * Math.max(0, t - tD - EASE_F);
};
const placeOf = (s: Spot): {p: V3; k: number} => {
  const X = ((s.at[0] - 960) * R0) / FOCAL, Y = (-(s.at[1] - 540) * R0) / FOCAL;
  // the plane through C0 facing the mid-shot camera (az 0, elevation EL)
  return {p: [C0[0] + X, C0[1] + Y * Math.cos(EL), C0[2] - Y * Math.sin(EL)], k: (s.R * R0) / FOCAL / s.rl};
};
const PLACES = SPOTS.map(placeOf);
const kickB = (F: number) => bOfF(F);

const CreditsWorld: React.FC<{B: number}> = ({B}) => (
  <group>
    {SPOTS.map((s, i) => {
      const b0 = kickB(s.kick);
      if (B < b0) return null;
      const lb = clockOf(s, (B - b0) * 1.5);
      const {p, k} = PLACES[i];
      return (
        <group key={i} position={p} rotation={[s.tilt ?? 0, 0, 0]} scale={k}>
          <FadeGroup f={1}>
            <s.C lb={lb} />
          </FadeGroup>
        </group>
      );
    })}
  </group>
);

// ------------------------------------------------------------------ the sign-off (2D, centred)
const MADE = 'Made with';
const F_TYPE = 144.2, F_TYPE_DUR = 1.1; // "Made with" types in
const F_SPIN = 147.2; // the spark spins in ...
const F_SLAM = 149; // ... and slams with "Claude" (HIT)
const F_REPO = 150.0, F_FINE = 150.7;
const LOGO = 110; // px: the 248 px spark, drawn smaller so it stays crisp (its white ground multiplies away into the paper)
const typed = (s: string, F: number, at: number, dur: number) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor(((F - at) / dur) * s.length + 0.999))));
const SignOff: React.FC<{B: number}> = ({B}) => {
  const F = fOfB(B);
  if (F < F_TYPE - 0.05) return null;
  const made = typed(MADE, F, F_TYPE, F_TYPE_DUR);
  const caret = F < F_TYPE + F_TYPE_DUR + 0.6 && Math.floor((F - F_TYPE) * 4) % 2 === 0;
  // the spark: one smooth spin-in that lands exactly on the HIT (a soft back-out overshoot,
  // no jump at the slam), then dead still: identity transform, so the small raster is never
  // re-resampled by sub-degree drift
  const st = clamp01((F - F_SPIN) / (F_SLAM - F_SPIN));
  const spin = st;
  const backOut = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const slam = ez(F, F_SLAM, 0.32);
  const on = F >= F_SLAM - 0.02;
  const settled = st >= 1;
  const logoScale = settled ? 1 : backOut(st);
  const logoRot = settled ? 0 : lerp(-240, 0, 1 - Math.pow(1 - st, 3));
  const repo = typed('github.com/openai/math', F, F_REPO, 0.7);
  const fine = ez(F, F_FINE, 0.6, cubicInOut);
  return (
    <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: INK, pointerEvents: 'none'}}>
      <div style={{fontFamily: SERIF, fontSize: 50, lineHeight: 1.2, color: INK2, letterSpacing: '0.02em', whiteSpace: 'pre', height: 60}}>
        {made}
        <span style={{opacity: caret ? 0.8 : 0}}>|</span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 2, height: 176}}>
        <Img
          src={staticFile('claude-spark.png')}
          style={{width: LOGO, height: LOGO, opacity: spin > 0 ? 1 : 0, mixBlendMode: 'multiply', transform: settled ? 'none' : `rotate(${logoRot}deg) scale(${Math.max(0.001, logoScale)})`}}
        />
        <div style={{fontFamily: SERIF, fontSize: 172, lineHeight: 1, letterSpacing: '-0.01em', opacity: on ? 1 : 0, transform: `scale(${lerp(1.25, 1, slam)})`, transformOrigin: '0% 60%', willChange: 'transform'}}>
          Claude
        </div>
      </div>
      <div style={{fontFamily: MONO, fontSize: 32, lineHeight: 1.3, marginTop: 24, height: 42, whiteSpace: 'pre'}}>{repo || ' '}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 24, color: INK2, marginTop: 8, opacity: fine, transform: `translateY(${(1 - fine) * 6}px)`}}>
        Claims as published by OpenAI.
      </div>
    </AbsoluteFill>
  );
};

export const credits: Station = {
  id: 'credits',
  from: CREDITS_FROM,
  to: CREDITS_END + 2,
  cut: true,
  hits: [], // no shake on the Claude slide (the slam stays)
  cam: creditsCam,
  fog: () => [200, 500],
  mount: [0, 2], // hard cut in: never drawn under the previous shot's camera
  World: ({B}) => <CreditsWorld B={B} />,
  Screen: ({B}) => <SignOff B={B} />,
};
