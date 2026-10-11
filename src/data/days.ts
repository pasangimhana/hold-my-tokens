// Manuscripts per preprint date, Sep 10 .. Oct 7 2026 (28 days, sums to 719).
// Current openai/math catalogue (updated Oct 8 2026: revisions re-dated, 3 manuscripts withdrawn).
export const DAYS = [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 3, 172, 188, 86, 53, 50, 0, 0, 2, 1, 1, 4, 20, 108, 21, 7];
export const DAY_LABELS = Array.from({length: 28}, (_, i) => (i < 21 ? `Sep ${10 + i}` : `Oct ${i - 20}`));
