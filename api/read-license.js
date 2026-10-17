/* global process */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemma-4-26b-a4b-it';

// This part of the code is responsible for Gemma's license-reading instructions in the application.
// It handles telling Gemma which fields to copy from a license or work badge photo and to return strict JSON,
// and ensures Gemma copies what is printed instead of guessing, so a blurry photo never produces a fake match.
const PROMPT = `This is a photo of a medical professional's license, certification card, or hospital work badge.
Return ONLY a JSON object: {"name": "full name as printed or empty string",
"profession": "e.g. Registered Nurse, Physician, Paramedic, Pharmacist, Resident, or empty string",
"number": "license, certification, or NPI number as printed, or empty string",
"state": "issuing state or empty string", "expires": "expiration date as printed or empty string",
"readable": true or false}
Copy text exactly as printed. Never guess. If you cannot read a field, use an empty string. No markdown.`;

// This part of the code is responsible for the license photo check endpoint in the application.
// It handles sending one shrunk photo to Gemma 4 and returning the fields it read,
// and ensures the photo is only read once and never stored, protecting professionals' private documents.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: 'No image provided' });
  if (image.length > 4_000_000) return res.status(413).json({ error: 'Image is too large' });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: image } }, { text: PROMPT }] }],
      config: { temperature: 0, maxOutputTokens: 300 },
    });
    const raw = JSON.parse(((response.text || '').match(/\{[\s\S]*\}/) || ['{}'])[0]);
    res.status(200).json({
      name: String(raw.name || ''), profession: String(raw.profession || ''), number: String(raw.number || ''),
      state: String(raw.state || ''), expires: String(raw.expires || ''), readable: raw.readable !== false, model: MODEL,
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}