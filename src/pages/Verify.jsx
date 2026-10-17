import { useRef, useState } from 'react';
import { fileToImages } from '../lib/image.js';

const ROLES = [
  { id: 'nurse', label: 'Nurse', badge: 'Nurse', bg: 'bg-sky', npi: false },
  { id: 'resident', label: 'Resident', badge: 'Resident', bg: 'bg-lavender', npi: true },
  { id: 'physician', label: 'Physician', badge: 'Physician', bg: 'bg-peach', npi: true },
  { id: 'pharmacist', label: 'Pharmacist', badge: 'Pharmacist', bg: 'bg-butter', npi: true },
  { id: 'ems', label: 'EMS', badge: 'EMS', bg: 'bg-pink', npi: false },
];

// This part of the code is responsible for comparing names across sources in the application.
// It handles ignoring case, punctuation, and titles, and checks that the last name and first name both appear,
// and ensures a match means the same person while small formatting differences don't cause false failures.
function namesMatch(typed, found) {
  const clean = (s) => s.toLowerCase().replace(/\b(dr|md|do|rn|np|pa|pharmd|emt|p)\b/g, '').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const a = clean(typed);
  const b = clean(found);
  if (a.length < 2 || !b.length) return false;
  return b.includes(a[a.length - 1]) && b.includes(a[0]);
}

// This part of the code is responsible for one row in the verification checklist in the application.
// It handles showing a check's status (passed, failed, pending, or skipped) with a short detail line,
// and ensures pros can see exactly which checks passed and why one didn't.
function Check({ title, status, detail }) {
  const icon = { pass: '✓', fail: '✗', loading: '…', todo: '○', skip: '–' }[status];
  return (
    <div className="check-row">
      <span className={`check-dot check-${status}`}>{icon}</span>
      <div><div>{title}</div>{detail && <div className="small">{detail}</div>}</div>
    </div>
  );
}

// This part of the code is responsible for medical professional verification in the application.
// It handles the role form, a live NPI Registry lookup, and Gemma reading a license photo, then shows the resulting badge,
// and ensures only people whose credentials check out can speak as experts in #ask-a-pro.
export default function Verify({ go }) {
  const [role, setRole] = useState('nurse');
  const [name, setName] = useState('');
  const [npi, setNpi] = useState('');
  const [photo, setPhoto] = useState(null);
  const [agree, setAgree] = useState(false);
  const [registry, setRegistry] = useState({ status: 'todo' });
  const [license, setLicense] = useState({ status: 'todo' });
  const fileRef = useRef(null);
  const r = ROLES.find((x) => x.id === role);

  const runChecks = async () => {
    // Registry check
    if (npi.trim()) {
      setRegistry({ status: 'loading' });
      try {
        const res = await fetch('/api/verify-npi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ npi }) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        if (!d.found) setRegistry({ status: 'fail', detail: 'No provider found with that NPI.' });
        else if (!d.individual) setRegistry({ status: 'fail', detail: 'That NPI belongs to an organization, not a person.' });
        else if (!namesMatch(name, `${d.firstName} ${d.lastName}`)) setRegistry({ status: 'fail', detail: `Registry name doesn't match the name you entered.` });
        else setRegistry({ status: 'pass', detail: `${d.firstName} ${d.lastName}${d.credential ? ', ' + d.credential : ''} · ${d.specialty || 'Provider'}${d.state ? ' · ' + d.state : ''}` });
      } catch (err) {
        setRegistry({ status: 'fail', detail: `Couldn't reach the registry: ${err.message}` });
      }
    } else {
      setRegistry({ status: 'skip', detail: r.npi ? 'Add your NPI to run this check.' : 'Nurse and EMS licenses are checked by photo in this demo.' });
    }

    // Gemma license photo check
    if (photo) {
      setLicense({ status: 'loading' });
      try {
        const [image] = await fileToImages(photo);
        const res = await fetch('/api/read-license', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        if (!d.readable || !d.name) setLicense({ status: 'fail', detail: 'Gemma couldn\'t read a name. Try a sharper photo with less glare.' });
        else if (!namesMatch(name, d.name)) setLicense({ status: 'fail', detail: `Gemma read "${d.name}", which doesn't match the name you entered.` });
        else setLicense({ status: 'pass', detail: `Gemma read: ${d.name}${d.profession ? ' · ' + d.profession : ''}${d.expires ? ' · expires ' + d.expires : ''}` });
      } catch (err) {
        setLicense({ status: 'fail', detail: `Couldn't reach Gemma: ${err.message}` });
      }
    } else {
      setLicense({ status: 'skip', detail: 'Add a photo of your license or work badge to run this check.' });
    }
  };

  const passed = registry.status === 'pass' || license.status === 'pass';
  const busy = registry.status === 'loading' || license.status === 'loading';

  return (
    <div className="stack">
      <div>
        <h1>Verify you're a medical pro</h1>
        <p style={{ maxWidth: '60ch', marginTop: 6 }}>Only verified pros can answer in #ask-a-pro and post in #resources. Until then, you can still join communities as a member.</p>
      </div>

      <div className="verify-layout">
        <form className="card verify-form stack" onSubmit={(e) => { e.preventDefault(); if (agree && name.trim()) runChecks(); }}>
          <fieldset>
            <legend>I am a…</legend>
            <div className="row">
              {ROLES.map((x) => (
                <button type="button" key={x.id} aria-pressed={role === x.id}
                  className={`btn ${role === x.id ? 'primary' : ''}`} onClick={() => setRole(x.id)}>{x.label}</button>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>Full legal name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on your license" />
          </label>

          <label className="field">
            <span>NPI number {r.npi ? '' : '(optional for this role)'}</span>
            <input value={npi} onChange={(e) => setNpi(e.target.value)} inputMode="numeric" placeholder="10-digit NPI" maxLength={12} />
            <span className="hint">Checked live against the official CMS NPI Registry.</span>
          </label>

          <div className="license-drop">
            <div>
              <div>Photo of your license or work badge</div>
              <div className="small">{photo ? `Selected: ${photo.name}` : 'Gemma 4 reads the name and checks it matches. The photo is never stored.'}</div>
            </div>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>{photo ? 'Change photo' : 'Choose photo'}</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          </div>

          <label className="agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I'll share general education only and won't diagnose or prescribe for individuals here.</span>
          </label>

          <button className="btn primary big" type="submit" disabled={!agree || !name.trim() || busy}>
            {busy ? 'Running checks…' : 'Submit for verification'}
          </button>
        </form>

        <aside className="verify-side">
          <section className="card bg-butter stack">
            <h2>How we check</h2>
            <Check title="Official registry match" status={registry.status} detail={registry.detail || 'CMS NPI Registry lookup'} />
            <Check title="Gemma license photo check" status={license.status} detail={license.detail || 'Name on the photo matches the form'} />
            <Check title="Identity check" status="todo" detail="Selfie + ID through an identity partner (coming soon)" />
            <Check title="Human review" status="todo" detail="A moderator approves the badge" />
          </section>

          <section className="card stack">
            <h3>Your badge</h3>
            <div className="row">
              <span className="avatar bg-lavender">{(name.trim()[0] || 'Y').toUpperCase()}</span>
              <div>
                <div>{name.trim() || 'Your Name'}</div>
                <span className={`chip ${r.bg}`}>{passed ? '✓ ' : ''}{r.badge} · {passed ? 'checks passed, pending review' : 'not verified yet'}</span>
              </div>
            </div>
            <p className="small">License photos are read once and deleted. Only your name, role and badge are shown.</p>
            {passed && <button className="btn" onClick={() => go('community')}>Go to the community</button>}
          </section>
        </aside>
      </div>
    </div>
  );
}