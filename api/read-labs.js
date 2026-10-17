/* global process */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemma-4-26b-a4b-it';
const FIELDS = ['a1c', 'glucose', 'systolic', 'diastolic', 'ldl', 'hdl', 'tg', 'waist', 'heightFt', 'heightIn', 'weightLb'];

// This part of the code is responsible for Gemma's lab-reading instructions in the application.
// It handles asking for the key heart and metabolic numbers plus every other test with its printed range and flag, as strict JSON,
// and ensures Gemma copies what is printed (never patient names, addresses, or IDs) and never guesses a value.
const PROMPT = `You are reading a patient's lab report or health screening (one or more pages, in order) for an educational app.
Return ONLY a JSON object with exactly these keys:
{"a1c": number or null (percent), "glucose": number or null (fasting glucose, mg/dL),
 "systolic": number or null, "diastolic": number or null (blood pressure, mmHg),
 "ldl": number or null, "hdl": number or null, "tg": number or null (triglycerides), all in mg/dL,
 "waist": number or null (inches), "heightFt": number or null, "heightIn": number or null, "weightLb": number or null,
 "tests": [ {"name": "test name as printed", "value": number, "unit": "unit as printed", "range": "reference range as printed", "flag": "H" or "L" or ""} ],
 "notes": "one short sentence about anything unclear, or empty string"}
Rules:
- "tests" lists EVERY numeric test result on the report (up to 40), including the key numbers above.
- Copy values, units and reference ranges exactly as printed. Never guess or calculate. Skip results that are not numbers.
- Join test names that wrap onto two lines (for example "Mean Corpuscular" + "Volume").
- For the key numbers, if units differ (for example mmol/L), use null and mention it in notes.
- Never include patient names, addresses, phone numbers, dates of birth, or ID numbers anywhere. No markdown.`;

// This part of the code is responsible for the "read my lab report" server endpoint in the application.
// It handles sending one photo or up to three PDF pages to Gemma 4, then cleaning the key numbers and the full test list,
// and ensures the API key stays on the server and uploads are never stored, only read once and discarded.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { image, images } = req.body || {};
  const pages = (Array.isArray(images) ? images : image ? [image] : []).slice(0, 3);
  if (!pages.length) return res.status(400).json({ error: 'No image provided' });
  if (pages.reduce((n, p) => n + p.length, 0) > 4_000_000) return res.status(413).json({ error: 'Upload is too large' });

  try {
    const parts = [...pages.map((data) => ({ inlineData: { mimeType: 'image/jpeg', data } })), { text: PROMPT }];
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: { temperature: 0, maxOutputTokens: 3000 },
    });
    const text = response.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    const raw = match ? JSON.parse(match[0]) : {};

    const values = {};
    for (const f of FIELDS) {
      const n = Number(raw[f]);
      values[f] = raw[f] != null && Number.isFinite(n) && n > 0 ? String(n) : '';
    }
    const tests = (Array.isArray(raw.tests) ? raw.tests : [])
      .map((t) => ({
        name: String(t?.name || '').trim().slice(0, 80),
        value: Number(t?.value),
        unit: String(t?.unit || '').trim().slice(0, 20),
        range: String(t?.range || '').trim().slice(0, 30),
        flag: String(t?.flag || '').trim().slice(0, 2),
      }))
      .filter((t) => t.name && Number.isFinite(t.value))
      .slice(0, 40);

    res.status(200).json({ values, tests, notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 300) : '', model: MODEL });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}