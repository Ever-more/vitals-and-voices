/* global process */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemma-4-26b-a4b-it';
const FIELDS = ['a1c', 'glucose', 'systolic', 'diastolic', 'ldl', 'hdl', 'tg', 'waist', 'heightFt', 'heightIn', 'weightLb'];

// This part of the code is responsible for Gemma's lab-reading instructions in the application.
// It handles asking for the key numbers plus every other test in a compact list format (shorter replies come back faster),
// and ensures Gemma copies what is printed, never guesses, and never repeats personal details.
const PROMPT = `You are reading a patient's lab report or health screening for an educational app.
Return ONLY a JSON object with exactly these keys:
{"a1c": number or null, "glucose": number or null (fasting, mg/dL), "systolic": number or null, "diastolic": number or null,
 "ldl": number or null, "hdl": number or null, "tg": number or null (triglycerides), "waist": number or null (inches),
 "heightFt": number or null, "heightIn": number or null, "weightLb": number or null,
 "tests": [["test name", value, "unit", "reference range", "H or L or empty"], ...],
 "notes": "one short sentence about anything unclear, or empty string"}
Rules: "tests" lists every numeric test result (up to 30), each as a 5-item array. Copy values, units and ranges exactly as printed.
Join test names that wrap onto two lines. Never guess or calculate. If a key number uses different units (like mmol/L), use null.
Never include names, addresses, phone numbers, birth dates, or ID numbers. No markdown, no extra words.`;

// This part of the code is responsible for the "read my lab report" server endpoint in the application.
// It handles report text (fast path for digital PDFs) or up to three images, then cleans the key numbers and the test list,
// and ensures the API key stays on the server and uploads are never stored, only read once and discarded.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { image, images, text } = req.body || {};
  const pages = (Array.isArray(images) ? images : image ? [image] : []).slice(0, 3);
  if (!text && !pages.length) return res.status(400).json({ error: 'No report provided' });
  if (pages.reduce((n, p) => n + p.length, 0) > 4_000_000) return res.status(413).json({ error: 'Upload is too large' });

  const parts = text
    ? [{ text: `LAB REPORT TEXT:\n${String(text).slice(0, 12000)}\n\n${PROMPT}` }]
    : [...pages.map((data) => ({ inlineData: { mimeType: 'image/jpeg', data } })), { text: PROMPT }];

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: { temperature: 0, maxOutputTokens: 2000 },
    });
    const out = response.text || '';
    const match = out.match(/\{[\s\S]*\}/);
    const raw = match ? JSON.parse(match[0]) : {};

    const values = {};
    for (const f of FIELDS) {
      const n = Number(raw[f]);
      values[f] = raw[f] != null && Number.isFinite(n) && n > 0 ? String(n) : '';
    }
    const tests = (Array.isArray(raw.tests) ? raw.tests : [])
      .map((t) => (Array.isArray(t)
        ? { name: t[0], value: t[1], unit: t[2], range: t[3], flag: t[4] }
        : t || {}))
      .map((t) => ({
        name: String(t.name || '').trim().slice(0, 80),
        value: Number(t.value),
        unit: String(t.unit || '').trim().slice(0, 20),
        range: String(t.range || '').trim().slice(0, 30),
        flag: String(t.flag || '').trim().slice(0, 2),
      }))
      .filter((t) => t.name && Number.isFinite(t.value))
      .slice(0, 30);

    res.status(200).json({ values, tests, notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 300) : '', source: text ? 'text' : 'image', model: MODEL });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}