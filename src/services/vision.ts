import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import logger from './logger.js';
import { AstraIntent } from './ai.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<AstraIntent | null> {
  if (!env.GEMINI_API_KEY) {
    logger.warn('Gemini API Key missing, skipping vision analysis');
    return null;
  }

  try {
    logger.info('Analyzing image via Gemini Vision...');
    
    const prompt = `
      You are Astra EA. Analyze this image and determine the user's intent.
      If it is an invoice, extract amount, date, and vendor.
      If it is a business card, extract name and email.
      If it is a document, summarize it.
      
      Output ONLY valid JSON in the AstraIntent format:
      {
        "type": "GMAIL|CALENDAR|REMINDER|DRIVE|UNKNOWN",
        "summary": "Human summary of what you see",
        "data": { ... },
        "confidence": 0.9,
        "suggested_actions": [
          { "id": "1", "label": "📁 File in Vault", "type": "DRIVE", "summary": "Save this document to Google Drive", "data": { "action": "upload", "fileName": "..." } },
          { "id": "2", "label": "🚀 Action", "type": "...", "summary": "...", "data": { ... } }
        ]
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from markdown if present
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson) as AstraIntent;
  } catch (err) {
    logger.error(err, 'Failed to analyze image with Gemini');
    return null;
  }
}
