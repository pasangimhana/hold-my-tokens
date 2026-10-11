// World map (paper ground at y = 0). The camera travels mostly toward +x.
// Each station owns a strip of the page; keep content inside your strip.
export const AT = {
  prologue: {x0: -10, x1: 50}, // black plate; FrontierMath ruler x 0..40 on z = 0
  flood: {x0: 56, x1: 102}, // index pages lying on the paper
  stacks: {x0: 106, x1: 130}, // 27 day-stacks
  numbers: {x0: 134, x1: 150}, // 372 / ≈4,000 / ≈3 h printed on the page
  lean: {x0: 152, x1: 162}, // the Lean slip
  zeta: {x0: 164, x1: 192}, // ζ landscape (rotate so t runs along +x)
  results: {x0: 196, x1: 362}, // 8 objects, GAP 22, first at 206
  fluid: {x0: 366, x1: 404}, // black pool + flow box
  timeline: {x0: 408, x1: 490}, // rail + METR chart (x = 410 + (t-2019)*8)
  future: {x0: 494, x1: 560}, // planes above the chart; FM ruler; family grid
  outro: {x0: 560, x1: 600},
};
