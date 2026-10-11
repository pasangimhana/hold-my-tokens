// II. THE RELEASE (story beats 8–24 = film F 17–41, 1.5 F per B), owner A.
// SHOTS with HARD CUTS on kicks (lib-a-path releaseCam); every shot breathes
// (constant slow push) and each shot's words live only inside their shot:
//  C1 F 17 (THE DROP, cut + impact): "October 2026." stamps on the cut, the
//         index pages start filling with the real titles beyond it.
//  C2 F 19: the count runs with the flood and lands on F 21 (hit): new math
//         papers / written by one AI model. / from an unreleased OpenAI model
//  D  F 24: the stacks (sheets already falling): In under four weeks. The peak
//         day lands on F 26: 188 in one day.
//  E  F 29: the how. ~4,000 counts up from the cut and lands on F 30, 372 on F 31,
//         and the aside "about 3 hours of thinking each" on F 32, with clear air.
//  F  F 34: the real Lean statement scrolls fast as texture; "<leanFamilies> come
//         with proofs a computer can check." stamps on F 36, green check on F 37.
//         Hard cut to scene III on B 24 (F 41).
import React from 'react';
import type {Station} from '../world/station';
import {Plane} from '../world/Plane';
import {SERIF, MONO} from '../core/fonts';
import {INK, INK2, LEAN_GREEN, Check} from '../style';
import {RELEASE, LEAN_003} from '../data/facts';
import {DAYS} from '../data/days';
import {TeX} from '../core/TeX';
import {releaseCam, releaseBg, releaseFog, CUT_DROP, CUT_COUNT, CUT_STACKS, CUT_HOW, CUT_LEAN} from './lib-a-path';
import {FloodPages, countAt, FIELD_X1, LAND_COUNT} from './lib-a-flood';
import {StacksWorld, SX, zOf, PEAK, SH, AXIS_X, PEAK_LAND} from './lib-a-stacks';
import {ez, Rise, Stamp, WordsIn, fmtN} from './lib-a-type';

const FWD = -Math.PI / 2; // floor text reading toward +x

// ------------------------------------------------------------------ October 2026.
const Date26: React.FC<{B: number}> = ({B}) => {
  if (B < CUT_DROP || B >= CUT_COUNT) return null;
  return (
    <Plane at={[51.4, 0.003, 0]} w={1400} h={200} px={0.012} orient="floor" yaw={FWD} anchor="bc">
      <Stamp B={B} at={CUT_DROP} from={1.22} dur={0.4} origin="50% 100%" style={{width: 1400, height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: SERIF, fontSize: 180, lineHeight: 1, color: INK, whiteSpace: 'nowrap'}}>
        October 2026.
      </Stamp>
    </Plane>
  );
};

// ------------------------------------------------------------------ the count
const NUM_PX = 0.0105;
const Count: React.FC<{B: number}> = ({B}) => {
  if (B < CUT_COUNT || B >= CUT_STACKS) return null;
  const n = countAt(B);
  const land = B >= LAND_COUNT ? ez(B, LAND_COUNT, 0.5) : 0;
  const s = B >= LAND_COUNT ? 1.08 - 0.08 * land : 1;
  return (
    <Plane at={[FIELD_X1 + 1.6, 0.004, 0]} w={1700} h={940} px={NUM_PX} orient="floor" yaw={FWD} anchor="bc">
      <div style={{width: 1700, height: 940, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', color: INK, whiteSpace: 'nowrap'}}>
        <div style={{fontFamily: SERIF, fontSize: 700, lineHeight: 0.74, letterSpacing: '-0.01em', transform: `scale(${s})`, transformOrigin: '50% 100%'}}>{fmtN(n)}</div>
        <Rise B={B} at={9.8} dy={30} style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 150, lineHeight: 1.0, marginTop: 30}}>new math papers</Rise>
        <Rise B={B} at={10.8} dy={20} style={{fontFamily: SERIF, fontSize: 112, lineHeight: 1.0, marginTop: 24}}>written by one AI model.</Rise>
        <Rise B={B} at={11.05} dy={12} style={{fontFamily: SERIF, fontSize: 58, color: INK2, marginTop: 18, height: 64}}>from an unreleased OpenAI model</Rise>
      </div>
    </Plane>
  );
};

// ------------------------------------------------------------------ the stacks
const StacksText: React.FC<{B: number}> = ({B}) => {
  if (B < CUT_STACKS || B >= CUT_HOW) return null;
  const peakH = DAYS[PEAK] * SH;
  return (
    <>
      <Plane at={[AXIS_X - 3.05, 0.002, 0]} w={1800} h={220} px={0.0105} orient="floor" yaw={FWD} tilt={0.16} anchor="bc">
        <WordsIn B={B} at={CUT_STACKS + 0.03} text="In under four weeks." stagger={0.1} dy={-30} style={{width: 1800, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, lineHeight: 1.1, color: INK, whiteSpace: 'nowrap'}} />
      </Plane>
      {/* the peak, standing just above its stack, facing the camera */}
      <Plane at={[SX, peakH + 0.3, zOf(PEAK)]} w={700} h={360} px={0.0095} orient="wall" yaw={FWD} anchor="bc">
        <div style={{width: 700, height: 360, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center'}}>
          <Stamp B={B} at={PEAK_LAND} from={1.3} dur={0.4} origin="50% 100%" style={{fontFamily: SERIF, fontSize: 220, lineHeight: 0.8, color: INK}}>
            {RELEASE.peakDay.count}
          </Stamp>
          <Rise B={B} at={PEAK_LAND + 0.1} dy={10} style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 84, color: INK, marginTop: 16, height: 92}}>in one day</Rise>
        </div>
      </Plane>
    </>
  );
};

// ------------------------------------------------------------------ the how
// two counted sentences, one per kick (F 30 / 31), then the aside on F 32 with
// clear air under "372 results". Rows lie on the
// floor reading toward +x: the first is the farthest (top of frame).
const ROW_PX = 0.0095;
const ROW_W = 2100, ROW_H = 270;
const ROW_X = [122.15, 119.55]; // the two counted rows (box near edges)
const ASIDE_X = 117.75; // the aside's baseline line (its own plane): one comfortable line-gap under 372 (116.55 was too far)
const ROW_RISE = [CUT_HOW + 0.01, 50 / 3 + 0.25]; // counters start running
const ROW_KICK = [50 / 3, 52 / 3]; // F 30, F 31: the numbers land
const ASIDE_AT = 18; // F 32
const small = {fontFamily: SERIF, fontSize: 100, lineHeight: 1};
const big = {fontFamily: SERIF, fontSize: 236, lineHeight: 1};
const NumRow: React.FC<{B: number; i: number}> = ({B, i}) => {
  const k = ROW_KICK[i], r0 = ROW_RISE[i];
  const vis = ez(B, r0, i === 0 ? 0.12 : 0.3); // the first row is up on the cut, already counting
  if (vis <= 0) return null;
  const t = ez(B, r0, k - r0, (u) => 1 - Math.pow(1 - u, 3));
  const land = B >= k ? ez(B, k, 0.4) : 0;
  const s = B >= k ? 1.1 - 0.1 * land : 1;
  const dy = (1 - vis) * 30;
  const body =
    i === 0 ? (
      <>
        <span style={small}>It was given&nbsp;</span>
        <span style={{...big, display: 'inline-block', transform: `scale(${s})`, transformOrigin: '50% 80%'}}>
          <TeX tex="\sim" />
          {fmtN(Math.round((4000 * (B >= k ? 1 : t)) / 10) * 10)}
        </span>
        <span style={small}>&nbsp;open problems.</span>
      </>
    ) : (
      <>
        <span style={small}>It came back with&nbsp;</span>
        <span style={{...big, display: 'inline-block', transform: `scale(${s})`, transformOrigin: '50% 80%'}}>{fmtN(RELEASE.families * (B >= k ? 1 : t))}</span>
        <span style={{...small, fontSize: 140}}>&nbsp;results.</span>
      </>
    );
  return (
    <Plane at={[ROW_X[i], 0.002, 0]} w={ROW_W} h={ROW_H} px={ROW_PX} orient="floor" yaw={FWD} anchor="bc" opacity={vis}>
      <div style={{width: ROW_W, height: ROW_H, display: 'flex', alignItems: 'baseline', justifyContent: 'center', paddingTop: 22, boxSizing: 'border-box', color: INK, whiteSpace: 'nowrap', transform: `translateY(${dy}px)`}}>
        {body}
      </div>
    </Plane>
  );
};
const Aside: React.FC<{B: number}> = ({B}) => (
  <Plane at={[ASIDE_X, 0.002, 0]} w={ROW_W} h={120} px={ROW_PX} orient="floor" yaw={FWD} anchor="bc">
    <Rise B={B} at={ASIDE_AT - 0.04} dy={24} style={{width: ROW_W, height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 88, lineHeight: 1, color: INK2, whiteSpace: 'nowrap'}}>
      about 3 hours of thinking each
    </Rise>
  </Plane>
);
const Numbers: React.FC<{B: number}> = ({B}) =>
  B < CUT_HOW || B >= CUT_LEAN ? null : (
    <>
      <NumRow B={B} i={0} />
      <NumRow B={B} i={1} />
      <Aside B={B} />
    </>
  );

// ------------------------------------------------------------------ checked
// the real Lean statement of family 003 scrolling fast as texture (not to be
// read); on F 30 it slows and dims and the claim is overprinted on it.
const CODE_X = 130.6; // near edge of the scrolling sheet
const CW = 1940, CH = 1300, CPX = 0.01;
const CODE_MID = CODE_X + (CH * CPX) / 2;
const LH = 50; // line height (px)
const LINES = [...LEAN_003.split('\n'), ''];
const STAMP_LEAN = 62 / 3; // B 20.667 = F 36
const LEAN_TICK = 64 / 3; // B 21.333 = F 37
const scrollOff = (B: number) => {
  const b0 = 19.1, b1 = STAMP_LEAN; // already scrolling on the cut (F 34)
  if (B <= b0) return 0;
  if (B <= b1) return 1500 * (B - b0);
  const d = B - b1;
  return 1500 * (b1 - b0) + 90 * d + (1410 / 2.6) * (1 - Math.exp(-2.6 * d));
};
const CodeSheet: React.FC<{B: number}> = ({B}) => {
  if (B < CUT_LEAN) return null;
  const off = scrollOff(B);
  const first = Math.floor(off / LH);
  const n = Math.ceil(CH / LH) + 2;
  const dim = 1 - 0.8 * ez(B, STAMP_LEAN - 0.05, 0.4);
  return (
    <Plane at={[CODE_X, 0.002, 0]} w={CW} h={CH} px={CPX} orient="floor" yaw={FWD} anchor="bc">
      <div style={{width: CW, height: CH, position: 'relative', overflow: 'hidden', background: '#FAF8F3', boxShadow: '0 0 0 1px rgba(20,20,20,0.08), 0 10px 40px rgba(60,48,30,0.16)'}}>
        <div style={{position: 'absolute', inset: 0, opacity: dim}}>
          {Array.from({length: n}, (_, j) => {
            const i = first + j;
            const ln = LINES[i % LINES.length];
            return (
              <div key={i} style={{position: 'absolute', left: 0, top: i * LH - off + 30, height: LH, display: 'flex', alignItems: 'baseline', whiteSpace: 'pre', fontFamily: MONO, fontSize: 38, color: INK}}>
                <span style={{width: 130, textAlign: 'right', paddingRight: 40, color: '#A8A296', fontSize: 28}}>{i + 1}</span>
                <span>{ln.split(/(\btheorem\b)/g).map((sg, k) => <span key={k} style={{fontWeight: sg === 'theorem' ? 700 : 400}}>{sg}</span>)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Plane>
  );
};
const Checked: React.FC<{B: number}> = ({B}) => {
  if (B < STAMP_LEAN - 0.05) return null;
  const tick = ez(B, LEAN_TICK, 0.45);
  return (
    <Plane at={[CODE_MID, 0.02, 0]} w={1900} h={560} px={0.0105} orient="floor" yaw={FWD} anchor="center">
      <div style={{width: 1900, height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK, whiteSpace: 'nowrap'}}>
        <Stamp B={B} at={STAMP_LEAN} from={1.3} dur={0.4} origin="100% 70%" style={{fontFamily: SERIF, fontSize: 360, lineHeight: 1, marginRight: 50}}>
          {RELEASE.leanFamilies}
        </Stamp>
        <div style={{fontFamily: SERIF, fontSize: 104, lineHeight: 1.12}}>
          <WordsIn B={B} at={STAMP_LEAN + 0.08} text="come with proofs" stagger={0.05} dy={18} />
          <WordsIn B={B} at={STAMP_LEAN + 0.25} text="a computer can check." stagger={0.05} dy={18} />
          <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, fontSize: 84, color: LEAN_GREEN, opacity: tick > 0 ? 1 : 0}}>
            <Check t={tick} size={74} color={LEAN_GREEN} width={3} />
            <span style={{opacity: ez(B, LEAN_TICK + 0.1, 0.35)}}>Lean</span>
          </div>
        </div>
      </div>
    </Plane>
  );
};

// ------------------------------------------------------------------ station
const ReleaseWorld: React.FC<{B: number}> = ({B}) => (B >= CUT_STACKS && B < CUT_HOW ? <StacksWorld B={B} fog={releaseFog(B)} /> : null);

const ReleaseText: React.FC<{B: number}> = ({B}) => (
  <>
    <Date26 B={B} />
    <FloodPages B={B} />
    <Count B={B} />
    <StacksText B={B} />
    <Numbers B={B} />
    <CodeSheet B={B} />
    <Checked B={B} />
  </>
);

export const release: Station = {
  id: 'release',
  from: CUT_DROP, // THE DROP: a hard cut on F 17 (the frame nearest the kick)
  to: 24,
  cam: releaseCam,
  World: ReleaseWorld,
  Text: ReleaseText,
  mount: [0, 0],
  bg: releaseBg,
  fog: releaseFog,
  cut: true,
  hits: [LAND_COUNT],
};
