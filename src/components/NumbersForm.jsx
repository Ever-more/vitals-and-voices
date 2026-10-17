import { useEffect, useState } from 'react';
import { SAMPLE, EMPTY } from '../lib/thresholds.js';
import { fileToImages } from '../lib/image.js';

// This part of the code is responsible for one labeled number input in the application.
// It handles the label, unit, and helper text for a single measurement,
// and ensures people know where to find each number on their lab report.
function Field({ id, label, unit, hint, inputs, set }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="field-input">
        <input type="number" step="any" inputMode="decimal" value={inputs[id]}
          onChange={(e) => set(id, e.target.value)} placeholder="—" />
        {unit && <span className="unit">{unit}</span>}
      </span>
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

// This part of the code is responsible for the number check form in the application.
// It handles reading an uploaded lab photo or PDF with Gemma 4, filling in the numbers it finds, and letting the user correct them,
// and ensures a person always confirms what the AI read before any results are shown.
// Tests that already have their own guideline cards, so they are not repeated in "Other results".
const KEY_TESTS = /a1c|glucose|\bldl\b|\bhdl\b|triglycer|blood pressure|systolic|diastolic/i;

export default function NumbersForm({ inputs, setInputs, onSubmit, labPhoto, onPhotoUsed, extraTests = [], setExtraTests }) {
  const [scan, setScan] = useState({ status: labPhoto ? 'reading' : 'idle' });
  const set = (key, value) => setInputs((prev) => ({ ...prev, [key]: value }));
  const p = { inputs, set };
  const filled = Object.entries(inputs).some(([k, v]) => k !== 'sex' && v !== '') || extraTests.length > 0;

  // This part of the code is responsible for sending the uploaded photo or PDF to Gemma in the application.
  // It handles turning the file into page images, calling /api/read-labs, and merging the numbers Gemma found into the form,
  // and ensures the upload is used once and then released, so it's never re-sent or kept around.
  useEffect(() => {
    if (!labPhoto) return;
    let cancelled = false;
    (async () => {
      try {
        setScan({ status: 'reading' });
        const images = await fileToImages(labPhoto);
        const res = await fetch('/api/read-labs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        if (cancelled) return;
        const found = Object.entries(data.values).filter(([, v]) => v !== '');
        const others = (data.tests || []).filter((t) => !KEY_TESTS.test(t.name));
        setInputs((prev) => ({ ...prev, ...Object.fromEntries(found) }));
        setExtraTests?.(others);
        setScan({ status: 'done', count: found.length, others: others.length, notes: data.notes });
      } catch (err) {
        if (!cancelled) setScan({ status: 'error', message: err.message });
      } finally {
        onPhotoUsed?.();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labPhoto]);

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (filled) onSubmit(); }}>
      {scan.status === 'reading' && (
        <div className="scan-banner bg-lavender"><span className="wiggle" style={{ display: 'inline-block' }}>✨</span> Gemma 4 is reading your lab report…</div>
      )}
      {scan.status === 'done' && (
        <div className="scan-banner bg-mint">
          ✨ Gemma found <strong>{scan.count}</strong> key number{scan.count === 1 ? '' : 's'}
          {scan.others > 0 && <> and <strong>{scan.others}</strong> other test result{scan.others === 1 ? '' : 's'}</>}.
          Please double-check them against your report before continuing.
          {scan.notes && <div className="small">Note: {scan.notes}</div>}
        </div>
      )}
      {scan.status === 'error' && (
        <div className="scan-banner bg-pink">Couldn't read that file ({scan.message}). You can type your numbers in instead.</div>
      )}

      <div className="card stack">
        <div className="row-between">
          <div>
            <h1>Your numbers</h1>
            <p className="muted">Every field is optional. Fill in what you have.</p>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => setInputs(SAMPLE)}>Try a sample</button>
            <button type="button" className="btn" onClick={() => { setInputs(EMPTY); setExtraTests?.([]); }}>Clear</button>
          </div>
        </div>

        <fieldset>
          <legend>Blood sugar</legend>
          <div className="grid">
            <Field id="a1c" label="A1c" unit="%" hint="Often listed as HbA1c" {...p} />
            <Field id="glucose" label="Fasting glucose" unit="mg/dL" hint="After 8+ hours without food" {...p} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Blood pressure</legend>
          <div className="grid">
            <Field id="systolic" label="Top number" unit="mmHg" {...p} />
            <Field id="diastolic" label="Bottom number" unit="mmHg" {...p} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Cholesterol</legend>
          <div className="grid">
            <Field id="ldl" label="LDL" unit="mg/dL" {...p} />
            <Field id="hdl" label="HDL" unit="mg/dL" {...p} />
            <Field id="tg" label="Triglycerides" unit="mg/dL" {...p} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Body</legend>
          <div className="grid">
            <Field id="heightFt" label="Height (ft)" unit="ft" {...p} />
            <Field id="heightIn" label="Height (in)" unit="in" {...p} />
            <Field id="weightLb" label="Weight" unit="lb" {...p} />
            <Field id="waist" label="Waist" unit="in" hint="At the belly button" {...p} />
          </div>
          <label className="field sex">
            <span>Sex assigned at birth</span>
            <select value={inputs.sex} onChange={(e) => set('sex', e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
            <span className="hint">Only used for waist and HDL ranges.</span>
          </label>
        </fieldset>

        {extraTests.length > 0 && (
          <p className="small">Plus {extraTests.length} other result{extraTests.length === 1 ? '' : 's'} from your report (like {extraTests.slice(0, 3).map((t) => t.name).join(', ')}). You'll see them on the next page.</p>
        )}

        <button className="btn primary big" type="submit" disabled={!filled || scan.status === 'reading'}>
          See what my numbers mean →
        </button>
      </div>
    </form>
  );
}