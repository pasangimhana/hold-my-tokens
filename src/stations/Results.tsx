// IV · THE GALLERY (B 32–48 = F 53–85, half speed), owner B. A hard cut into
// "And it kept going." over the first figure's shot, then seven results, one
// composed shot each, HARD CUT on each figure's landing kick (B = 31 + 2k).
// The figure is 3D and alive from the cut's first frame, on the right; the
// words are flat 2D type in a left column (lib-card2d, same look as Riemann):
//   who · year (verified only), the subject, a counter rolling up to
//   "N years open", then on the next kick the verdict slams in BIG, one line of
//   copy and the ✓ Lean / paper mark. Every shot breathes (slow orbit + push).
// HIT: Hodge's "Proved" (B 45.5), the end of the gallery.
import React from 'react';
import type {Station} from '../world/station';
import {Plane} from '../world/Plane';
import {RESULTS} from '../data/facts';
import {SERIF} from '../core/fonts';
import {K7, HexPlane, Kakeya, Cayley, Torus} from '../lib/objects';
import {SoftShadow} from '../ink3d';
import {INK, INK2} from '../style';
import {clamp01} from '../core/anim';
import {ez, FadeGroup} from './lib-b-kit';
import {Column, Rise, Slam, Mark, T2, sideOf, TypeLines} from './lib-card2d';
import {galleryCam, OX, LAND, R_FROM, SHOT_FROM, SHOT_TO} from './lib-b-path';
import {LAYOUT} from './lib-b-layout';
import {PrimesB, GaussB, AP_B, AP_FOOT, AP_HOP} from './lib-b-figs';
import {CARDS, factOf} from './lib-b-story';
import type {V3} from '../world/station';

const FIGS: (React.FC<{lb: number; view?: V3}> | null)[] = [null, K7, HexPlane, PrimesB, GaussB, Kakeya, Cayley, Torus];
const SPECS = LAYOUT;
const PRIMES_K = 3;
// framing QA only (scripts measure the type and the figure apart); both false in the film
const QA_HIDE_TYPE = false, QA_HIDE_FIG = false;
export const VERDICT_AT = 1; // B after the landing (3 kicks, ~2.2 s to read the problem): the verdict's kick
export const HODGE_HIT = LAND(7) + VERDICT_AT;
// every verdict slams with the frame punch + shake
export const VERDICT_HITS = [1, 2, 3, 4, 5, 6, 7].map((k) => LAND(k) + VERDICT_AT);

// the type column alternates sides shot to shot (Riemann before us is left):
// figure 1 right, 2 left, ... ; the figure is framed on the other side
export const sideK = (k: number) => sideOf(k);
// on screen exactly for its own shot (hard cuts both ends)
export const onShot = (k: number, B: number) => B >= SHOT_FROM(k) && B < SHOT_TO(k);

// unit vector from figure k toward the camera, in the figure's own (yawed) frame
const viewOf = (k: number, B: number): V3 => {
  const s = SPECS[k], c = galleryCam(B).pos, yaw = s.gyaw ?? s.yaw ?? 0;
  const dx = c[0] - OX(k), dy = c[1] - s.lift, dz = c[2];
  const n = Math.hypot(dx, dy, dz) || 1;
  return [(dx * Math.cos(yaw) - dz * Math.sin(yaw)) / n, dy / n, (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / n];
};

// ------------------------------------------------------------------ 3D
const ResultsWorld: React.FC<{B: number}> = ({B}) => (
  <group>
    {SPECS.map((s, k) => {
      const C = FIGS[k];
      if (!C || !onShot(k, B)) return null;
      const lb = B - LAND(k);
      return (
        <group key={k} position={[OX(k), 0, 0]}>
          {s.shadow ? <SoftShadow w={s.shadow[0]} d={s.shadow[1]} position={[0, 0.002, 0]} opacity={s.shadow[2] * ez(lb, -1.0, 0.8)} /> : null}
          <group position={[0, s.lift, 0]} rotation={[0, s.gyaw ?? s.yaw ?? 0, 0]} scale={s.scale ?? 1}>
            <FadeGroup f={1}>
              <C lb={lb + s.shift} view={viewOf(k, B)} />
            </FadeGroup>
          </group>
        </group>
      );
    })}
  </group>
);

// ------------------------------------------------------------------ the 2D card
// "N years open": the digits roll up once the name has typed in
const COUNT_AT = 0.56, COUNT_DUR = 0.26; // after the name has typed in; lands ~0.6 kick before the verdict
const Counter: React.FC<{n: number; approx?: boolean; lb: number}> = ({n, approx, lb}) => {
  const t = clamp01((lb - COUNT_AT) / COUNT_DUR);
  const v = Math.round(n * (1 - Math.pow(1 - t, 3)));
  const land = lb >= COUNT_AT + COUNT_DUR ? 1 - ez(lb, COUNT_AT + COUNT_DUR, 0.25) : 0;
  return (
    <div style={{fontSize: T2.counter, fontStyle: 'italic', lineHeight: 1.25, whiteSpace: 'nowrap', opacity: clamp01((lb - COUNT_AT + 0.04) * 10)}}>
      {approx ? 'about ' : ''}
      <span style={{display: 'inline-block', minWidth: `${String(n).length * 0.52}em`, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontStyle: 'normal', transform: `scale(${1 + 0.12 * land})`, transformOrigin: '50% 70%'}}>{v}</span>
      {' years open'}
    </div>
  );
};

const Card: React.FC<{k: number; B: number}> = ({k, B}) => {
  const card = CARDS.find((c) => c.k === k);
  if (!card || B < LAND(k) || B >= SHOT_TO(k)) return null;
  const lb = B - LAND(k);
  const fact = factOf(k);
  const ty = SPECS[k].type ?? {};
  return (
    <Column side={sideK(k)}>
      {fact ? <TypeLines B={lb} at={0} dur={0.18} lines={[fact.tag]} style={{fontSize: T2.tag, lineHeight: 1.3, color: INK2, letterSpacing: '0.02em'}} /> : null}
      {/* the problem's name types in while its figure draws */}
      <TypeLines B={lb} at={fact ? 0.12 : 0.02} dur={0.42} lines={card.subject} style={{fontSize: ty.title ?? T2.title, lineHeight: 1.08, marginTop: 4}} />
      {fact?.open ? (
        <div style={{marginTop: 10}}>
          <Counter n={fact.open} approx={fact.approx} lb={lb} />
        </div>
      ) : null}
      <div style={{marginTop: 16}}>
        <Slam B={lb} at={VERDICT_AT} size={ty.verdict ?? T2.verdict}>
          {card.verdict.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
          {card.verdictTail ? <div style={{fontSize: '0.42em', letterSpacing: 0, lineHeight: 1.1, fontStyle: 'italic'}}>{card.verdictTail}</div> : null}
        </Slam>
      </div>
      <Rise B={lb} at={VERDICT_AT + 0.08} style={{fontSize: T2.line, fontStyle: 'italic', lineHeight: 1.25, marginTop: 18}}>
        {card.line}
      </Rise>
      <div style={{marginTop: 12}}>
        <Mark B={lb} at={VERDICT_AT + 0.25} lean={!!RESULTS[k].lean} />
      </div>
    </Column>
  );
};

// the progression's terms, printed on the page under their pillars (part of the diagram), turned to face the camera
const APLabels: React.FC<{B: number}> = ({B}) => {
  const k = PRIMES_K, s = SPECS[k];
  if (!onShot(k, B)) return null;
  const lb = B - LAND(k);
  const yaw = s.gyaw ?? s.yaw ?? 0, sc = s.scale ?? 1;
  return (
    <>
      {AP_B.map((n, i) => {
        const p = AP_FOOT(n);
        const x = p[0] * sc, z = p[2] * sc;
        const at: V3 = [OX(k) + x * Math.cos(yaw) + z * Math.sin(yaw), 0.01, -x * Math.sin(yaw) + z * Math.cos(yaw)];
        const t = ez(lb, AP_HOP(i) - s.shift - 0.05, 0.3); // printed as the hop lands on it
        return (
          <Plane key={n} at={at} w={160} h={90} px={0.0105} orient="floor" yaw={0} tilt={0.6} anchor="bc" opacity={t}>
            <div style={{width: 160, textAlign: 'center', fontFamily: SERIF, fontSize: 64, lineHeight: 1.1, color: INK}}>{n}</div>
          </Plane>
        );
      })}
    </>
  );
};

export const results: Station = {
  id: 'results',
  from: R_FROM,
  to: 48,
  cut: true,
  hits: VERDICT_HITS,
  cam: galleryCam,
  mount: [0, 0], // hard cuts both sides
  fog: () => [60, 160],
  World: ({B}) => (QA_HIDE_FIG ? null : <ResultsWorld B={B} />),
  Text: ({B}) => (QA_HIDE_FIG ? null : <APLabels B={B} />),
  Screen: ({B}) => QA_HIDE_TYPE ? null : (
    <>
      {CARDS.map((c) => (
        <Card key={c.k} k={c.k} B={B} />
      ))}
    </>
  ),
};
