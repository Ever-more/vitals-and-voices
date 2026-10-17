// This part of the code is responsible for understanding a lab's printed reference ranges in the application.
// It handles turning text like "4.2-5.4", "< 200", or "> 40" into numbers and checking a value against them,
// and ensures every result is judged by the lab's own range in code, never by the AI's opinion.
export function parseRange(text) {
  const t = String(text || '').replace(/,/g, '').trim();
  let m = t.match(/^(-?\d*\.?\d+)\s*(?:-|–|to)\s*(-?\d*\.?\d+)$/i);
  if (m) return { low: Number(m[1]), high: Number(m[2]) };
  m = t.match(/^(?:<|≤|<=|less than)\s*(-?\d*\.?\d+)$/i);
  if (m) return { low: null, high: Number(m[1]) };
  m = t.match(/^(?:>|≥|>=|greater than)\s*(-?\d*\.?\d+)$/i);
  if (m) return { low: Number(m[1]), high: null };
  return null;
}

// This part of the code is responsible for classifying one extra lab result in the application.
// It handles deciding if a value is below, within, or above its range and building the bar segments to draw it,
// and ensures results with an unreadable range still show the lab's own H/L flag instead of a guess.
export function classifyTest(test) {
  const range = parseRange(test.range);
  const v = test.value;
  if (!range) {
    const flag = String(test.flag || '').toUpperCase();
    if (flag.startsWith('H')) return { status: 'watch', label: 'Flagged high by your lab', bar: null };
    if (flag.startsWith('L')) return { status: 'watch', label: 'Flagged low by your lab', bar: null };
    return { status: 'good', label: 'No range listed', bar: null };
  }
  const low = range.low ?? 0;
  const high = range.high ?? (low * 2 || 1);
  const span = Math.max(high - low, Math.abs(high) * 0.2, 0.01);
  const min = Math.max(0, low - span * 0.6);
  const max = high + span * 0.6;
  const below = range.low != null && v < range.low;
  const above = range.high != null && v > range.high;
  const status = below || above ? 'watch' : 'good';
  const label = below ? 'Below reference range' : above ? 'Above reference range' : 'Within reference range';
  const pct = (x) => ((Math.min(Math.max(x, min), max) - min) / (max - min)) * 100;
  const bands = [
    { from: min, to: low, status: range.low == null ? 'good' : 'watch' },
    { from: low, to: high, status: 'good' },
    { from: high, to: max, status: range.high == null ? 'good' : 'watch' },
  ].map((b, i) => ({ ...b, i, left: pct(b.from), width: Math.max(pct(b.to) - pct(b.from), 0) }));
  return { status, label, bar: { bands, marker: pct(v) } };
}