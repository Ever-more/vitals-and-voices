/* global process */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemma-4-26b-a4b-it';

// This part of the code is responsible for Gemma's community safety rules in the application.
// It handles the shared instructions sent with every community request,
// and ensures Gemma supports patients without diagnosing, prescribing, or letting harmful advice through.
const SYSTEM = `You help run "Vitals & Voices", a health support community where patients ask questions,
verified medical professionals answer with general education, and peers share lived experience.
Never diagnose anyone or recommend medication changes. Use plain, warm language. No markdown.`;

// This part of the code is responsible for building each community prompt in the application.
// It handles three jobs: moderating and routing a new post, summarizing a channel, and rewriting a pro's answer in plain words,
// and ensures each Gemma task gets exact instructions and a predictable reply format.
const PROMPTS = {
  moderate: ({ text, role }) => `Review this new post written by a ${role || 'member'}:
"""${String(text).slice(0, 1500)}"""
Flag it if it tells people to stop, skip or change medication; promises a cure or a product that replaces treatment;
diagnoses or prescribes for a specific person; sells products, links or codes; or shames or insults anyone.
Personal experience framed as "what worked for me" is fine. Also decide the best channel and the best type of professional to answer.
Respond with ONLY a JSON object:
{"verdict":"approve" or "flag","reason":"one short sentence","suggestion":"a safer rewrite in one or two sentences, or empty string",
"channel":"ask-a-pro" or "tips-and-tricks" or "wins" or "vent" or "resources","pro":"Nurse" or "Physician" or "Pharmacist" or "EMS" or "Resident" or "none"}`,
  summarize: ({ channel, posts }) => `Here are recent posts from the #${channel} channel:
${String(posts).slice(0, 4000)}
Summarize them for someone catching up in exactly 3 short bullet points, each starting with "- ".`,
  plain: ({ text }) => `A medical professional wrote this answer:
"""${String(text).slice(0, 1500)}"""
Rewrite it in plain words a 5th grader understands, in 3 or 4 short sentences. Keep every fact and number exactly the same and add nothing new.`,
};

// This part of the code is responsible for reading Gemma's moderation verdict in the application.
// It handles replies wrapped in extra words or code fences, and keeps only allowed values,
// and ensures a confusing reply fails safe by holding the post for review instead of publishing it.
function parseVerdict(text) {
  try {
    const raw = JSON.parse((text.match(/\{[\s\S]*\}/) || ['{}'])[0]);
    const channels = ['ask-a-pro', 'tips-and-tricks', 'wins', 'vent', 'resources'];
    return {
      verdict: raw.verdict === 'approve' ? 'approve' : 'flag',
      reason: raw.reason || '',
      suggestion: raw.suggestion || '',
      channel: channels.includes(raw.channel) ? raw.channel : 'ask-a-pro',
      pro: raw.pro && raw.pro !== 'none' ? raw.pro : '',
    };
  } catch {
    return { verdict: 'flag', reason: 'Gemma could not decide, so a verified pro will review this post.', suggestion: '', channel: 'ask-a-pro', pro: '' };
  }
}

// This part of the code is responsible for the community server endpoint in the application.
// It handles routing each request to the right Gemma task and returning its result,
// and ensures the API key stays on the server for every community feature.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { task, ...payload } = req.body || {};
  if (!PROMPTS[task]) return res.status(400).json({ error: 'Unknown task' });
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: PROMPTS[task](payload),
      config: { systemInstruction: SYSTEM, temperature: task === 'moderate' ? 0 : 0.4, maxOutputTokens: 500 },
    });
    const text = response.text || '';
    if (task === 'moderate') return res.status(200).json({ ...parseVerdict(text), model: MODEL });
    res.status(200).json({ text, model: MODEL });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}