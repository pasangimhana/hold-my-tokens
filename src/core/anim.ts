// Pure timing helpers. Everything on screen must be a function of the frame.
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {B} from './timing';

export const useBeat = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / (B * fps);
};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (beat: number, start: number, dur: number) => clamp01((beat - start) / dur);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix3 = (a: number[], b: number[], t: number): [number, number, number] => [
  lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const expoIn = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
export const expoInOut = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
export const cubicInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const quartOut = (t: number) => 1 - Math.pow(1 - t, 4);
export const backOut = (t: number, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
// 1 on every kick, decaying until the next one.
export const kick = (beat: number, decay = 5) => (beat < 0 ? 0 : Math.exp(-decay * (beat - Math.floor(beat))));
// deterministic PRNG (mulberry32)
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// smooth 1D value noise, deterministic
export const noise1 = (x: number, seed = 1) => {
  const i = Math.floor(x), f = x - i;
  const h = (n: number) => rng(n * 374761393 + seed * 668265263)();
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
};
