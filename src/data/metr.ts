// METR 50% time horizons (TH1.1), minutes. Trend: doubling every 128.7 days (since 2023).
export const METR: [string, string, number][] = [
  ['GPT-2', '2019-02-14', 0.054], ['GPT-3', '2020-05-28', 0.144], ['GPT-3.5', '2022-03-15', 0.6], ['GPT-4', '2023-03-14', 4.0],
  ['GPT-4o', '2024-05-13', 7.0], ['Claude 3.5 Sonnet', '2024-06-20', 11.4], ['o1-preview', '2024-09-12', 20.3], ['o1', '2024-12-05', 38.8],
  ['Claude 3.7 Sonnet', '2025-02-24', 60.4], ['o3', '2025-04-16', 119.7], ['GPT-5', '2025-08-07', 203], ['Claude Opus 4.5', '2025-11-24', 293],
  ['GPT-5.2', '2025-12-11', 352], ['Claude Opus 4.6', '2026-02-05', 718.8], ['Claude Mythos Preview', '2026-04-07', 1044.8],
];
export const yr = (s: string) => {
  const d = new Date(s + 'T00:00:00Z');
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return d.getUTCFullYear() + (d.getTime() - start) / 86400000 / 365.25;
};
export const T_YEARS = METR.map(([, d]) => yr(d));
export const HOURS = METR.map(([, , m]) => m / 60);
export const DOUBLING_YR = 128.7 / 365.25;
const rec = T_YEARS.map((t, i) => [t, HOURS[i]]).filter(([t]) => t >= 2023);
export const TREND_C = rec.reduce((a, [t, h]) => a + Math.log2(h) - (t - 2026) / DOUBLING_YR, 0) / rec.length;
export const trend = (t: number) => Math.pow(2, TREND_C + (t - 2026) / DOUBLING_YR);
export const TODAY = yr('2026-10-07'); // trend ≈ 29 h — never print this number as a measurement
export const LABELS: Record<string, string> = {'GPT-2': '3 s', 'GPT-4': '4 min', o3: '2 h', 'Claude Opus 4.6': '12 h', 'Claude Mythos Preview': '16 h+'};
// crossings for "if the trend holds" (label as extrapolation, not forecast)
export const WORK_WEEK = {hours: 40, when: 'late 2026'};
export const WORK_MONTH = {hours: 167, when: '2027'};
