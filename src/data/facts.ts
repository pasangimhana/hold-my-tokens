// Every on-screen claim must come from here (fact-checked; see FACTS.md).
// You may shorten/rephrase for layout but never strengthen a claim or add numbers.
export const RELEASE = {
  date: 'Oct 6, 2026',
  manuscripts: 719, // README (catalogue updated Oct 8 2026; 722 at the Oct 6 release, 3 withdrawn)
  families: 372,
  leanFamilies: 242, // families with a Lean formalization (lean/docs has 242 entries, Oct 8 2026)
  problemsPosed: '~4,000', // "approximately 4,000 problems"
  hoursPerResult: '~3 h', // "on average ... three hours of ChatGPT Pro thinking compute"
  model: 'an unreleased internal OpenAI model',
  window: 'Sep 10 – Oct 7, 2026', // preprint dates; under four weeks
  peakDay: {date: 'Sep 24', count: 188},
  repo: 'github.com/openai/math',
  readmeCaveat: 'Some of the unformalized results could have issues.',
  next: ['more Lean formalizations as they are obtained', 'corrections recorded as new versions', 'community-hosted repositories being explored'],
};

// The real Lean challenge statement for family 003 (lean/ComparatorChallenges/QuasiRiemannHypothesis.lean)
export const LEAN_003 = `theorem riemannZeta_ne_zero_of_seven_eighths_lt_re
    {s : ℂ} (hs : (7 / 8 : ℝ) < s.re) :
    riemannZeta s ≠ 0`;

export const ZETA = {
  num: '003',
  title: 'The quasi-Riemann hypothesis',
  statement: 'Every Dirichlet L-function, including ζ(s), is zero-free in Re s > 7/8.',
  tex: String.raw`\zeta(s)\neq 0\quad\text{for}\quad \operatorname{Re}(s)>\tfrac{7}{8}`,
  lean: true,
  context: ['The Riemann hypothesis would put this line at ½.', 'Before: no fixed bound below 1 was known.'],
  // never say or imply RH is proven
};

export type Result = {num: string; field: string; title: string; sub?: string; tex: string; lean: boolean; counterexample?: boolean};
export const RESULTS: Result[] = [
  {num: '017', field: 'Number theory', title: 'The irrationality exponent of π is 2', tex: String.raw`\left|\pi-\tfrac{p}{q}\right|\ \ge\ q^{-2-\varepsilon}`, lean: true},
  {num: '157', field: 'Graph theory', title: 'Hadwiger’s conjecture is false', sub: 'even for fractional coloring', tex: String.raw`\chi(G)\ \ge\ \chi_f(G)\ >\ h(G)`, lean: true, counterexample: true},
  {num: '158', field: 'Combinatorial geometry', title: 'The plane cannot be 5-colored', sub: 'only 6 or 7 remain possible', tex: String.raw`\chi(\mathbb{R}^2)\in\{6,7\}`, lean: true},
  {num: '159', field: 'Additive combinatorics', title: 'Erdős’s $5,000 problem, solved', sub: 'divergent reciprocal sums force arithmetic progressions', tex: String.raw`\sum_{a\in A}\tfrac1a=\infty\ \Longrightarrow\ a,\,a{+}d,\,\dots,\,a{+}(k{-}1)d\in A`, lean: true},
  {num: '028', field: 'Number theory', title: 'The Gaussian moat', sub: 'no walk to infinity through Gaussian primes with bounded steps', tex: String.raw`\text{steps}\le D\ \Longrightarrow\ \text{every component is finite}`, lean: true},
  {num: '074', field: 'Geometric measure theory', title: 'Kakeya in four dimensions', sub: 'a set with a unit segment in every direction has full dimension', tex: String.raw`K\subset\mathbb{R}^4\ \Rightarrow\ \dim_H K=4`, lean: false},
  {num: '287', field: 'Operator algebras', title: 'The free group factors are isomorphic', tex: String.raw`L(\mathbb{F}_2)\ \cong\ L(\mathbb{F}_3)`, lean: true},
  {num: '032', field: 'Algebraic geometry', title: 'The Hodge conjecture for CM abelian varieties', sub: 'a case of a Millennium Prize problem', tex: String.raw`H^{2p}(A,\mathbb{Q})\cap H^{p,p}(A)=\mathbb{Q}\langle\text{algebraic cycles}\rangle`, lean: false},
];

export const FLUID = {
  num: '376',
  title: 'Navier–Stokes flows that compute',
  statement: 'A Turing machine is compiled into the force f; a particle reaches the target exactly when the machine halts.',
  tex: String.raw`\partial_t u+(u\cdot\nabla)u=-\nabla p+\nu\,\Delta u+f,\qquad \nabla\cdot u=0`,
  lean: true,
  // the visual flow (e.g. ABC flow) is an illustration
};

export const BEFORE = {label: 'Nov 2024 · Epoch AI · FrontierMath', text: 'The best AI solved under 2% of FrontierMath’s research-level problems.', pct: '<2%'};
export const AFTER_FM = {text: 'Sep 2026 · GPT-6 Astra on FrontierMath Tier 4 (revised v2 set): 97.6%', caveat: 'launch set vs. Tier 4 of the revised v2 set · Epoch AI data'};

// V · NAVIER–STOKES: the Millennium problem + the run's scale. This is
// OpenAI's SEPARATE announcement (8 Sep 2026), not an openai/math family. Figures are OpenAI's own
// ("what OpenAI reports about the run"), relayed by Tufts Daily / cellcog / The Neuron; not audited.
// Scope: blow-up WITH a smooth external force (Clay alternatives C/D); the unforced case stays open.
// Clay recognises solutions only after publication + vetting; OpenAI: "We do not intend to claim the
// Millennium Prize". Disputed: Buckmaster–Alpöge priority; arXiv 2610.08144 questions Lean ↔ paper match.
// So: never "Solved."/"✓ Lean" here; say what it is (a claimed blow-up) and keep the qualifier visible.
export const NS_RUN = {
  problem: 'A Millennium Prize problem.', // Clay, 24 May 2000
  agents: '10,000', // "on the order of 10,000 concurrent agents"
  hours: '88', // "about 88 hours from first launch to resolution"
  messages: '2.7 million', // messages between agents
  tokens: '130 billion', // "approximately 130 billion output tokens"
  leanHours: '17', // "an additional 17 hours via GPT-6 Astra" (formalization)
  claim: 'The flow blows up.', // finite-time blow-up, with a smooth force
  qualifier: 'with an outside force · OpenAI’s claim, Sep 2026 · under review',
};

export const MILESTONES = [
  {date: '2021.03', stat: '6.9%', text: 'best AI on competition math (MATH)'},
  {date: '2022.06', stat: '50.3%', text: 'Minerva on MATH (majority of 64 tries)'},
  {date: '2024.07', stat: '28/42', text: 'AlphaProof at the IMO: silver-medal standard'},
  {date: '2024.11', stat: '<2%', text: 'FrontierMath launches: research-level problems'},
  {date: '2025.07', stat: '35/42', text: 'IMO gold-medal score'},
  {date: '2026.05', stat: 'n^{1+c}', statTex: true, text: 'OpenAI model disproves Erdős’s unit-distance conjecture'},
  {date: '2026.09', stat: String.raw`\|u\|\to\infty`, statTex: true, text: 'Navier–Stokes blowup with a force (OpenAI claim; Clay has not ruled)'},
  {date: '2026.10', stat: '719', text: 'manuscripts at openai/math'},
];

export const SOURCES = [
  'OpenAI, openai/math (2026).',
  'Epoch AI, FrontierMath (2024–26).',
];
