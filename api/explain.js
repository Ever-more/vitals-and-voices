/* global process */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemma-4-26b-a4b-it';

// This part of the code is responsible for Gemma's safety rules in the application.
// It handles the system instruction sent with every explanation request,
// and ensures Gemma explains and supports rather than diagnosing or giving medication advice, which is a clinician's job.
const SYSTEM = `You are the plain-language explainer inside "Vitals & Voices", an educational health-literacy app.
Rules you must always follow:
- Explain, never diagnose. Say what range a number falls in, never that someone "has" a condition.
- Never recommend starting, stopping, or changing any medication.
- Use words a 6th grader understands. Be warm and calm, never alarming or shaming.
- Do not comment on weight or appearance beyond the numbers given.
- Always encourage talking with a clinician for decisions.`;

// This part of the code is responsible for the "Explain my numbers" server endpoint in the application.
// It handles receiving results already classified by guidelines or the lab's own ranges, asking Gemma 4 for a plain-language summary, and returning it,
// and ensures the API key stays on the server and Gemma only explains categories our code already computed.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { metrics = [], bp = null } = req.body || {};
  if (!metrics.length) return res.status(400).json({ error: 'No numbers provided' });

  const lines = metrics.slice(0, 40).map((m) => `- ${m.name}: ${m.value} ${m.unit || ''} → ${m.label}`).join('\n');
  const prompt = `These results were already classified using published guidelines (ADA, AHA/ACC, CDC) or the lab's own printed reference ranges:
${lines}
${bp ? `Overall blood pressure category: ${bp}` : ''}

Write a reply with exactly this structure:
1. Two or three short sentences explaining what these results mean together, focusing on anything outside its range and how results connect.
2. One encouraging sentence about what is within their control.
3. The line "Questions to ask your doctor:" followed by exactly 3 bullet points starting with "- ".
Keep it under 170 words. No headings, no bold, no emojis.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction: SYSTEM, temperature: 0.4, maxOutputTokens: 700 },
    });
    res.status(200).json({ text: response.text, model: MODEL });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}