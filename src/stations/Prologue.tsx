// I. THEN (story beats 0–8 = film F 1–17, after a 1-kick lead-in), owner A.
// A black plate on the page (x -10..50). Two shots, HARD CUTS on kicks
// (lib-a-path prologueCam):
//  A (F 0–9)  the hook: the FrontierMath ruler plots itself in white ink while
//             "Nov 2024. / The best AI could solve / under 2% / of research-level
//             math problems." sets around its start; a slow push.
//  B (F 9–17) cut onto the ruler, already racing down the empty 98 % to
//             "everything else: out of reach." (F 13), easing into a slow push.
//  THE DROP (B 8 = F 17): a hard cut with the impact into II (Release.tsx).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {Station} from '../world/station';
import {Plane} from '../world/Plane';
import {Ruler, X} from '../lib/ruler';
import {Ink} from '../ink3d';
import {INK} from '../style';
import {SERIF, MONO} from '../core/fonts';
import {prologueCam, prologueBg, prologueFog, CUT_RUN, CUT_DROP} from './lib-a-path';
import {ez, Rise, Stamp, WordsIn} from './lib-a-type';
import {AT} from '../world/layout';

const LINE = '#EDE9E0';
const DIM = '#9C978C';
const FAINT = '#34332E';
const PX0 = AT.prologue.x0, PX1 = AT.prologue.x1;
const PZ = 8.5; // plate half-depth
const PY = -0.125; // plate just under the ruler body
const LEFT = -3.6; // left edge of the hook block

const plateGrid = () => {
  const a: number[] = [];
  for (let x = PX0; x <= PX1; x += 1) a.push(x, PY + 0.003, -PZ, x, PY + 0.003, PZ);
  for (let z = -PZ; z <= PZ; z += 2) a.push(PX0, PY + 0.003, z, PX1, PY + 0.003, z);
  return new Float32Array(a);
};

const plotOf = (B: number) => ez(B, -0.45, 3.9, (t) => 1 - Math.pow(1 - t, 1.6));

const PlateWorld: React.FC<{B: number}> = ({B}) => {
  const grid = useMemo(plateGrid, []);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(PX1 - PX0, 2 * PZ);
    g.rotateX(-Math.PI / 2);
    g.translate((PX0 + PX1) / 2, PY, 0);
    return g;
  }, []);
  const fillT = ez(B, 1.97, 0.3);
  return (
    <group>
      <mesh geometry={geo} renderOrder={0}>
        <meshBasicMaterial color={INK} fog={false} />
      </mesh>
      <Ink positions={grid} color={FAINT} width={1} upto={ez(B, -1.2, 4, (t) => t)} renderOrder={1} />
      <Ruler ink={LINE} bg={INK} faint={FAINT} plot={plotOf(B)} fillPct={1.9} fillT={fillT} grid={false} />
    </group>
  );
};

// the hook, one left-aligned block broken by the ruler (shot A only)
const Hook: React.FC<{B: number}> = ({B}) => (
  <>
    <Plane at={[LEFT, 0, -5.95]} w={1500} h={270} px={0.01} orient="floor" tilt={0.25} anchor="bl">
      <div style={{width: 1500, height: 270, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', fontFamily: SERIF, color: LINE, lineHeight: 1.08}}>
        <Rise B={B} at={0.3} dy={40}><div style={{fontSize: 115}}>Nov 2024.</div></Rise>
        <WordsIn B={B} at={0.95} text="The best AI could solve" stagger={0.08} style={{fontSize: 115}} />
      </div>
    </Plane>
    <Plane at={[LEFT, 0, -1.22]} w={1400} h={330} px={0.01} orient="floor" tilt={0.18} anchor="bl">
      <div style={{width: 1400, height: 330, display: 'flex', alignItems: 'baseline', fontFamily: SERIF, color: LINE, whiteSpace: 'nowrap', lineHeight: 0.86, paddingTop: 10}}>
        <WordsIn B={B} at={1.55} text="under" dy={30} style={{fontSize: 115, marginRight: 34}} />
        <Stamp B={B} at={2} from={1.25} dur={0.45} origin="0% 100%" style={{fontSize: 380}}>2%</Stamp>
        <span style={{fontFamily: MONO, fontSize: 38, color: DIM, marginLeft: 30, opacity: ez(B, 2.6, 0.5)}}>Epoch AI · FrontierMath</span>
      </div>
    </Plane>
    <Plane at={[LEFT, 0, 1.4]} w={1500} h={80} px={0.01} orient="floor" tilt={0.3} anchor="tl">
      <Rise B={B} at={2.35} dy={-20} style={{fontFamily: SERIF, fontSize: 62, lineHeight: 1.15, color: LINE, whiteSpace: 'nowrap'}}>
        of research-level math problems.
      </Rise>
    </Plane>
  </>
);

const PrologueText: React.FC<{B: number}> = ({B}) => (
  <>
    {B < CUT_RUN ? <Hook B={B} /> : null}
    {/* road markings for the run: every 10 % up to 100, reading forward */}
    {Array.from({length: 9}, (_, i) => (i + 2) * 10).map((p) => (
      <Plane key={p} at={[X(p), 0, 1.15]} w={200} h={60} px={0.01} orient="floor" yaw={-Math.PI / 2} anchor="cl" opacity={ez(B, -0.45 + 3.9 * (1 - Math.pow(1 - p / 100, 1 / 1.6)), 0.4)}>
        <div style={{fontFamily: MONO, fontSize: 44, color: LINE, whiteSpace: 'nowrap'}}>{p}%</div>
      </Plane>
    ))}
    {/* past the 100 % mark, standing up toward the runner */}
    <Plane at={[X(100) + 5.4, 0, 0]} w={1150} h={290} px={0.012} orient="floor" yaw={-Math.PI / 2} tilt={0.85} anchor="bc">
      <div style={{width: 1150, height: 290, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 118, lineHeight: 1.08, color: LINE, whiteSpace: 'nowrap'}}>
        <WordsIn B={B} at={6.0} text="everything else:" stagger={0.08} dy={24} />
        <WordsIn B={B} at={6.25} text="out of reach." stagger={0.08} dy={24} />
      </div>
    </Plane>
  </>
);

export const prologue: Station = {
  id: 'prologue',
  from: 0,
  to: CUT_DROP,
  cam: prologueCam,
  World: PlateWorld,
  Text: PrologueText,
  mount: [2, 0], // gone on the drop's cut
  bg: prologueBg,
  fog: prologueFog,
  hits: [8],
};
