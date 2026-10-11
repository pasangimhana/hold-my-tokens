// Gallery layout numbers (owner B): pure data, shared by Results.tsx, the
// camera shots and the close (Outro). Figure k stands at x = 206 + 18k, z = 0;
// index 0 is the opener (no figure). The words are flat 2D type in a left
// column (lib-card2d); `type` scales that card's title / verdict.
export type Lay = {
  shift: number; // object-local beat offset so its decisive stroke lands on the kick
  lift: number; // group height (floating figures)
  yaw?: number; // extra turn of the whole figure (the close's plate)
  gyaw?: number; // the turn in its gallery shot, if different
  scale?: number; // uniform scale of the figure (ink widths are in px, unaffected)
  shadow?: [number, number, number]; // w, d, opacity
  bound: {r: number; y0: number; y1: number; rz?: number}; // rough bounding cylinder / ellipse (the Outro plate sizes from it)
  type?: {title?: number; verdict?: number}; // 2D card: px overrides (default T2.title / T2.verdict)
};

export const LAYOUT: Lay[] = [
  // 0: the opener line
  {shift: 0, lift: 0, bound: {r: 0.5, y0: 0, y1: 0.5}},
  // 157 K7
  {shift: 0.95, lift: 3.0, scale: 1.75, shadow: [6.4, 6.4, 0.3], bound: {r: 3.0, y0: 0.2, y1: 5.9}},
  // 158 hexagons (7-colouring) + Moser spindle
  {shift: 0, lift: 0, scale: 1.0, bound: {r: 5.4, y0: 0, y1: 1.1}},
  // 159 primes (PrimesB), the progression labelled on the page
  {shift: 0.8, lift: 0, yaw: 0.45, gyaw: -1.0, scale: 1.05, bound: {r: 4.9, rz: 2.5, y0: 0, y1: 3.35}},
  // 028 Gaussian moat (GaussB)
  {shift: 0, lift: 0, scale: 1.3, bound: {r: 5.2, y0: 0, y1: 0.5}},
  // 074 Kakeya
  {shift: 1.0, lift: 1.55, scale: 1.4, shadow: [6.2, 6.2, 0.2], bound: {r: 2.7, y0: 0, y1: 3.7}, type: {verdict: 112}},
  // 287 Cayley tree of F3
  {shift: 0, lift: 3.2, scale: 1.2, shadow: [6.6, 6.6, 0.22], bound: {r: 2.9, y0: 0.4, y1: 6.0}},
  // 032 torus (Hodge)
  {shift: 0.6, lift: 2.6, scale: 1.3, shadow: [6.6, 5.4, 0.26], bound: {r: 2.7, y0: 0.6, y1: 4.6}},
];
