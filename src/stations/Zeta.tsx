// III. RIEMANN (story beats 24–32 = film F 41–53, 1.5 F per B), owner A.
// Client (2026-10-11): drop the explaining, just DRAW it, then say it's solved.
// No copy over the drawing. A hard cut in on F 41 into a landscape that is
// already penning in (lib-a-zeta): the real ln|zeta| surface races in line by
// line, the critical-line pen steps from zero to zero and every zero pops on
// the 8th grid (F 42, 43 … 47), the dashed strip edges race back (F 47), while
// one continuous crane (lib-a-path zetaCam) rises off the near end into the card
// framing. Then the flat 2D card (lib-card2d), left column:
//  F 47.5 (B 28.333) tag "open for over a century" (as the strip drifts right)
//  F 48   (B 28.667) title "The quasi-Riemann hypothesis"
//  F 50   (B 30)     HIT: the wall stands up at 7/8, "Solved." slams
//  F 50.5 (B 30.333) ✓ Lean
//  then a breathing push to the hard cut out on B 32 (F 53).
import React from 'react';
import type {Station} from '../world/station';
import {INK2} from '../style';
import {pathBg, zetaFog, zetaCam} from './lib-a-path';
import {ZetaWorld, TAG_AT, CARD_AT, WALL_RISE, LEAN_AT} from './lib-a-zeta';
import {Column, Rise, Slam, Mark, T2, TypeLines} from './lib-card2d';

// never date the quasi-RH "1859" (that is the full RH; facts-years.md): "unproven for over a century" is the safe tag
const TAG = 'open for over a century';
const TITLE = ['The quasi-Riemann', 'hypothesis'];

const ZetaCard: React.FC<{B: number}> = ({B}) => {
  if (B < TAG_AT - 0.05 || B >= 32) return null;
  return (
    <Column side="left">
      <TypeLines B={B} at={TAG_AT} dur={0.3} lines={[TAG]} style={{fontSize: T2.tag, lineHeight: 1.3, color: INK2, letterSpacing: '0.02em'}} />
      {/* the name types in as the landscape finishes drawing */}
      <TypeLines B={B} at={CARD_AT - 0.05} dur={0.6} lines={TITLE} style={{fontSize: T2.title, lineHeight: 1.08, marginTop: 4}} />
      <div style={{marginTop: 16}}>
        <Slam B={B} at={WALL_RISE}>Solved.</Slam>
      </div>
      <div style={{marginTop: 12}}>
        <Mark B={B} at={LEAN_AT} lean />
      </div>
    </Column>
  );
};

export const zeta: Station = {
  id: 'zeta',
  from: 24,
  to: 32,
  cam: zetaCam,
  World: ZetaWorld,
  Screen: ({B}) => <ZetaCard B={B} />,
  mount: [0, 0], // nothing of III leaks into the gallery after the cut
  bg: pathBg,
  fog: zetaFog,
  cut: true,
  hits: [WALL_RISE],
};
