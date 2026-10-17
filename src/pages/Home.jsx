import { useRef } from 'react';

// This part of the code is responsible for the home page in the application.
// It handles the lab-report upload, the community entry point, pro-reviewed resources, and the About section,
// and ensures every visitor (patient, community member, or medical pro) sees their starting point right away.
export default function Home({ go, onUpload }) {
  const fileRef = useRef(null);

  // This part of the code is responsible for receiving the lab report photo in the application.
  // It handles the file the user picks and passes it up to the app before moving to the number check,
  // and ensures Gemma can read the photo in the next step (Step 3) without asking for it again.
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const communities = [
    { name: 'Type 2 Diabetes', bg: 'bg-mint' },
    { name: 'Heart & Blood Pressure', bg: 'bg-pink' },
    { name: 'Lupus', bg: 'bg-sky' },
    { name: 'Migraine', bg: 'bg-butter' },
    { name: 'Rare Disease Circle', bg: 'bg-peach' },
  ];

  // This part of the code is responsible for the resource cards on the home page in the application.
  // It handles each guide's tag, title, reviewer, and the topic id the Resource page uses to open the right guide,
  // and ensures clicking a card lands on that exact guide instead of a generic page.
  const resources = [
    { tag: 'Blood sugar', tagBg: 'bg-mint', title: 'Prediabetes 101', by: 'Reviewed by an RN', topic: 'prediabetes' },
    { tag: 'Heart', tagBg: 'bg-pink', title: 'Reading your blood pressure', by: 'Reviewed by a physician', topic: 'bp' },
    { tag: 'Cholesterol', tagBg: 'bg-butter', title: 'LDL, HDL, triglycerides, decoded', by: 'Reviewed by a pharmacist', topic: 'cholesterol' },
    { tag: 'Any condition', tagBg: 'bg-sky', title: 'Preparing for a doctor visit', by: 'Reviewed by a resident', topic: 'visit' },
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <span className="sticker bg-butter">Health, explained by people who get it</span>
          <h1>Your health numbers, finally in plain words.</h1>
          <svg className="squiggle" aria-hidden="true" width="220" height="16" viewBox="0 0 220 16">
            <path d="M3 9 Q 15 2 27 9 T 51 9 T 75 9 T 99 9 T 123 9 T 147 9 T 171 9 T 195 9 T 217 9"
              fill="none" stroke="var(--hot-pink)" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <p className="lede">Upload your lab results, see what each number means, then learn from nurses, doctors, EMS and people living it.</p>

          <div className="upload-card">
            <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
              <span className="upload-icon float" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
                </svg>
              </span>
              <div>
                <h2 className="upload-title">Snap or upload your lab report</h2>
                <p className="small">Photo, screenshot, or PDF from your patient portal. Gemma 4 reads the numbers for you.</p>
              </div>
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => fileRef.current?.click()}>Upload lab report</button>
              <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" hidden onChange={handleFile} />
              <button className="link-btn" onClick={() => go('check')}>or type your numbers in</button>
            </div>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-card art-1 float">
            <div className="small">A1c</div>
            <div className="value">5.9%</div>
            <div className="mini-bar"><span className="bg-mint" style={{ width: '30%' }} /><span className="bg-peach" style={{ width: '15%' }} /><span className="bg-pink" style={{ width: '55%' }} /></div>
            <span className="pill p-watch">Prediabetes range</span>
          </div>
          <div className="art-card art-2 bg-mint float" style={{ animationDelay: '-2s' }}>
            <div className="small">Maya R. · RN</div>
            <div>Totally normal to feel worried. Here's what that number means…</div>
          </div>
          <div className="art-card art-3 bg-lavender float" style={{ animationDelay: '-1s' }}>
            <div className="small">Marcus · lived experience</div>
            <div>A 10-minute walk after dinner changed my numbers.</div>
          </div>
          <svg className="art-star" width="54" height="54" viewBox="0 0 24 24" fill="var(--butter)" stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M12 2l2.6 6.4L21 9l-5 4.4L17.5 20 12 16.6 6.5 20 8 13.4 3 9l6.4-.6z" />
          </svg>
          <svg className="art-heart wiggle" width="44" height="44" viewBox="0 0 24 24" fill="var(--pink)" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </div>
      </section>

      <section className="community-band">
        <div className="band-copy">
          <h2>Just here for the community?</h2>
          <p>Skip the upload. Join a community for any condition, rare or common, and get tips, support and answers from verified pros.</p>
          <div className="row" style={{ marginTop: 14 }}>
            {communities.map((c) => (
              <button key={c.name} className={`chip ${c.bg}`} onClick={() => go('community')}>{c.name}</button>
            ))}
            <button className="chip chip-dashed" onClick={() => go('community')}>+ more</button>
          </div>
        </div>
        <div className="band-actions">
          <button className="btn bg-butter big-ish" onClick={() => go('community')}>Join a community</button>
          <button className="link-btn" onClick={() => go('verify')}>Medical pro? Get verified to answer</button>
        </div>
      </section>

      <section id="resources" className="section">
        <h2>Resources, reviewed by pros</h2>
        <div className="resource-grid">
          {resources.map((r) => (
            <button key={r.title} className="card resource-card" onClick={() => go('resource', r.topic)}>
              <span className={`sticker ${r.tagBg} small`}>{r.tag}</span>
              <span className="resource-title">{r.title}</span>
              <span className="small">{r.by}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="about" className="section about">
        <div className="about-copy">
          <h2>About us</h2>
          <p>Millions of people get lab results they can't read, and medical workers want to help but have nowhere safe to do it. Vitals &amp; Voices brings them together. Built at Hack@URI by [team names].</p>
        </div>
        <div className="about-grid">
          <div className="card bg-mint"><h3>Plain words</h3><p className="small">Gemma turns jargon into language anyone can follow.</p></div>
          <div className="card bg-peach"><h3>Real people</h3><p className="small">Verified pros and peers with lived experience.</p></div>
          <div className="card bg-sky"><h3>Safe by design</h3><p className="small">Every post is checked by Gemma before it goes live.</p></div>
        </div>
      </section>
    </div>
  );
}