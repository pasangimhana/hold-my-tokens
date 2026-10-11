// Flat 2D type for the verdict cards. Render these from a station's `Screen` layer:
// frame pixels (1920×1080), drawn above the 3D world, inside the hit punch/shake.
// One shared look for Riemann and the gallery: a column of type beside the 3D
// figure, which owns the other ~60 % of the frame. The column ALTERNATES sides
// from shot to shot: side="left"
// is flush-left at x, side="right" is flush-right at 1920 − x.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SERIF} from '../core/fonts';
import {INK, INK2, LEAN_GREEN, Check} from '../style';
import {clamp01, lerp, seg, expoOut, cubicInOut} from '../core/anim';

export const ez2 = (B: number, at: number, dur: number, f: (t: number) => number = expoOut) => f(seg(B, at, dur));

// sizes in frame px (readable at 360p previews too)
export const T2 = {x: 140, w: 820, tag: 40, title: 78, counter: 50, verdict: 210, line: 56, mark: 46};

export type Side = 'left' | 'right';
const SideCtx = React.createContext<Side>('left');
// alternate per shot: even index left, odd right (or pass side explicitly)
export const sideOf = (i: number): Side => (i % 2 === 0 ? 'left' : 'right');

// the column; `y` is the frame-px line the block is centred on (or hangs from / stands on)
export const Column: React.FC<{y?: number; x?: number; w?: number; side?: Side; align?: 'center' | 'top' | 'bottom'; opacity?: number; color?: string; children: React.ReactNode}> = ({
  y = 540, x = T2.x, w = T2.w, side = 'left', align = 'center', opacity = 1, color = INK, children,
}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute', top: y, width: w, color, fontFamily: SERIF, opacity,
        ...(side === 'left' ? {left: x} : {right: x}),
        display: 'flex', flexDirection: 'column', alignItems: side === 'left' ? 'flex-start' : 'flex-end', textAlign: side,
        transform: align === 'center' ? 'translateY(-50%)' : align === 'bottom' ? 'translateY(-100%)' : undefined,
      }}
    >
      <SideCtx.Provider value={side}>{children}</SideCtx.Provider>
    </div>
  </AbsoluteFill>
);
export const useSide = () => React.useContext(SideCtx);

// a line that rises in (fade + short slide)
export const Rise: React.FC<{B: number; at: number; dur?: number; dy?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({B, at, dur = 0.35, dy = 22, style, children}) => {
  const t = ez2(B, at, dur);
  return <div style={{opacity: clamp01(t * 1.6), transform: `translateY(${(1 - t) * dy}px)`, whiteSpace: 'nowrap', ...style}}>{children}</div>;
};

// the verdict: appears ON its kick (no fade-up before it) and slams from 1.25×. willChange keeps it on
// one composited raster, so it doesn't visibly snap/re-hint when the scale reaches exactly 1
export const Slam: React.FC<{B: number; at: number; size?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({B, at, size = T2.verdict, style, children}) => {
  const side = useSide();
  const on = B >= at - 0.02 ? 1 : 0;
  const t = cubicInOut(clamp01((B - at) / 0.2));
  return (
    <div style={{fontSize: size, lineHeight: 0.98, letterSpacing: '-0.01em', whiteSpace: 'nowrap', opacity: on, transform: `scale(${lerp(1.25, 1, t)})`, transformOrigin: side === 'left' ? '0% 70%' : '100% 70%', willChange: 'transform', ...style}}>
      {children}
    </div>
  );
};

// ✓ Lean (green) or "paper"
export const Mark: React.FC<{B: number; at: number; lean: boolean; size?: number}> = ({B, at, lean, size = T2.mark}) => {
  const side = useSide();
  const t = ez2(B, at, 0.5);
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: side === 'left' ? 'flex-start' : 'flex-end', gap: size * 0.3, height: size * 1.4, fontSize: size, opacity: clamp01(t * 2.5)}}>
      {lean ? (
        <>
          <Check t={t} size={size * 1.05} color={LEAN_GREEN} width={3} />
          <span style={{color: LEAN_GREEN}}>Lean</span>
        </>
      ) : (
        <span style={{fontStyle: 'italic', color: INK2}}>paper</span>
      )}
    </div>
  );
};

// typed in character by character while the figure draws. The untyped rest is laid out but invisible, so nothing reflows (flush-right
// columns don't jump); a thin caret rides the head while typing. `lines` share one typing run, each
// line getting time in proportion to its length.
export const TypeLines: React.FC<{B: number; at: number; dur: number; lines: string[]; style?: React.CSSProperties; lineStyle?: React.CSSProperties}> = ({B, at, dur, lines, style, lineStyle}) => {
  const total = lines.reduce((a, l) => a + l.length, 0) || 1;
  const typed = Math.floor(total * clamp01((B - at) / dur) + 1e-6);
  const typing = B >= at && typed < total;
  let start = 0;
  return (
    <div style={style}>
      {lines.map((l, i) => {
        const n = Math.max(0, Math.min(l.length, typed - start));
        // the caret sits on the line being typed (or at the start of the next one between lines)
        const caret = typing && typed >= start && typed < start + l.length + (i === lines.length - 1 ? 1 : 0) && (n < l.length || i === lines.length - 1);
        start += l.length;
        return (
          <div key={i} style={{whiteSpace: 'nowrap', ...lineStyle}}>
            <span>{l.slice(0, n)}</span>
            {caret ? <span style={{display: 'inline-block', width: 0, height: '0.92em', borderLeft: '0.055em solid currentColor', verticalAlign: '-0.12em', marginRight: '-0.055em'}} /> : null}
            <span style={{opacity: 0}}>{l.slice(n)}</span>
          </div>
        );
      })}
    </div>
  );
};
