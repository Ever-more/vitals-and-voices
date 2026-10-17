// This part of the code is responsible for verifying the AI connection in the application.
// It handles one test request to Gemma 4 using the key in .env,
// and ensures the model ID and key work before any features are built on top of them.
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemma-4-26b-a4b-it',
  contents: 'In two sentences, explain what an A1c of 5.9% means for a patient. Do not diagnose.',
});

console.log(response.text);
