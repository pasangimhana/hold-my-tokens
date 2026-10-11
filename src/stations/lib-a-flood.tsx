// Owner A: the flood. The real manuscript titles set row by row on eight index
// pages lying on the paper (a 3 x 3 field, x 57..85), with the huge count
// printed on the paper beyond it. Pages read with their top toward +x.
import React from 'react';
import manuscripts from '../data/manuscripts.json';
import {MixedTeX} from '../core/TeX';
import {SERIF, MONO} from '../core/fonts';
import {Plane} from '../world/Plane';
import {INK, INK2} from '../style';
import {clamp01, rng} from '../core/anim';
import {DROP, CUT_STACKS} from './lib-a-path';
import {RELEASE} from '../data/facts';

type Ms = {family: string; title: string; titlePlain: string; date: string};
const MS = manuscripts as Ms[];
const N = MS.length; // parsed titles (the README count is RELEASE.manuscripts)
const M = RELEASE.manuscripts;

export const FPX = 0.0075; // world units per page px
export const PW = 1000, PH = 1150;
const GAP = 1.0;
export const FX0 = 57;
const pw = PW * FPX, ph = PH * FPX;
export const slotX = (i: number) => FX0 + ph / 2 + i * (ph + GAP);
export const slotZ = (j: number) => (j - 1) * (pw + GAP);
export const FIELD_X1 = FX0 + 3 * ph + 2 * GAP;

// pages near-to-far
const SLOTS: [number, number][] = [];
for (let i = 0; i < 3; i++) for (const j of [1, 0, 2]) SLOTS.push([i, j]);
const NP = SLOTS.length; // 9
const ROWS_OF = (p: number) => [Math.floor((p * N) / NP), Math.floor(((p + 1) * N) / NP)];
const ROW_H = 25.2;

// fill schedule (global beats): all pages at once, staggered a little near to far;
// inside a page the lines set top to bottom, both columns together.
export const FILL0 = 7.92, FILL1 = 10.58;
export const LAND_COUNT = 32 / 3; // B 10.667 = film kick 16
const rowT = (p: number, k: number, col: number, nLines: number) => {
  const lag = p * 0.07;
  const d = FILL1 - FILL0 - (NP - 1) * 0.07 - 0.12;
  return FILL0 + lag + col * 0.12 + d * (1 - Math.pow(1 - k / nLines, 1.3));
};
const SCHED: {r: number; t: number}[] = [];
const PAGE_ROWS = SLOTS.map((_, p) => {
  const [a, b] = ROWS_OF(p);
  const n = b - a;
  const nl = Math.ceil(n / 2);
  const out: {m: Ms; t: number; c: number}[] = [];
  for (let r = a; r < b; r++) {
    const k = r - a;
    const c = k < nl ? 0 : 1;
    const line = c === 0 ? k : k - nl;
    const t = rowT(p, line, c, nl);
    out.push({m: MS[r], t, c});
    SCHED.push({r, t});
  }
  return out;
});
const SORTED = SCHED.map((s) => s.t).sort((a, b) => a - b);
// manuscripts counted at beat B (the last one lands on film kick 16)
export const countAt = (B: number) => {
  if (B >= LAND_COUNT) return M;
  let lo = 0, hi = SORTED.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (SORTED[mid] <= B) lo = mid + 1;
    else hi = mid;
  }
  return Math.min(M - 1, Math.round((lo / N) * M));
};

const MON = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dshort = (d: string) => `${parseInt(d.slice(8), 10)} ${MON[parseInt(d.slice(5, 7), 10)]}`;

const Row: React.FC<{m: Ms; t0: number; B: number}> = ({m, t0, B}) => {
  const t = clamp01((B - t0) / 0.12);
  if (t <= 0) return <div style={{height: ROW_H}} />;
  return (
    <div style={{height: ROW_H, display: 'flex', alignItems: 'baseline', gap: 10, opacity: t, transform: `translateX(${(1 - t) * 22}px)`}}>
      <span style={{fontFamily: MONO, fontSize: 14, color: INK2, width: 30, flex: 'none'}}>{m.family}</span>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 18, color: INK, flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
        {m.title.includes('$') ? <MixedTeX text={m.title} /> : m.title}
      </span>
      <span style={{fontFamily: MONO, fontSize: 14, color: INK2, width: 48, textAlign: 'right', flex: 'none'}}>{dshort(m.date)}</span>
    </div>
  );
};

const JIT = (() => {
  const r = rng(56);
  return SLOTS.map(() => ({yaw: (r() - 0.5) * 0.03, dx: (r() - 0.5) * 0.3, dz: (r() - 0.5) * 0.3}));
})();

export const FloodPages: React.FC<{B: number}> = ({B}) => {
  if (B < DROP || B >= CUT_STACKS) return null; // gone on the cut to the stacks
  return (
    <>
      {SLOTS.map(([i, j], p) => {
        const rows = PAGE_ROWS[p];
        const j0 = JIT[p];
        return (
          <Plane key={p} at={[slotX(i) + j0.dx, 0.003, slotZ(j) + j0.dz]} w={PW} h={PH} px={FPX} orient="floor" yaw={-Math.PI / 2 + j0.yaw} anchor="center">
            <div
              style={{
                width: PW, height: PH, boxSizing: 'border-box', padding: '50px 56px 0 56px', background: '#FAF8F3',
                boxShadow: '0 0 0 1px rgba(20,20,20,0.07), 0 6px 26px rgba(60,48,30,0.16)', display: 'flex', gap: 34,
              }}
            >
              {[0, 1].map((c) => (
                <div key={c} style={{flex: 1, minWidth: 0}}>
                  {rows.filter((r) => r.c === c).map((r, k) => (
                    <Row key={k} m={r.m} t0={r.t} B={B} />
                  ))}
                </div>
              ))}
            </div>
          </Plane>
        );
      })}
    </>
  );
};
