import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import logger from './logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export type IntentType = 'CALENDAR' | 'GMAIL' | 'REMINDER' | 'CLARIFY' | 'UNKNOWN';

export interface AstraIntent {
  type: IntentType;
  summary: string;
  data: any;
  confidence: number;
  suggested_actions?: any[];
  extracted_memories?: any[];
}

const SYSTEM_PROMPT = `
You are Astra EA, a stoic and efficient executive assistant.
Your task is to parse user input into structured JSON intents.

Supported Intent Types:
1. CALENDAR: Scheduling or listing events.
1. CALENDAR: Scheduling or checking meetings.
2. GMAIL: Sending, drafting, or searching emails.
3. REMINDER: Setting follow-up tasks.
4. CLARIFY: When critical info is missing.
5. UNKNOWN: Chatter or unintelligible.

Output JSON Format:
{
  "type": "INTENT_TYPE",
  "summary": "Short summary",
  "data": { ... },
  "confidence": 0.0 to 1.0,
  "suggested_actions": [ ... ],
  "extracted_memories": [
    { "content": "I promised to send the report", "type": "COMMITMENT", "due_at": "ISO_UTC" }
  ]
}

IMPORTANT RULES:
- ALWAYS look for implicit promises (e.g. "I'll call you later") or facts (e.g. "My flight is tomorrow") and include them in 'extracted_memories'.
- For GMAIL and CALENDAR, always provide at least 2-3 interactive options.
- Use high-impact emojis in labels.
- Output ONLY valid JSON.
`;

export async function parseIntent(text: string): Promise<AstraIntent> {
  if (!env.GROQ_API_KEY) {
    logger.warn('Groq API Key missing, skipping parsing');
    return { type: 'UNKNOWN', summary: 'AI Parsing disabled (No API Key)', data: {}, confidence: 0 };
  }

  const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const dynamicPrompt = `${SYSTEM_PROMPT}\n\nCURRENT_TIME_IN_INDIA: ${now}\nIMPORTANT: For reminders, always calculate the 'dueAt' field as a UTC ISO string based on the current time provided above.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: dynamicPrompt },
        { role: 'user', content: text }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(content) as AstraIntent;
    
    logger.info({ intent: parsed.type, confidence: parsed.confidence }, 'Intent Parsed via Groq (Llama 3)');
    return parsed;
  } catch (err: any) {
    logger.error({ message: err.message }, 'Failed to parse intent with Groq');
    return { type: 'UNKNOWN', summary: 'Error parsing intent', data: {}, confidence: 0 };
  }
}

export async function processVoiceNote(audioBuffer: Buffer): Promise<AstraIntent> {
  if (!env.GROQ_API_KEY) {
    logger.warn('Groq API Key missing, skipping voice processing');
    return { type: 'UNKNOWN', summary: 'Voice processing disabled', data: {}, confidence: 0 };
  }

  try {
    // Groq transcription requires a file on disk
    const tempFile = path.join(os.tmpdir(), `astra_voice_${Date.now()}.ogg`);
    fs.writeFileSync(tempFile, audioBuffer);

    logger.info('Transcribing audio via Groq Whisper...');
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempFile),
      model: 'whisper-large-v3-turbo',
    });

    // Cleanup
    fs.unlinkSync(tempFile);

    logger.info({ text: transcription.text }, 'Audio Transcribed via Groq');
    return await parseIntent(transcription.text);
  } catch (err: any) {
    logger.error({ message: err.message }, 'Failed to process voice note with Groq');
    return { type: 'UNKNOWN', summary: 'Error processing audio', data: {}, confidence: 0 };
  }
}
