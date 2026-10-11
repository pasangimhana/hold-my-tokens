// PAPER ("Annals") style kit: palette, page furniture, type components,
// deterministic reveals and page transitions. Everything is a pure function of
// the beat passed in.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useBeat, clamp01, expoOut, cubicInOut, seg, lerp, rng} from './core/anim';
import {SERIF, MONO, CAPS} from './core/fonts';

// ------------------------------------------------------------------ palette
export const PAPER = '#F4F1EA';
export const INK = '#141414';
export const INK2 = '#5E5B55';
export const RULE = '#CFC9BC';
export const DESK = '#E7E3D9'; // paper in shade (under pages)
export const INK_SOFT = '#2A2926'; // ink in shade (inverted plates)
export const LEAN_GREEN = '#16924F'; // the one accent: machine-checked (Lean) marks only

// ------------------------------------------------------------------ pre-roll
// Film renders each section a little early so the incoming page can slide over
// the outgoing one. Sections read their local beat with useB(): negative during
// the pre-roll, 0 exactly on the section's first kick.
export const PreRoll = React.createContext(0);
export const useB = () => useBeat() - React.useContext(PreRoll);

// ------------------------------------------------------------------ helpers
export const ease = (b: number, at: number, dur: number, f = expoOut) => f(seg(b, at, dur));
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
export const quintOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 5);
export const sineInOut = (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
export const M = 120; // page margin (px)

// ------------------------------------------------------------------ type
export const Caps: React.FC<{children: React.ReactNode; size?: number; ls?: number; color?: string; style?: React.CSSProperties}> = ({
  children, size = 22, ls = 0.16, color, style,
}) => (
  <span style={{fontFamily: CAPS, fontSize: size, letterSpacing: `${ls}em`, color, whiteSpace: 'nowrap', ...style}}>{children}</span>
);

export const Mono: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 20, color, style}) => (
  <span style={{fontFamily: MONO, fontSize: size, color, ...style}}>{children}</span>
);

// Reveal: fade + rise, eased. Purely from the beat.
export const Reveal: React.FC<{
  b: number; at: number; dur?: number; dy?: number; dx?: number; out?: number; outDur?: number;
  children: React.ReactNode; style?: React.CSSProperties; blur?: boolean;
}> = ({b, at, dur = 0.7, dy = 22, dx = 0, out, outDur = 0.4, children, style, blur = false}) => {
  const t = ease(b, at, dur);
  const o = out !== undefined ? 1 - ease(b, out, outDur, cubicInOut) : 1;
  const a = t * o;
  if (a <= 0.001) return <div style={{...style, opacity: 0}}>{children}</div>;
  return (
    <div
      style={{
        ...style,
        opacity: a,
        transform: `translate(${dx * (1 - t)}px, ${dy * (1 - t) - (out !== undefined ? 10 * (1 - o) : 0)}px)`,
        filter: blur && t < 0.999 ? `blur(${(1 - t) * 6}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

// Words set in one by one (staggered). Markup: *italic*, **bold**.
type Part = {s: string; it: boolean; bf: boolean};
const tokenize = (text: string): Part[][] => {
  const segs: Part[] = [];
  text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).forEach((p) => {
    if (!p) return;
    if (p.startsWith('**')) segs.push({s: p.slice(2, -2), it: false, bf: true});
    else if (p.startsWith('*')) segs.push({s: p.slice(1, -1), it: true, bf: false});
    else segs.push({s: p, it: false, bf: false});
  });
  const words: Part[][] = [];
  let cur: Part[] = [];
  for (const sg of segs) {
    sg.s.split(' ').forEach((pc, k) => {
      if (k > 0 && cur.length) {
        words.push(cur);
        cur = [];
      }
      if (pc) cur.push({...sg, s: pc});
    });
  }
  if (cur.length) words.push(cur);
  return words;
};

export const Words: React.FC<{
  text: string; b: number; at: number; stagger?: number; dur?: number; dy?: number;
  style?: React.CSSProperties; out?: number;
}> = ({text, b, at, stagger = 0.05, dur = 0.7, dy = 26, style, out}) => {
  const words = React.useMemo(() => tokenize(text), [text]);
  const o = out !== undefined ? 1 - ease(b, out, 0.4, cubicInOut) : 1;
  return (
    <div style={style}>
      {words.map((w, i) => {
        const e = ease(b, at + i * stagger, dur);
        return (
          <React.Fragment key={i}>
            <span style={{display: 'inline-block', opacity: e * o, transform: `translateY(${(1 - e) * dy}px)`}}>
              {w.map((p, k) => (
                <span key={k} style={{fontStyle: p.it ? 'italic' : undefined, fontWeight: p.bf ? 700 : undefined}}>{p.s}</span>
              ))}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Typewriter (mono listings). cps = characters per beat.
export const typedCount = (b: number, at: number, cps: number, len: number) => Math.max(0, Math.min(len, Math.floor((b - at) * cps)));

// ------------------------------------------------------------------ rules
export const Rule: React.FC<{
  b: number; at: number; dur?: number; x: number; y: number; w: number; color?: string; thick?: number; from?: 'left' | 'right' | 'center'; vertical?: boolean; opacity?: number;
}> = ({b, at, dur = 0.8, x, y, w, color = INK, thick = 1, from = 'left', vertical = false, opacity = 1}) => {
  const t = ease(b, at, dur, cubicInOut);
  if (t <= 0) return null;
  const len = w * t;
  const off = from === 'left' ? 0 : from === 'right' ? w - len : (w - len) / 2;
  return vertical ? (
    <div style={{position: 'absolute', left: x, top: y + off, width: thick, height: len, background: color, opacity}} />
  ) : (
    <div style={{position: 'absolute', left: x + off, top: y, width: len, height: thick, background: color, opacity}} />
  );
};

// ------------------------------------------------------------------ page furniture
export const RunningHead: React.FC<{page: number | string; inv?: boolean; b: number; left?: string; at?: number}> = ({
  page, inv = false, b, left = 'openai/math — selected results', at = -10,
}) => {
  const col = inv ? '#B9B4A8' : INK2;
  const t = ease(b, at, 0.8);
  return (
    <>
      <div style={{position: 'absolute', left: M, right: M, top: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: t}}>
        <Caps size={19} ls={0.2} color={col}>{left}</Caps>
        <span style={{fontFamily: SERIF, fontSize: 22, color: col}}>{page}</span>
      </div>
      <Rule b={b} at={at} dur={0.9} x={M} y={80} w={1440 - 2 * M} color={inv ? '#4A4843' : INK} thick={1} />
    </>
  );
};

export const Eyebrow: React.FC<{children: React.ReactNode; b: number; at: number; inv?: boolean; style?: React.CSSProperties; out?: number}> = ({
  children, b, at, inv = false, style, out,
}) => {
  const t = ease(b, at, 0.8);
  const o = out !== undefined ? 1 - ease(b, out, 0.4) : 1;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: t * o, ...style}}>
      <div style={{width: 46 * t, height: 1, background: inv ? PAPER : INK}} />
      <Caps size={22} ls={0.2} color={inv ? '#D8D3C7' : INK} style={{transform: `translateX(${(1 - t) * 14}px)`}}>
        {children}
      </Caps>
    </div>
  );
};

export const FigCaption: React.FC<{n: string; children: React.ReactNode; inv?: boolean; style?: React.CSSProperties; label?: string}> = ({n, children, inv, style, label}) => (
  <div style={{fontFamily: SERIF, fontSize: 20, lineHeight: 1.4, color: inv ? '#CFC9BC' : INK2, ...style}}>
    <Caps size={20} ls={0.08} color={inv ? PAPER : INK}>{label ?? `Fig. ${n}.`}</Caps>
    {' '}
    {children}
  </div>
);

export const Footnote: React.FC<{mark: string; children: React.ReactNode; inv?: boolean; style?: React.CSSProperties; b: number; at: number}> = ({
  mark, children, inv, style, b, at,
}) => {
  const t = ease(b, at, 0.8);
  return (
    <div style={{position: 'absolute', left: M, bottom: 54, opacity: t, ...style}}>
      <div style={{width: 200 * t, height: 1, background: inv ? '#6A665E' : INK2, marginBottom: 10}} />
      <div style={{fontFamily: SERIF, fontSize: 19, color: inv ? '#BDB8AC' : INK2, lineHeight: 1.35}}>
        <sup style={{fontSize: 13, marginRight: 4}}>{mark}</sup>
        {children}
      </div>
    </div>
  );
};

export const Sup: React.FC<{children: React.ReactNode}> = ({children}) => (
  <sup style={{fontSize: '0.5em', verticalAlign: '0.9em', lineHeight: 0, marginLeft: '0.08em', fontStyle: 'normal'}}>{children}</sup>
);

// "Theorem 1 (No. 003)." bold upright label + italic statement
export const Theorem: React.FC<{label: string; children: React.ReactNode; size?: number; style?: React.CSSProperties; color?: string}> = ({
  label, children, size = 34, style, color = INK,
}) => (
  <div style={{fontFamily: SERIF, fontSize: size, lineHeight: 1.32, color, ...style}}>
    <span style={{fontWeight: 700, fontStyle: 'normal'}}>{label}</span>
    {' '}
    <span style={{fontStyle: 'italic'}}>{children}</span>
  </div>
);

// Hand-plotted check mark (stroke draws in).
export const Check: React.FC<{t: number; size?: number; color?: string; width?: number}> = ({t, size = 28, color = INK, width = 2.2}) => {
  const L = 40;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'inline-block', verticalAlign: '-0.12em', overflow: 'visible'}}>
      <path d="M3 13 L9.5 19 L21 4.5" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={L} strokeDashoffset={L * (1 - clamp01(t))} />
    </svg>
  );
};

// Status line: "Lean ✓ formalized" or "Paper · awaiting formalization".
export const Status: React.FC<{lean: boolean; t: number; inv?: boolean; size?: number}> = ({lean, t, inv, size = 22}) => {
  const col = inv ? PAPER : INK;
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, border: `1px solid ${inv ? '#8C877C' : INK}`, padding: '7px 16px 6px 14px', opacity: clamp01(t * 3)}}>
      {lean ? <Check t={t} size={size + 2} color={col} /> : <span style={{fontFamily: SERIF, fontSize: size + 4, color: col, lineHeight: 1}}>§</span>}
      <Caps size={size} ls={0.14} color={col}>{lean ? 'formalized in lean' : 'paper only · not yet in lean'}</Caps>
    </div>
  );
};

// ------------------------------------------------------------------ pages and transitions
export const Page: React.FC<{bg?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({bg = PAPER, children, style}) => (
  <AbsoluteFill style={{background: bg, overflow: 'hidden', ...style}}>{children}</AbsoluteFill>
);

// Entry transition, driven by negative local beats (pre-roll). The new page
// slides over the old one at a slight 3D angle, casting a shadow on it.
export type EnterKind = 'slide' | 'lift' | 'wipe' | 'cut';
export const Enter: React.FC<{b: number; pre: number; kind?: EnterKind; children: React.ReactNode; bg?: string}> = ({
  b, pre, kind = 'slide', children, bg = PAPER,
}) => {
  if (b >= 0 || kind === 'cut') return <AbsoluteFill>{children}</AbsoluteFill>;
  const t = clamp01((b + pre) / pre); // 0 -> 1 over the pre-roll
  if (kind === 'wipe') {
    const e = cubicInOut(t);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `inset(${(1 - e) * 100}% 0 0 0)`}}>{children}</AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: `${(1 - e) * 100}%`, height: 2, background: bg === PAPER ? INK : PAPER, opacity: 1 - e}} />
      </AbsoluteFill>
    );
  }
  const e = cubicInOut(t);
  const shade = (1 - e) * 0.28 + e * 0.0;
  if (kind === 'lift') {
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{background: `rgba(10,10,10,${shade})`}} />
        <AbsoluteFill style={{perspective: 1800, perspectiveOrigin: '50% 0%'}}>
          <AbsoluteFill style={{transform: `translateY(${(1 - e) * 1100}px) rotateX(${(1 - e) * 10}deg)`, transformOrigin: '50% 0%', boxShadow: '0 -30px 80px rgba(0,0,0,0.25)'}}>
            {children}
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // slide from the right, hinged slightly in 3D
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(10,10,10,${shade})`}} />
      <AbsoluteFill style={{perspective: 2200, perspectiveOrigin: '0% 50%'}}>
        <AbsoluteFill
          style={{
            transform: `translateX(${(1 - e) * 1500}px) rotateY(${-(1 - e) * 14}deg)`,
            transformOrigin: '0% 50%',
            boxShadow: '-40px 0 90px rgba(0,0,0,0.28)',
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Sub-scene switch within a section: content slides off left while the next
// slides in. Returns [opacity, translateX] for a scene active over [a, z).
export const sceneT = (b: number, a: number, z: number, inDur = 0.45, outDur = 0.45) => {
  const i = a <= -50 ? 1 : ease(b, a - inDur, inDur, cubicInOut);
  const o = 1 - ease(b, z - outDur, outDur, cubicInOut);
  return {on: b >= a - inDur && b < z, i, o};
};

// ------------------------------------------------------------------ paper grain
let GRAIN: string | null = null;
export const grainURL = () => {
  if (GRAIN !== null) return GRAIN;
  if (typeof document === 'undefined') return '';
  const w = 960, h = 540;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const r = rng(1729);
  for (let i = 0; i < w * h; i++) {
    const v = 255 - Math.pow(r(), 3) * 46 - r() * 10;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v - 2;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // fibres: short soft curves
  const f = rng(31415);
  for (let k = 0; k < 1400; k++) {
    const x = f() * w, y = f() * h, a = f() * Math.PI * 2, len = 6 + f() * 22;
    ctx.strokeStyle = f() < 0.6 ? `rgba(120,110,95,${0.05 + f() * 0.07})` : `rgba(255,255,255,${0.12 + f() * 0.1})`;
    ctx.lineWidth = 0.5 + f() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.6) * len * 0.5, y + Math.sin(a + 0.6) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  GRAIN = c.toDataURL('image/png');
  return GRAIN;
};

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.55}) => (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${grainURL()})`,
      backgroundSize: '1920px 1080px',
      mixBlendMode: 'multiply',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

export {seg, lerp, clamp01, expoOut, cubicInOut};

export const usePre = () => React.useContext(PreRoll);

// Render children only while b is in [a, z).
export const Win: React.FC<{b: number; a: number; z: number; children: React.ReactNode}> = ({b, a, z, children}) =>
  b >= a && b < z ? <>{children}</> : null;

// Sub-scene inside a section: mounted from (at - pre), entering with a page transition.
export const Sub: React.FC<{b: number; at: number; until: number; kind?: EnterKind; pre?: number; bg?: string; children: (lb: number) => React.ReactNode}> = ({
  b, at, until, kind = 'slide', pre = 0.45, bg, children,
}) =>
  b >= at - pre && b < until ? (
    <Enter b={b - at} pre={pre} kind={kind} bg={bg}>
      {children(b - at)}
    </Enter>
  ) : null;

// piecewise keyframe interpolation with an ease per segment (stop-and-go camera)
export const keys = (b: number, k: [number, number][], f: (t: number) => number = sineInOut) => {
  if (b <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [b0, v0] = k[i], [b1, v1] = k[i + 1];
    if (b <= b1) return lerp(v0, v1, f((b - b0) / (b1 - b0)));
  }
  return k[k.length - 1][1];
};
