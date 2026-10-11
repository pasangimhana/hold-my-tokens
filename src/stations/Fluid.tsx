// V · NAVIER–STOKES (B 48–56), owner B. A hard cut into the black, onto
// OpenAI's Navier–Stokes vortex re-drawn in ink (lib-fluid-vortex: real
// streamlines of a Burgers-like vortex). The scene is OpenAI's separate
// Navier–Stokes run (facts.ts NS_RUN; never "Solved." / ✓ Lean: the claim is
// disputed and under review). V runs at s = 1.5, so a kick falls every 2/3 B:
//   B 48      cut: "1822–1845 · Navier, Stokes" / "A Millennium Prize problem."
//   kicks 4–7 the run's numbers SLAM one per kick and stack (10,000 AI agents ·
//             88 hours · 2.7 million messages · 130 billion tokens); each is a
//             frame hit and the vortex surges a notch (spin, comets, ring)
//   B 54      HIT (kick 9): "The flow blows up." + the qualifier; the spin
//             peaks, rings burst, the column snaps tight
// then a breathing hold (orbit + push) until the cut at 56.
import React from 'react';
import {Vector3} from 'three';
import type {Station, V3} from '../world/station';
import {Plane, makeCamera} from '../world/Plane';
import {NS_RUN} from '../data/facts';
import {SERIF} from '../core/fonts';
import {PAPER, INK} from '../style';
import {clamp01, lerp} from '../core/anim';
import {ez, Wipe, cubicOut, smooth5} from './lib-b-kit';
import {fluidCam, VC, F_AZ, F_EL, F_R, F_FOV} from './lib-b-path';
import {Vortex, VortexDrive, Ring} from './lib-fluid-vortex';
import {FLUID_TAG} from './lib-b-story';

const FROM = 48, TO = 56;
const KICK = (k: number) => FROM + k / 1.5; // k-th kick after the cut (V runs at 1.5 F per B)
export const SLAMS = [KICK(4), KICK(5), KICK(6), KICK(7)]; // B 50.67 · 51.33 · 52 · 52.67
export const HIT = KICK(9); // B 54
const live = (B: number) => B >= FROM - 1e-4 && B < TO;

const SOFT = '#BDB8AC';
const OLD = '#D2CDC2'; // stats already landed (the newest one is paper white)

// ------------------------------------------------------------------ the drive
// spin multiplier: steady, a notch up (step + pulse) on every stat slam, a
// ramp over the last two kicks, then the surge on the HIT that decays to a
// livelier calm. SPIN is its integral (tabulated once).
const pulse = (d: number, k: number) => (d >= 0 ? Math.exp(-k * d) * (1 - Math.exp(-60 * d)) : 0);
const mAt = (B: number) => {
  let m = 1;
  SLAMS.forEach((s) => {
    if (B >= s) m += 0.45;
    m += 1.1 * pulse(B - s, 4);
  });
  const last = SLAMS[SLAMS.length - 1];
  if (B >= last && B < HIT) m += 1.0 * Math.pow((B - last) / (HIT - last), 2);
  if (B >= HIT) m = 1.8 + (m + 1.0 - 1.8) * Math.exp(-1.5 * (B - HIT)) + 3.4 * pulse(B - HIT, 2);
  return m;
};
const T0 = 47, DT = 0.002;
const SPIN_TAB = (() => {
  const n = Math.ceil((TO + 1 - T0) / DT) + 1;
  const a = new Float64Array(n);
  for (let i = 1; i < n; i++) a[i] = a[i - 1] + 0.5 * DT * (mAt(T0 + (i - 1) * DT) + mAt(T0 + i * DT));
  return a;
})();
const SPIN = (B: number) => {
  const f = Math.max(0, Math.min(SPIN_TAB.length - 1.001, (B - T0) / DT));
  const i = Math.floor(f);
  return SPIN_TAB[i] + (SPIN_TAB[i + 1] - SPIN_TAB[i]) * (f - i);
};
const drive = (B: number): VortexDrive => {
  const dH = B - HIT;
  let squeeze = 0.025 * smooth5((B - SLAMS[0]) / (HIT - SLAMS[0])) + 0.07 * pulse(dH, 2.4);
  let surge = dH >= 0 ? 0.22 * Math.exp(-3 * dH) + 0.85 * pulse(dH, 2.4) : 0;
  const rings: Ring[] = [];
  SLAMS.forEach((s, i) => {
    squeeze += 0.012 * smooth5((B - s) / 0.3) + 0.03 * pulse(B - s, 4);
    surge += 0.4 * pulse(B - s, 4.5);
    rings.push({t: B - s, size: 0.42 + 0.08 * i, amp: 0.4 + 0.08 * i, w: 1.3});
  });
  rings.push({t: dH, size: 1.0, amp: 1, w: 3.2}, {t: dH - 0.16, size: 0.8, amp: 0.7, w: 1.6});
  return {
    reveal: 1.02 * cubicOut((B - 47.6) / 1.6),
    spin: 0.55 * SPIN(B),
    flow: 0.36 * SPIN(B),
    squeeze,
    surge,
    rings,
  };
};

// the body leans ~9° off the upright arrow axis, counter-clockwise as seen
// from the reference view (skirt rising to the right, top leaning left)
const LEAN_AZ = F_AZ(52);
const TILT: [number, number, number, number] = [Math.sin(LEAN_AZ), 0, Math.cos(LEAN_AZ), 0.15];
const FluidWorld: React.FC<{B: number}> = ({B}) => (live(B) ? <Vortex d={drive(B)} position={VC} tilt={TILT} /> : null);

// ------------------------------------------------------------------ words, laid out in frame pixels
// Planes stand in the world at the vortex's depth, facing the camera of a
// reference beat, placed so that at REF they land on the given frame pixel
// (1 CSS px = 1 frame px). The orbit and push then carry them with the vortex.
const REF = 51.5;
const RC = makeCamera(fluidCam(REF), 1920, 1080);
const FWD = RC.getWorldDirection(new Vector3());
const DEPTH = new Vector3(...VC).sub(RC.position).dot(FWD);
const PX = (DEPTH * 2 * Math.tan(((F_FOV / 2) * Math.PI) / 180)) / 1080; // world units per frame px
const YAW = F_AZ(REF);
const TILT_T = -F_EL(REF);
const at = (sx: number, sy: number): V3 => {
  const p = new Vector3((sx / 1920) * 2 - 1, 1 - (sy / 1080) * 2, 0.5).unproject(RC);
  const dir = p.sub(RC.position).normalize();
  const t = DEPTH / dir.dot(FWD);
  const q = RC.position.clone().addScaledVector(dir, t);
  return [q.x, q.y, q.z];
};

const Txt: React.FC<{x: number; y: number; w: number; h: number; o?: number; children: React.ReactNode}> = ({x, y, w, h, o = 1, children}) => (
  <Plane at={at(x, y)} w={w} h={h} px={PX} orient="wall" yaw={YAW} tilt={TILT_T} anchor="tl" opacity={o}>
    {children}
  </Plane>
);

// a slam: lands on its beat (scale 1.3 -> 1), stays
const slamOf = (B: number, at: number) => {
  const t = clamp01((B - (at - 0.02)) / 0.26);
  return {o: B >= at - 0.02 ? clamp01(t * 5) : 0, s: lerp(1.3, 1, cubicOut(t))};
};

const STATS: [string, string][] = [
  [NS_RUN.agents, 'AI agents.'],
  [NS_RUN.hours, 'hours.'],
  // big number, smaller word after: the scale word goes with the word
  [NS_RUN.messages.split(' ')[0], `${NS_RUN.messages.split(' ').slice(1).join(' ')} messages.`],
  [NS_RUN.tokens.split(' ')[0], `${NS_RUN.tokens.split(' ').slice(1).join(' ')} tokens.`],
];
const QUAL = NS_RUN.qualifier.split(' · ');

const COL_X = 132;
const TOP = 196; // first line of the big type (the tag sits above it)
const ROW = 128;

const FluidText: React.FC<{B: number}> = ({B}) => {
  if (!live(B)) return null;
  // on the cut: the tag (it stays as the scene's header) and the problem
  const tag = ez(B, 47.86, 0.32, (t) => t);
  const l1 = ez(B, 47.97, 0.4, (t) => t);
  const l2 = ez(B, 48.12, 0.4, (t) => t);
  const outTitle = 1 - ez(B, SLAMS[0] - 0.36, 0.24, (t) => t);
  // the numbers stack, then clear for the claim
  const outStats = 1 - ez(B, HIT - 0.14, 0.12, (t) => t);
  const fin = slamOf(B, HIT);
  const qual = ez(B, HIT + 0.3, 0.45, (t) => t);
  let newest = -1;
  SLAMS.forEach((s, i) => {
    if (B >= s - 0.02) newest = i;
  });
  return (
    <>
      <Txt x={COL_X} y={TOP - 64} w={760} h={60}>
        <Wipe t={tag}>
          <div style={{fontFamily: SERIF, fontSize: 40, lineHeight: 1.3, color: SOFT, letterSpacing: '0.02em', whiteSpace: 'nowrap'}}>{FLUID_TAG}</div>
        </Wipe>
      </Txt>
      <Txt x={COL_X} y={TOP} w={800} h={260} o={outTitle}>
        <div style={{width: 800, color: PAPER, fontFamily: SERIF, fontSize: 112, lineHeight: 1.06, whiteSpace: 'nowrap'}}>
          <Wipe t={l1}>
            <div>A Millennium</div>
          </Wipe>
          <Wipe t={l2}>
            <div>Prize problem.</div>
          </Wipe>
        </div>
      </Txt>
      <Txt x={COL_X} y={TOP} w={820} h={ROW * 4 + 20} o={outStats}>
        <div style={{width: 820, fontFamily: SERIF, whiteSpace: 'nowrap'}}>
          {STATS.map(([num, word], i) => {
            const sl = slamOf(B, SLAMS[i]);
            return (
              <div
                key={i}
                style={{
                  height: ROW, display: 'flex', alignItems: 'baseline', color: i === newest ? PAPER : OLD, opacity: sl.o,
                  transform: `scale(${sl.s})`, transformOrigin: '0% 60%',
                }}
              >
                <span style={{fontSize: 120, lineHeight: 1}}>{num}</span>
                <span style={{fontSize: 52, marginLeft: 20, lineHeight: 1}}>{word}</span>
              </div>
            );
          })}
        </div>
      </Txt>
      <Txt x={COL_X} y={TOP} w={820} h={420}>
        <div style={{width: 820, fontFamily: SERIF, whiteSpace: 'nowrap'}}>
          <div style={{opacity: fin.o, transform: `scale(${fin.s})`, transformOrigin: '0% 50%', color: PAPER, fontSize: 132, lineHeight: 1.04}}>
            <div>The flow</div>
            <div>blows up.</div>
          </div>
          {/* NS_RUN.qualifier, one item per line (narrow: stays clear of the skirt) */}
          <Wipe t={qual} style={{marginTop: 24}}>
            <div style={{fontSize: 40, lineHeight: 1.3, color: '#D6D1C6'}}>
              {QUAL.map((q, i) => (
                <div key={i}>{q}</div>
              ))}
            </div>
          </Wipe>
        </div>
      </Txt>
    </>
  );
};

export const fluid: Station = {
  id: 'fluid',
  from: FROM,
  to: TO,
  cut: true,
  hits: [...SLAMS, HIT],
  cam: fluidCam,
  mount: [0, 0], // hard cuts both sides: an early/late mount leaks geometry into the neighbouring shot
  bg: () => INK,
  // depth cue: the far side of the skirt sinks into the black
  fog: (B) => [F_R(B) - 4.5, F_R(B) + 10],
  World: ({B}) => <FluidWorld B={B} />,
  Text: ({B}) => <FluidText B={B} />,
};
