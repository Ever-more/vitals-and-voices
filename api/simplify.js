import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemma-4-26b-a4b-it';
const LANG = { simple: 'very simple English', es: 'Spanish', pt: 'Portuguese', am: 'Amharic' };

// This part of the code is responsible for Gemma's rewriting rules in the application.
// It handles telling Gemma to keep every fact exactly the same while changing only the reading level or language,
// and ensures a simplified or translated guide never gains new medical claims that pros didn't review.
const SYSTEM = `You rewrite health guides that medical professionals already reviewed, for an educational app.
Rules: keep every fact, number and warning exactly as given. Do not add new medical facts, advice or numbers.
Use short sentences a 5th grader understands. Keep emergency instructions (like calling 911) clearly included.
Never diagnose or recommend medication changes. Plain text only, no markdown, no emojis.`;

// This part of the code is responsible for the "Explain it simpler" server endpoint in the application.
// It handles sending a reviewed guide to Gemma 4 with the chosen reading level or language and returning the rewrite,
// and ensures people who read in other languages or at lower reading levels get the same trusted information.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { title, text, language = 'simple' } = req.body || {};
  if (!text || !LANG[language]) return res.status(400).json({ error: 'Missing guide text or unsupported language' });

  const prompt = `Rewrite this guide titled "${title}" in ${LANG[language]}.
Write 5 to 7 short sentences, then a final line starting with "Ask your doctor:" and one question.
Guide:
${String(text).slice(0, 4000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { systemInstruction: SYSTEM, temperature: 0.3, maxOutputTokens: 700 },
    });
    res.status(200).json({ text: response.text, model: MODEL });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}