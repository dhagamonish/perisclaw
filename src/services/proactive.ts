import cron from 'node-cron';
import { state } from './state.js';
import logger from './logger.js';
import { env } from '../config/env.js';
import { astraCalendar } from './google.js';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export function setupProactiveTasks() {
  // 1. Morning Briefing: 9:00 AM IST (3:30 AM UTC)
  cron.schedule('30 3 * * *', async () => {
    logger.info('Running Morning Intelligence Briefing...');
    await sendMorningBrief();
  });
}

async function sendMorningBrief() {
  const sock = state.getSock();
  const jid = env.AUTHORIZED_USER_NUMBER + '@s.whatsapp.net';
  
  if (!sock) {
    logger.warn('WhatsApp not connected, skipping morning brief');
    return;
  }

  try {
    // A. Gather Data
    const calendar = await astraCalendar('', 'list').catch(() => 'No calendar data');
    
    const { data: reminders } = await supabase
      .from('reminders')
      .select('text')
      .eq('status', 'PENDING')
      .limit(5);

    const { data: memories } = await supabase
      .from('memories')
      .select('content')
      .eq('type', 'COMMITMENT')
      .order('created_at', { ascending: false })
      .limit(5);

    // B. AI Synthesis
    const prompt = `
      You are Astra EA. Generate a concise, stoic Morning Intelligence Brief for your executive.
      
      DATA:
      - Calendar: ${calendar}
      - Pending Reminders: ${reminders?.map(r => r.text).join(', ')}
      - Recent Commitments: ${memories?.map(m => m.content).join(', ')}
      
      Format:
      🌅 *Daily Intelligence Brief*
      
      *Today's Schedule:*
      (Bullet points)
      
      *Active Commitments:*
      (Bullet points)
      
      *Action Items:*
      (Bullet points)
      
      Keep it brief and high-impact.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });

    const brief = completion.choices[0].message.content;
    if (brief) {
      await sock.sendMessage(jid, { text: brief });
      logger.info('Morning brief sent successfully');
    }
  } catch (err) {
    logger.error(err, 'Failed to generate morning brief');
  }
}
