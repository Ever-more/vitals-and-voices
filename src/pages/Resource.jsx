import { useState } from 'react';
import { RESOURCES, LANGUAGES } from '../data/resources.js';

// This part of the code is responsible for flattening a guide into plain text in the application.
// It handles joining headings, paragraphs, and list items into one block for Gemma to rewrite,
// and ensures Gemma sees the full reviewed guide, nothing more and nothing less.
function guideToText(r) {
  const ranges = r.ranges ? 'Ranges: ' + r.ranges.map((x) => `${x.value} = ${x.label}`).join('; ') + '\n' : '';
  const body = r.sections.map((s) => `${s.h}: ${s.p || s.list.join('; ')}`).join('\n');
  return ranges + body;
}

// This part of the code is responsible for the resource guide page in the application.
// It handles showing a pro-reviewed guide, rewriting it with Gemma in simpler words or another language, and linking to the matching community,
// and ensures learning always ends with real people who can help.
export default function Resource({ go, topic = 'prediabetes' }) {
  const r = RESOURCES[topic] || RESOURCES.prediabetes;
  const [language, setLanguage] = useState('simple');
  const [rewrite, setRewrite] = useState({ status: 'idle' });

  const simplify = async () => {
    setRewrite({ status: 'loading' });
    try {
      const res = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: r.title, text: guideToText(r), language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setRewrite({ status: 'done', text: data.text, language, model: data.model });
    } catch (err) {
      setRewrite({ status: 'error', message: err.message });
    }
  };

  const others = Object.entries(RESOURCES).filter(([id]) => id !== topic);

  return (
    <div className="resource-layout">
      <article className="card resource-article">
        <p className="small"><button className="link-btn" onClick={() => go('home')}>Resources</button> › {r.tag}</p>
        <h1>{r.title}</h1>
        <div className="row">
          {r.reviewers.map((name) => <span key={name} className="chip bg-mint">{name}</span>)}
        </div>

        <div className="gemma-rewrite">
          <span className="gemma-tag">✨ by Gemma 4</span>
          <div className="row">
            <label className="small" htmlFor="lang">Explain it in</label>
            <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: 'auto' }}>
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <button className="btn bg-butter" onClick={simplify} disabled={rewrite.status === 'loading'}>
              {rewrite.status === 'loading' ? 'Gemma is rewriting…' : 'Explain it simpler'}
            </button>
          </div>
          {rewrite.status === 'done' && (
            <div className="rewrite-box">
              {rewrite.text.split('\n').filter(Boolean).map((line, i) => <p key={i}>{line.replace(/\*\*/g, '')}</p>)}
              <p className="small muted">Rewritten by {rewrite.model} from the pro-reviewed guide below · Not medical advice</p>
              <button className="link-btn small" onClick={() => setRewrite({ status: 'idle' })}>Hide</button>
            </div>
          )}
          {rewrite.status === 'error' && <p className="small">Couldn't reach Gemma: {rewrite.message}</p>}
        </div>

        {r.ranges && (
          <section>
            <h2>What the numbers mean</h2>
            <div className="range-grid">
              {r.ranges.map((x) => (
                <div key={x.label} className={`range-card ${x.bg}`}>
                  <div className="range-value">{x.value}</div>
                  <div>{x.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {r.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p && <p>{s.p}</p>}
            {s.list && <ul>{s.list.map((li) => <li key={li}>{li}</li>)}</ul>}
          </section>
        ))}
        <p className="small muted">Sources: {r.sources}</p>
      </article>

      <aside className="resource-side">
        <section className="join-card float">
          <span className="sticker bg-white small">You're not alone</span>
          <h2>Join the {r.community} community</h2>
          <p className="small">Ask verified pros, swap tips with people living it, and join a support circle.</p>
          <div className="avatars">
            <span className="avatar bg-mint">MR</span>
            <span className="avatar bg-lavender">AO</span>
            <span className="avatar bg-peach">SK</span>
            <span className="small" style={{ marginLeft: 10 }}>Pros and peers are here</span>
          </div>
          <button className="btn primary" onClick={() => go('community')}>Join community</button>
        </section>

        <section className="card">
          <h3>More guides</h3>
          <div className="row" style={{ marginTop: 10 }}>
            {others.map(([id, o]) => (
              <button key={id} className={`chip ${o.tagBg}`} onClick={() => go('resource', id)}>{o.title}</button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}