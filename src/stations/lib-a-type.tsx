// Owner A: small type-motion helpers (pure functions of the global beat).
import React from 'react';
import {clamp01, expoOut, seg} from '../core/anim';

export const ez = (B: number, at: number, dur: number, f: (t: number) => number = expoOut) => f(seg(B, at, dur));
export const fmtN = (n: number) => Math.round(n).toLocaleString('en-US');

// set in: opacity + slide (plane px), eased out
export const Rise: React.FC<{B: number; at: number; dur?: number; dy?: number; dx?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  B, at, dur = 0.6, dy = 30, dx = 0, children, style,
}) => {
  const t = ez(B, at, dur);
  return (
    <div style={{opacity: clamp01(t * 1.6), transform: `translate(${(1 - t) * dx}px, ${(1 - t) * dy}px)`, ...style}}>{children}</div>
  );
};

// a stamp: appears ON the beat, oversized, and settles fast
export const Stamp: React.FC<{B: number; at: number; from?: number; dur?: number; origin?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({
  B, at, from = 1.18, dur = 0.4, origin = '0% 100%', children, style,
}) => {
  if (B < at) return <div style={{opacity: 0, ...style}}>{children}</div>;
  const t = ez(B, at, dur);
  const s = from + (1 - from) * t;
  return (
    <div style={{opacity: clamp01((B - at) / 0.04), transform: `scale(${s})`, transformOrigin: origin, ...style}}>{children}</div>
  );
};

// words set one by one (no markup)
export const WordsIn: React.FC<{B: number; at: number; text: string; stagger?: number; dur?: number; dy?: number; style?: React.CSSProperties}> = ({
  B, at, text, stagger = 0.06, dur = 0.55, dy = 24, style,
}) => {
  const w = text.split(' ');
  return (
    <div style={style}>
      {w.map((s, i) => {
        const t = ez(B, at + i * stagger, dur);
        return (
          <React.Fragment key={i}>
            <span style={{display: 'inline-block', opacity: clamp01(t * 1.5), transform: `translateY(${(1 - t) * dy}px)`}}>{s}</span>
            {i < w.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </div>
  );
};
