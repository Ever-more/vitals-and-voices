import AIExplain from './AIExplain.jsx';
import { classifyTest } from '../lib/labRanges.js';

// This part of the code is responsible for linking each number to learning resources in the application.
// It handles which pro-reviewed guides appear as "Learn more" tags under each metric,
// and ensures every result leads somewhere useful instead of leaving people with a bare label.
const LEARN = {
  a1c: [['Prediabetes 101', 'prediabetes', 'bg-mint'], ['What is A1c?', 'prediabetes', 'bg-sky']],
  glucose: [['Prediabetes 101', 'prediabetes', 'bg-mint']],
  systolic: [['Reading your BP', 'bp', 'bg-pink']],
  diastolic: [['Reading your BP', 'bp', 'bg-pink']],
  ldl: [['Cholesterol, decoded', 'cholesterol', 'bg-butter']],
  hdl: [['Cholesterol, decoded', 'cholesterol', 'bg-butter']],
  tg: [['Cholesterol, decoded', 'cholesterol', 'bg-butter']],
  waist: [['Metabolic health', 'metabolic', 'bg-lavender']],
  bmi: [['Beyond BMI', 'metabolic', 'bg-lavender']],
};

// This part of the code is responsible for one doodle result card in the application.
// It handles the hand-drawn range bar, the sliding pin, the status sticker, and the Learn more tags,
// and ensures people see where they stand at a glance and know where to learn more.
function MetricCard({ m, index, go }) {
  const pct = (v) => ((Math.min(Math.max(v, m.min), m.max) - m.min) / (m.max - m.min)) * 100;
  const segs = m.bands.map((b, i) => {
    const from = i === 0 ? m.min : Math.min(m.bands[i - 1].to, m.max);
    const to = Math.min(b.to, m.max);
    return { ...b, i, left: pct(from), width: Math.max(pct(to) - pct(from), 0) };
  });

  return (
    <article className="card metric" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="row-between">
        <h3>{m.name}</h3>
        <p className="value">{m.value}<span className="unit-sm">{m.unit}</span></p>
      </div>
      <div className="bar" role="img" aria-label={`${m.name}: ${m.value} ${m.unit}, ${m.label}`}>
        {segs.map((s) => s.width > 0 && (
          <div key={s.i} className={`seg seg-${s.status}`} style={{ left: `${s.left}%`, width: `${s.width}%` }} title={s.label} />
        ))}
        <div className="marker" style={{ left: `${pct(m.value)}%` }} />
      </div>
      <span className={`pill p-${m.status}`}>{m.label}</span>
      <p className="small">{m.what}</p>
      {LEARN[m.key] && (
        <div className="row learn-row">
          <span className="small">Learn more:</span>
          {LEARN[m.key].map(([label, topic, bg]) => (
            <button key={label} className={`chip ${bg}`} onClick={() => go('resource', topic)}>{label}</button>
          ))}
        </div>
      )}
    </article>
  );
}

// This part of the code is responsible for one "other result" card from any lab report in the application.
// It handles showing a test Gemma read (like a CBC value) with a bar built from the lab's own printed reference range,
// and ensures any kind of lab report is useful, not just heart and metabolic numbers.
function ExtraCard({ t, index }) {
  const c = classifyTest(t);
  return (
    <article className="card metric extra" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="row-between">
        <h3 className="extra-name">{t.name}</h3>
        <p className="value extra-value">{t.value}<span className="unit-sm">{t.unit}</span></p>
      </div>
      {c.bar && (
        <div className="bar" role="img" aria-label={`${t.name}: ${t.value} ${t.unit}, ${c.label}`}>
          {c.bar.bands.map((b) => b.width > 0 && (
            <div key={b.i} className={`seg seg-${b.status}`} style={{ left: `${b.left}%`, width: `${b.width}%` }} />
          ))}
          <div className="marker" style={{ left: `${c.bar.marker}%` }} />
        </div>
      )}
      <span className={`pill p-${c.status}`}>{c.label}</span>
      {t.range && <p className="small">Your lab's range: {t.range} {t.unit}</p>}
    </article>
  );
}

// This part of the code is responsible for the number check results page in the application.
// It handles the emergency banner, blood pressure summary, result cards, Gemma's explanation, and the Ask a pro prompt,
// and ensures the page reads top to bottom as: what's urgent, where each number stands, what it means, who can help.
export default function Results({ results, onEdit, go, extraTests = [] }) {
  return (
    <section className="stack">
      {results.urgent && (
        <div className="emergency" role="alert">
          <strong>Your blood pressure is in a severe range.</strong> Rest 5 minutes and recheck. If it's still above 180/120,
          contact a doctor now. With chest pain, shortness of breath, numbness, weakness, or vision changes, <strong>call 911</strong>.
        </div>
      )}
      <div className="row-between">
        <div>
          <span className="sticker bg-lavender small">Ranges from ADA &amp; AHA guidelines</span>
          <h1 style={{ marginTop: 8 }}>Here's what your results say</h1>
          {results.bp && (
            <p style={{ marginTop: 6 }}>Blood pressure {results.values.systolic}/{results.values.diastolic}:{' '}
              <span className={`pill p-${results.bp.status}`}>{results.bp.label}</span></p>
          )}
        </div>
        <button className="btn" onClick={onEdit}>Edit numbers</button>
      </div>

      <div className="metric-grid">
        {results.metrics.map((m, i) => <MetricCard key={m.key} m={m} index={i} go={go} />)}
      </div>

      {extraTests.length > 0 && (
        <section className="stack">
          <div>
            <h2>{results.metrics.length ? 'Other results from your report' : 'Your lab results'}</h2>
            <p className="small">Read by Gemma 4. Ranges are the ones your lab printed, checked by our code. Out-of-range results are listed first.</p>
          </div>
          <div className="metric-grid extra-grid">
            {[...extraTests]
              .sort((a, b) => (classifyTest(b).status === 'watch') - (classifyTest(a).status === 'watch'))
              .map((t, i) => <ExtraCard key={`${t.name}-${i}`} t={t} index={i} />)}
          </div>
        </section>
      )}

      <div className="results-bottom">
        <AIExplain results={results} extraTests={extraTests} />
        <section className="ask-card float">
          <h2>Still have questions?</h2>
          <p className="small">Share your results in a community and get answers from verified nurses, doctors and pharmacists.</p>
          <button className="btn primary" onClick={() => go('community')}>Ask a pro</button>
        </section>
      </div>
    </section>
  );
}