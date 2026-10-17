import { useState } from 'react';

// This part of the code is responsible for the starter community content in the application.
// It handles seeded questions, pro answers, and peer tips for each channel,
// and ensures the community feels alive in a demo instead of opening to an empty feed. All people are fictional.
const SEED = [
  {
    id: 'p1', channel: 'ask-a-pro', author: 'Jordan', role: 'member', badge: 'Member',
    title: 'My A1c went from 5.8 to 6.1. Should I be worried?',
    body: "Saw it in my patient portal before my appointment. I'm 23 and didn't think this was something I'd deal with yet.",
    replies: [
      { id: 'r1', author: 'Dr. Amara O.', role: 'resident', badge: 'Resident · PGY-2 Internal Medicine', pro: true,
        body: 'Both values fall in the prediabetes range (5.7–6.4%). This reflects elevated average glycemia over roughly three months, not a diabetes diagnosis. Lifestyle intervention has strong evidence for slowing progression. Ask your clinician about repeat testing and a CDC-recognized prevention program.' },
      { id: 'r2', author: 'Marcus T.', role: 'peer', badge: 'Lived experience · 3 yrs',
        body: "Found out at 26. A 10-minute walk after dinner was my game changer. You've got time to turn this around." },
    ],
  },
  {
    id: 'p2', channel: 'ask-a-pro', author: 'Priya S.', role: 'member', badge: 'Member',
    title: 'Metformin is upsetting my stomach. Is that normal?', body: 'Started last week and my stomach has been off.',
    replies: [
      { id: 'r3', author: 'Sam K.', role: 'pharmacist', badge: 'Pharmacist · PharmD', pro: true,
        body: 'Gastrointestinal upset is a common adverse effect when initiating metformin. Taking it with meals often helps, and an extended-release formulation is sometimes better tolerated. Talk with your prescriber before changing how you take it.' },
    ],
  },
  {
    id: 'p3', channel: 'tips-and-tricks', author: 'Maya R.', role: 'nurse', badge: 'Nurse · RN Cardiology',
    title: 'A 30-second daily foot check', body: "Look at the tops, soles and between your toes for cuts, blisters or color changes. Use a mirror if you need to, and tell your care team about anything that isn't healing.", replies: [],
  },
  {
    id: 'p4', channel: 'tips-and-tricks', author: 'Dana W.', role: 'peer', badge: 'Lived experience · 8 yrs',
    title: 'Plate method at the dining hall', body: 'Half the plate veggies, a quarter protein, a quarter carbs. It made the dining hall way less overwhelming for me.', replies: [],
  },
  { id: 'p5', channel: 'wins', author: 'Marcus T.', role: 'peer', badge: 'Lived experience · 3 yrs', title: '30 days of evening walks!', body: 'Never thought I would stick with it. Small steps really add up.', replies: [] },
  { id: 'p6', channel: 'vent', author: 'Alex', role: 'member', badge: 'Member', title: 'Tired of feeling judged at appointments', body: 'Some days it feels like every visit is about my weight. Anyone else?', replies: [] },
  { id: 'p7', channel: 'resources', author: 'Dr. Lin C.', role: 'physician', badge: 'Physician · MD Endocrinology', title: 'National Diabetes Prevention Program', body: 'CDC-recognized lifestyle programs, many free or online. Search "National DPP" on the CDC website to find one near you.', replies: [] },
];

const CHANNELS = [
  { id: 'ask-a-pro', desc: 'Questions answered by verified medical workers' },
  { id: 'resources', desc: 'Trusted references shared by pros' },
  { id: 'tips-and-tricks', desc: 'Practical advice from people living it' },
  { id: 'wins', desc: 'Celebrate progress, big and small' },
  { id: 'vent', desc: 'A supportive space for the hard days' },
];

const PROS = [
  ['Maya R.', 'Nurse · RN Cardiology', 'bg-sky'],
  ['Dr. Amara O.', 'Resident · PGY-2 IM', 'bg-lavender'],
  ['Dr. Lin C.', 'Physician · Endocrinology', 'bg-peach'],
  ['Sam K.', 'Pharmacist · PharmD', 'bg-butter'],
  ['Luis M.', 'EMS · Paramedic', 'bg-pink'],
];

const RISKY = 'I stopped taking my blood pressure meds and use garlic pills instead. Works way better, DM me for a discount code!';

// This part of the code is responsible for calling Gemma's community features in the application.
// It handles posting a task (moderate, summarize, or plain) to the server and returning the result,
// and ensures every community feature talks to Gemma the same way with the same error handling.
async function askGemma(task, payload) {
  const res = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// This part of the code is responsible for one post and its replies in the application.
// It handles role badges, pro answers, and the "Explain in plain words" button on professional replies,
// and ensures expert answers stay accurate while still being understandable to everyone.
function Post({ post }) {
  const [plain, setPlain] = useState({});
  const explain = async (reply) => {
    setPlain((p) => ({ ...p, [reply.id]: { status: 'loading' } }));
    try {
      const data = await askGemma('plain', { text: reply.body });
      setPlain((p) => ({ ...p, [reply.id]: { status: 'done', text: data.text } }));
    } catch (err) {
      setPlain((p) => ({ ...p, [reply.id]: { status: 'error', text: err.message } }));
    }
  };

  return (
    <article className="card post">
      <div className="row">
        <strong>{post.author}</strong>
        <span className={`chip role-${post.role}`}>{post.badge}</span>
      </div>
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      {post.replies.map((r) => (
        <div key={r.id} className={`reply ${r.pro ? 'reply-pro' : 'reply-peer'}`}>
          <div className="row">
            <strong>{r.author}</strong>
            <span className={`chip role-${r.role}`}>{r.badge}</span>
            {r.pro && <span className="chip bg-mint">✓ Verified pro</span>}
          </div>
          <p>{r.body}</p>
          {r.pro && (
            <>
              {plain[r.id]?.status === 'done' && (
                <div className="plain-box"><span className="gemma-tag">✨ Plain words by Gemma 4</span><p>{plain[r.id].text}</p></div>
              )}
              {plain[r.id]?.status === 'error' && <p className="small">Couldn't reach Gemma: {plain[r.id].text}</p>}
              <button className="chip bg-butter" onClick={() => explain(r)} disabled={plain[r.id]?.status === 'loading'}>
                {plain[r.id]?.status === 'loading' ? 'Gemma is rewriting…' : 'Explain in plain words'}
              </button>
            </>
          )}
        </div>
      ))}
    </article>
  );
}

// This part of the code is responsible for the community channel page in the application.
// It handles channel switching, Gemma's Catch me up summary, and posting through Gemma's safety check and smart routing,
// and ensures patients get support and expert answers in one place while harmful advice is held before anyone sees it.
export default function Community({ go }) {
  const [channel, setChannel] = useState('ask-a-pro');
  const [posts, setPosts] = useState(SEED);
  const [summary, setSummary] = useState({ status: 'idle' });
  const [draft, setDraft] = useState('');
  const [check, setCheck] = useState({ status: 'idle' });

  const current = CHANNELS.find((c) => c.id === channel);
  const visible = posts.filter((p) => p.channel === channel);

  const switchChannel = (id) => { setChannel(id); setSummary({ status: 'idle' }); };

  const catchUp = async () => {
    setSummary({ status: 'loading' });
    try {
      const text = visible.map((p) => `${p.author}: ${p.title}. ${p.body} ${p.replies.map((r) => `${r.author} replied: ${r.body}`).join(' ')}`).join('\n');
      const data = await askGemma('summarize', { channel, posts: text });
      setSummary({ status: 'done', text: data.text });
    } catch (err) {
      setSummary({ status: 'error', text: err.message });
    }
  };

  const submit = async () => {
    if (!draft.trim()) return;
    setCheck({ status: 'loading' });
    try {
      const v = await askGemma('moderate', { text: draft, role: 'patient' });
      if (v.verdict === 'flag') { setCheck({ status: 'flagged', ...v }); return; }
      const post = {
        id: `u${Date.now()}`, channel: v.channel, author: 'You', role: 'member', badge: 'Member',
        title: draft.trim().slice(0, 80), body: draft.trim().length > 80 ? draft.trim() : '', replies: [],
      };
      setPosts((prev) => [post, ...prev]);
      setDraft('');
      setChannel(v.channel);
      setCheck({ status: 'posted', ...v });
    } catch (err) {
      setCheck({ status: 'error', reason: err.message });
    }
  };

  return (
    <div className="community">
      <aside className="channel-list">
        <h2>Type 2 Diabetes</h2>
        <p className="small">Patients, caregivers &amp; medical workers</p>
        {CHANNELS.map((c) => (
          <button key={c.id} className={`channel ${c.id === channel ? 'active' : ''}`}
            aria-current={c.id === channel ? 'page' : undefined} onClick={() => switchChannel(c.id)}>
            # {c.id}
          </button>
        ))}
        <div className="card bg-butter circle-card">
          <h3>6-week Reset Circle</h3>
          <p className="small">Peer-led, with weekly resident check-ins</p>
          <button className="btn primary">Join</button>
        </div>
      </aside>

      <main className="channel-main">
        <div className="row-between">
          <div>
            <h1># {current.id}</h1>
            <p className="small">{current.desc}</p>
          </div>
          <button className="btn bg-lavender" onClick={catchUp} disabled={summary.status === 'loading'}>
            {summary.status === 'loading' ? 'Gemma is reading…' : '✨ Catch me up'}
          </button>
        </div>

        {summary.status === 'done' && (
          <div className="summary-box"><span className="gemma-tag">✨ Catch me up · by Gemma 4</span>
            {summary.text.split('\n').filter(Boolean).map((l, i) => <p key={i}>{l.replace(/\*\*/g, '')}</p>)}
          </div>
        )}
        {summary.status === 'error' && <p className="small">Couldn't reach Gemma: {summary.text}</p>}

        <div className="composer card">
          <label htmlFor="draft"><h3>Ask the community</h3></label>
          <textarea id="draft" rows={3} value={draft} placeholder="Ask a question or share a tip…"
            onChange={(e) => { setDraft(e.target.value); setCheck({ status: 'idle' }); }} />
          <div className="row-between">
            <button className="link-btn small" onClick={() => setDraft(RISKY)}>Demo: try a risky post</button>
            <button className="btn primary" onClick={submit} disabled={check.status === 'loading' || !draft.trim()}>
              {check.status === 'loading' ? 'Gemma is checking…' : 'Post'}
            </button>
          </div>
          {check.status === 'flagged' && (
            <div className="held-box">
              <strong>🛡️ Gemma held this post for review.</strong> {check.reason}
              {check.suggestion && <p className="small">Try instead: {check.suggestion}</p>}
            </div>
          )}
          {check.status === 'posted' && (
            <div className="routed-box">
              ✨ Checked by Gemma and posted in <strong>#{check.channel}</strong>
              {check.pro && <> · best answered by a <strong>{check.pro}</strong></>}
            </div>
          )}
          {check.status === 'error' && <p className="small">Couldn't reach Gemma: {check.reason}</p>}
          <p className="small muted">Every post is checked by Gemma before it goes live. Pros share general education, not personal diagnoses.</p>
        </div>

        {visible.map((p) => <Post key={p.id} post={p} />)}
        {visible.length === 0 && <p className="muted">No posts here yet. Be the first!</p>}
      </main>

      <aside className="people">
        <h3>Verified pros here</h3>
        {PROS.map(([name, role, bg]) => (
          <div key={name} className="person">
            <span className={`avatar ${bg}`}>{name.replace('Dr. ', '').split(' ').map((w) => w[0]).join('')}</span>
            <div><div>{name}</div><div className="small">{role}</div></div>
          </div>
        ))}
        <button className="btn bg-lavender" onClick={() => go('verify')}>Are you a pro? Get verified</button>
      </aside>
    </div>
  );
}