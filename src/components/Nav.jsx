// This part of the code is responsible for the top navigation in the application.
// It handles the logo, the main page links, and the medical-pro button, highlighting the current page,
// and ensures users can move between every part of the app from anywhere.
export default function Nav({ page, go }) {
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'resource', label: 'Resources' },
    { id: 'community', label: 'Communities' },
  ];
  return (
    <header className="container nav">
      <button className="logo" onClick={() => go('home')} aria-label="Vitals & Voices home">
        <span className="logo-mark" aria-hidden="true">♥</span>
        <span className="logo-text">Vitals &amp; Voices</span>
      </button>
      <nav className="nav-links" aria-label="Main">
        {links.map((l) => (
          <button key={l.id} className={`nav-link ${page === l.id ? 'active' : ''}`}
            aria-current={page === l.id ? 'page' : undefined} onClick={() => go(l.id)}>
            {l.label}
          </button>
        ))}
      </nav>
      <button className="btn bg-lavender" onClick={() => go('verify')}>I'm a medical pro</button>
    </header>
  );
}