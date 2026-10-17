// This part of the code is responsible for checking a professional's NPI number in the application.
// It handles looking the number up in the official CMS NPI Registry and returning the registered name, credential, and specialty,
// and ensures pro badges are backed by a real government record instead of whatever someone types in.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const npi = String((req.body || {}).npi || '').replace(/\D/g, '');
  if (npi.length !== 10) return res.status(400).json({ error: 'An NPI number has exactly 10 digits.' });

  try {
    const r = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`);
    if (!r.ok) throw new Error(`Registry returned ${r.status}`);
    const data = await r.json();
    const hit = data.results?.[0];
    if (!hit) return res.status(200).json({ found: false });

    const basic = hit.basic || {};
    const primary = (hit.taxonomies || []).find((t) => t.primary) || (hit.taxonomies || [])[0] || {};
    res.status(200).json({
      found: true,
      individual: hit.enumeration_type === 'NPI-1',
      firstName: basic.first_name || '',
      lastName: basic.last_name || '',
      credential: basic.credential || '',
      active: basic.status ? basic.status === 'A' : true,
      specialty: primary.desc || '',
      state: primary.state || '',
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}