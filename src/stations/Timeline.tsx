// VI. HOW FAST, the finale (from B 56), lead. Hard cut straight onto the
// scroll (the 2021 card slamming): the camera, square-on to the chart, scrolls
// straight sideways along the time axis past six milestones (2021, ChatGPT
// Nov 2022, 2024, 2025, May 2026, Oct 2026).
// Each milestone sits at its true date: as it reaches centre frame on its kick,
// its dot pops on a stem and its card types in above it (date small, the stat
// slammed big, one plain line); cards fade
// once passed. The pen draws the illustrative exponential behind the camera and
// climbs into today on the HIT: "You are here." (B 69.333). A dolly-out (same
// lens, no rotation) while the dashed trend goes straight up off the top of
// frame; HIT (B 72): the closing line. The flat view holds (a barely
// perceptible push) to B 74.667, where the end card cuts in (Credits.tsx).
import React from 'react';
import type {Station, V3} from '../world/station';
import type {Cam} from '../core/Stage';
import {project} from '../core/Stage';
import {Plane} from '../world/Plane';
import {SERIF, MONO} from '../core/fonts';
import {cubicInOut, lerp} from '../core/anim';
import {INK, INK2} from '../style';
import {
  ChartWorld, tfCam, tfFog, ease, fOf, MS, X, XT, H_TODAY, POST_Z, AXIS_X0, Y_AXIS_TOP, centreT,
  F_OPEN, F_QUOTE, F_YAH, F_EXIT, VI_FROM, VI_TO, YAH, EXIT,
} from './lib-lead-chart';

// rough CMU widths (em) to know a label's extent; used only to keep labels off the frame edges
const em = (ch: string) => (/[il.,:;'’|!]/.test(ch) ? 0.28 : /[ftjr()]/.test(ch) ? 0.37 : /[mw]/.test(ch) ? 0.8 : /[A-Z]/.test(ch) ? 0.72 : ch === ' ' ? 0.33 : ch === '%' ? 0.83 : 0.5);
const textW = (s: string, size: number, mono = false) => [...s].reduce((a, c) => a + (mono ? 0.525 : em(c)), 0) * size * 1.08;
// 1 when a label (box x0..x1, y0..y1 in CSS px from its anchor, square-on) sits fully
// inside the frame with margin, fading to 0 as it would touch an edge: never cropped
const inFrame = (cam: Cam, at: V3, px: number, x0: number, x1: number, y0: number, y1: number) => {
  let m = 1e9;
  for (const [lx, ly] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
    const q = project(cam, [at[0] + lx * px, at[1] + ly * px, at[2]]);
    if (!q.visible) return 0;
    m = Math.min(m, q.x, q.y, 1920 - q.x, 1080 - q.y);
  }
  return Math.max(0, Math.min(1, (m - 34) / 30));
};
const typed = (s: string, F: number, at: number, dur: number) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor(((F - at) / dur) * s.length + 0.999))));

// ------------------------------------------------------------------ the scroll
export const CARD_PX = 0.0105; // ~115 px stats while scrolling
const CARD_W = 1300;

// a milestone's card, above-right of its dot: the date types, the stat slams on the kick, the line types
const cardSize = (i: number) => {
  const m = MS[i];
  const long = !!m.big2;
  const w = Math.max(long ? Math.max(textW(m.big, 100), textW(m.big1!, 100), textW(m.big2!, 150)) : textW(m.big, 170), textW(m.small, 44), textW(m.date, 44, true));
  return {w, h: 53 + 6 + (long ? 357 : 173) + 10 + 54};
};
const Card: React.FC<{i: number; F: number; cam: Cam}> = ({i, F, cam}) => {
  const m = MS[i];
  const t0 = m.kick - 0.35;
  const at: V3 = [m.x + 0.15, m.h + 0.35, POST_Z];
  const {w, h} = cardSize(i);
  const o = (F >= t0 ? 1 : 0) * (1 - ease(F, m.out, 0.35, cubicInOut)) * inFrame(cam, at, CARD_PX, 0, w, 0, h);
  if (o <= 0) return null;
  const slam = (at: number) => ease(F, at, 0.3);
  const s0 = slam(m.kick - 0.06);
  const long = !!m.big2;
  const big = (txt: string, k: number, size: number, italic = false) => {
    const s = long ? slam(m.kick - 0.06 + k * 0.2) : s0;
    return (
      <div style={{fontSize: size, fontStyle: italic ? 'italic' : 'normal', lineHeight: 1.02, opacity: s, transform: `scale(${lerp(1.15, 1, s)})`, transformOrigin: '0% 100%'}}>{txt}</div>
    );
  };
  return (
    <Plane at={at} w={CARD_W} h={620} px={CARD_PX} orient="wall" anchor="bl" opacity={o}>
      <div style={{width: CARD_W, height: 620, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: INK, whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: MONO, fontSize: 44, color: INK2}}>{typed(m.date, F, t0, 0.25) || ' '}</div>
        <div style={{fontFamily: SERIF, margin: '6px 0 10px -4px'}}>
          {long ? (
            <>
              {big(m.big, 0, 100)}
              {big(m.big1!, 1, 100)}
              {big(m.big2!, 2, 150, true)}
            </>
          ) : (
            big(m.big, 0, 170)
          )}
        </div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, lineHeight: 1.22, color: INK2}}>{typed(m.small, F, m.kick + (long ? 0.5 : 0.06), 0.3) || ' '}</div>
      </div>
    </Plane>
  );
};

// ------------------------------------------------------------------ the chart labels: few and large
const YEARS = [2020, 2022, 2024, 2026];
const YEAR_PX = 0.016;
const ChartText: React.FC<{F: number; cam: Cam}> = ({F, cam}) => {
  const here = ease(F, F_YAH - 0.03, 0.3);
  const title = ease(F, F_EXIT - 0.06, 0.32);
  return (
    <>
      {/* years print along the axis as they scroll in */}
      {YEARS.map((y) => {
        const at: V3 = [X(y), -0.42, 0.25];
        const w = textW(String(y), 64);
        const o = ease(F, Math.max(F_OPEN - 1, yearIn(y)), 0.45) * inFrame(cam, at, YEAR_PX, -w / 2, w / 2, -80, 0);
        return (
          <Plane key={y} at={at} w={260} h={90} px={YEAR_PX} orient="wall" anchor="tc" opacity={o}>
            <div style={{width: 260, textAlign: 'center', fontFamily: SERIF, fontSize: 64, color: INK}}>{y}</div>
          </Plane>
        );
      })}
      {/* you are here: left of the dot, clear of its rings */}
      <Plane at={[XT - 1.5, H_TODAY + 0.5, POST_Z]} w={1400} h={200} px={0.0085} orient="wall" anchor="br" opacity={here}>
        <div style={{width: 1400, textAlign: 'right', whiteSpace: 'nowrap', color: INK, fontFamily: SERIF, fontSize: 190, lineHeight: 0.95, transform: `scale(${lerp(1.16, 1, here)})`, transformOrigin: '100% 100%'}}>You are here.</div>
      </Plane>
      {/* the closing line: slams as the line leaves the top of the frame */}
      <Plane at={TITLE_AT} w={1600} h={330} px={0.023} orient="wall" anchor="tl" opacity={title}>
        <div style={{width: 1600, whiteSpace: 'nowrap', color: INK, fontFamily: SERIF, fontSize: 140, lineHeight: 1.04, transform: `scale(${lerp(1.14, 1, title)})`, transformOrigin: '0% 0%'}}>
          <div>We’re only <span style={{fontStyle: 'italic'}}>four years</span></div>
          <div>into the game.</div>
        </div>
      </Plane>
    </>
  );
};
// a year prints when it is ~1.6 years right of centre (it has just scrolled into view)
const yearIn = (y: number) => {
  let lo = F_OPEN - 2, hi = F_YAH;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (centreT(mid) < y - 1.6) lo = mid;
    else hi = mid;
  }
  return hi;
};
const TITLE_AT: V3 = [X(2020) + 0.35, 21.0, POST_Z];
const LABEL_AT: V3 = [X(2020) + 0.45, Y_AXIS_TOP + 0.1, POST_Z];
const LABEL_W = textW('AI progress', 66) + textW(' · illustration', 46);

export const timeline: Station = {
  id: 'timeline',
  from: VI_FROM,
  to: VI_TO,
  cut: true,
  hits: [YAH, EXIT],
  cam: tfCam,
  fog: tfFog,
  mount: [0, 0], // hard cuts both sides (an early mount drew the rail over the vortex's last frame)
  World: ({B}) => <ChartWorld B={B} />,
  Text: ({B, cam}) => {
    const F = fOf(B);
    return (
      <>
        {MS.map((m) => (F > m.kick - 0.6 && F < m.out + 0.5 ? <Card key={m.i} i={m.i} F={F} cam={cam} /> : null))}
        <ChartText F={F} cam={cam} />
      </>
    );
  },
};

