// Film time F (music beats, 1 = one kick) -> story time B (the beat the
// stations were authored in). Each section runs at its own stretch s (F beats
// per story beat); s = 2 means half speed. Monotone cubic through a knot at
// every integer B: smooth (C1) speed changes, and every hit authored on an
// integer B lands on a kick (s = 2) or on a kick/8th (s = 1.5).
// The song is played from 0:00: its 4-bar intro + pickup is 17 kicks, so the
// film opens with a 1-kick lead-in (story B -0.5..0) and the prologue runs at
// half speed: the drop B 8 -> F 17. Riemann runs at 1.5 (12 kicks, no reading
// holds any more), so every cut after it sits one bar earlier than before.
export const LEAD_F = 1;
const LEAD_S = 2;
const SECTIONS: [number, number, number][] = [
  // [B0, B1, s]
  [0, 8, 2], // prologue (the drop B 8 -> F 17)
  [8, 24, 1.5], // release
  [24, 32, 1.5], // zeta (HIT B 30 -> F 50)
  [32, 48, 3], // results: 6 kicks per figure (name readable ~2 s before the verdict slam)
  [48, 56, 1.5], // fluid (HIT B 54)
  [56, 96, 1.5], // VI · VII bookend (B 74.667–82.667) · VIII close (∎ B 88)
];

// Fritsch–Carlson monotone cubic B(F) through a knot at every integer B
const build = (sections: [number, number, number][], leadF: number, leadS: number) => {
  const KB: number[] = [leadF > 0 ? -leadF / leadS : 0];
  const KF: number[] = [0];
  let f = leadF;
  if (leadF > 0) {
    KB.push(0);
    KF.push(f);
  }
  for (const [b0, b1, s] of sections)
    for (let b = b0 + 1; b <= b1; b++) {
      f += s;
      KB.push(b);
      KF.push(f);
    }
  const n = KF.length;
  const total = KF[n - 1];
  const d = Array.from({length: n - 1}, (_, i) => (KB[i + 1] - KB[i]) / (KF[i + 1] - KF[i]));
  const m = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] + d[i]) / 2;
  const seek = (xs: number[], x: number) => {
    let lo = 0, hi = xs.length - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  const toB = (F: number) => {
    if (F <= 0) return KB[0] + F * d[0];
    if (F >= total) return KB[n - 1] + (F - total) * d[n - 2];
    const i = seek(KF, F);
    const h = KF[i + 1] - KF[i], s = (F - KF[i]) / h;
    const s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * KB[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * KB[i + 1] + (s3 - s2) * h * m[i + 1];
  };
  return {toB, total};
};

const W0 = build(SECTIONS, LEAD_F, LEAD_S);
export const F_TOTAL = W0.total; // 173
export const toB = W0.toB;

// the grid scripts/cues-film.mjs is still authored on (before 2026-10-11): no
// lead-in, prologue 1.5, zeta 2; scripts/cues-warp.ts maps it via legacyToB.
export const legacyToB = build(
  [[0, 8, 1.5], [8, 24, 1.5], [24, 32, 2], [32, 48, 2], [48, 56, 1.5], [56, 96, 1.5]],
  0,
  1,
).toB;

// inverse (for sound cues): bisection on the monotone forward map
export const toF = (B: number) => {
  let lo = -10, hi = F_TOTAL + 20;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (toB(mid) < B) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
