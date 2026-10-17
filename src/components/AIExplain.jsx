import { useState } from 'react';
import { classifyTest } from '../lib/labRanges.js';

// This part of the code is responsible for safely displaying Gemma's text in the application.
// It handles turning lines that start with "- " into bullet points and the rest into paragraphs,
// and ensures AI output is rendered as plain text, never as raw HTML that could inject scripts.
function AIText({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim().replace(/\*\*/g, '');
    if (!line) return;
    if (/^[-*•]\s+/.test(line)) {
      if (!list) { list = []; blocks.push({ type: 'ul', items: list, key: i }); }
      list.push(line.replace(/^[-*•]\s+/, ''));
    } else {
      list = null;
      blocks.push({ type: 'p', text: line, key: i });
    }
  });
  return blocks.map((b) =>
    b.type === 'ul'
      ? <ul key={b.key}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
      : <p key={b.key}>{b.text}</p>
  );
}

// This part of the code is responsible for the "What these mean together" card in the application.
// It handles sending only computed categories (no names, IDs, or photos) for both guideline results and other lab results, then showing Gemma's reply,
// and ensures users always see that the explanation came from Gemma while the ranges came from guidelines or their lab.
export default function AIExplain({ results, extraTests = [] }) {
  const [state, setState] = useState({ status: 'idle' });

  const explain = async () => {
    setState({ status: 'loading' });
    try {
      const metrics = [
        ...results.metrics.map(({ name, value, unit, label }) => ({ name, value, unit, label })),
        ...extraTests.map((t) => ({ name: t.name, value: t.value, unit: t.unit, label: classifyTest(t).label })),
      ];
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, bp: results.bp?.label ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setState({ status: 'done', text: data.text, model: data.model });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  };

  return (
    <section className="ai-card">
      <div className="row-between">
        <div>
          <span className="gemma-tag">✨ by Gemma 4</span>
          <h2>What these mean together</h2>
        </div>
        <button className="btn bg-butter" onClick={explain} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Gemma is thinking…' : state.status === 'done' ? 'Explain again' : 'Explain my numbers'}
        </button>
      </div>
      {state.status === 'idle' && <p className="small">Gemma explains your results in everyday words. The ranges come from medical guidelines or your lab, not the AI.</p>}
      {state.status === 'loading' && <p className="wiggle" style={{ display: 'inline-block' }}>✏️ Writing your explanation…</p>}
      {state.status === 'done' && (
        <div className="ai-text">
          <AIText text={state.text} />
          <p className="small muted">Written by {state.model} · Not a diagnosis · Check with your doctor</p>
        </div>
      )}
      {state.status === 'error' && <p>Couldn't reach Gemma: {state.message}</p>}
    </section>
  );
}