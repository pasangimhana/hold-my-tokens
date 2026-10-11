// Owner B: the words of the gallery cards (revision 5). Every figure k
// (index into RESULTS / LAYOUT; π, k = 0, is not shown) gets:
//   tag      who and when it was asked        (only from facts-years.md)
//   counter  rolls up to "N years open"        (lands on the figure's kick)
//   subject  what was asked
//   verdict  BIG, one word or a few           (on the next kick)
//   line     one short line of copy (no maths: nobody reads the equations)
// then the ✓ Lean / paper mark.
//
// TAGS / YEARS: only the "safe on-screen tags" of
// openai-math-launch/facts-years.md (fact-check of 2026-10-09). No year is
// shown where none is defensible; no counter where it would be fake precision.
export type Fact = {tag: string; open?: number; approx?: boolean} | null;
export type Card = {k: number; subject: string[]; verdict: string[]; verdictTail?: string; line: string};

export const CARDS: Card[] = [
  {k: 1, subject: ['Hadwiger’s conjecture'], verdict: ['False.'], line: 'One counterexample. Done.'},
  {k: 2, subject: ['Can the plane be', 'colored with 5 colors?'], verdict: ['No.'], line: 'Now it’s 6 or 7.'},
  {k: 3, subject: ['Erdős’s $5,000 problem'], verdict: ['Solved.'], line: 'Erdős put money on this one.'},
  {k: 4, subject: ['Can you walk to infinity', 'on Gaussian primes?'], verdict: ['No.'], line: 'There’s always a moat.'},
  {k: 5, subject: ['The Kakeya conjecture'], verdict: ['Settled in', 'four dimensions.'], line: 'Three dimensions only fell in 2025.'},
  {k: 6, subject: ['The free group factors', 'are isomorphic'], verdict: ['Proved.'], line: 'They were the same all along.'},
  // never "proved the Hodge conjecture": the claim is the CM case only
  {k: 7, subject: ['The Hodge conjecture', 'for CM abelian varieties'], verdict: ['Proved.'], line: 'A piece of a $1,000,000 problem.'},
];

// facts-years.md, "Safe on-screen tags"
export const FACTS: Record<number, Fact> = {
  1: {tag: '1943 · Hugo Hadwiger', open: 83}, // posed 1943 · Hadwiger (CONFIRMED)
  2: {tag: '1950 · Edward Nelson', open: 76}, // posed 1950 · Nelson
  3: null, // Erdős AP: no defensible posing year; the $5,000 is the hook
  4: {tag: '1962 · Basil Gordon', open: 64}, // posed 1962 · Gordon (CONFIRMED)
  5: {tag: '1917 · Sōichi Kakeya’s needle problem'}, // needle problem 1917; the 4D question has no year: no counter
  6: {tag: 'the 1960s · Richard Kadison', open: 60, approx: true}, // "open since the 1960s · Kadison"
  7: {tag: '1950 · W. V. D. Hodge', open: 76}, // posed 1950 · Hodge (CONFIRMED)
};
export const factOf = (k: number): Fact => FACTS[k] ?? null;

// V · FLUIDS: "equations 1822–1845 · Navier, Stokes" (never 1822 alone)
export const FLUID_TAG = '1822–1845 · Navier, Stokes';
