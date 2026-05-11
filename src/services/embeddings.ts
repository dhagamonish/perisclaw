import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import logger from './logger.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!env.GEMINI_API_KEY) {
    logger.warn('Gemini API Key missing, skipping embedding generation');
    return [];
  }

  try {
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    logger.error(err, 'Failed to generate embedding');
    return [];
  }
}
