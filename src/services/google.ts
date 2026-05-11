import { google } from 'googleapis';
import { env } from '../config/env.js';
import logger from './logger.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// Scopes for Gmail and Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

/**
 * Loads tokens from Supabase
 */
async function loadTokens() {
  const { data, error } = await supabase
    .from('google_tokens')
    .select('tokens')
    .eq('user_id', 'astra_owner')
    .single();

  if (error || !data) return null;
  return data.tokens;
}

/**
 * Saves tokens to Supabase
 */
export async function saveTokens(tokens: any) {
  const { error } = await supabase
    .from('google_tokens')
    .upsert({ user_id: 'astra_owner', tokens, updated_at: new Date().toISOString() });
  
  if (error) logger.error(error, 'Failed to save Google tokens to Supabase');
  else logger.info('Google tokens saved to Supabase');
}

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

export async function astraGmail(query: string, action: string = 'search', details?: any) {
  const tokens = await loadTokens();
  if (!tokens) throw new Error('Google account not connected');
  
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  if (action === 'search') {
    const res = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 3 });
    if (!res.data.messages) return "No emails found for that query.";
    
    let summary = "I found these recent emails:\n";
    for (const msg of res.data.messages) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
      const subject = detail.data.payload?.headers?.find(h => h.name === 'Subject')?.value;
      summary += `- ${subject}\n`;
    }
    return summary;
  } 
  
  if (action === 'draft' || action === 'send') {
    if (!details?.to) {
      throw new Error('No recipient email address found. Please specify who to send to.');
    }

    const raw = Buffer.from(
      `To: ${details.to}\r\n` +
      `Subject: ${details.subject || '(No Subject)'}\r\n\r\n` +
      `${details.body || ''}`
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    if (action === 'draft') {
      await gmail.users.drafts.create({
        userId: 'me',
        requestBody: { message: { raw } }
      });
      return `Draft created for ${details.to}. Subject: ${details.subject}`;
    } else {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
      });
      return `Email sent successfully to ${details.to}! 🚀`;
    }
  }

  return "Action not yet supported.";
}

export async function astraCalendar(query: string, action: string = 'list', details?: any) {
  const tokens = await loadTokens();
  if (!tokens) throw new Error('Google account not connected');
  
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  if (action === 'list') {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items;
    if (!events || events.length === 0) return "Your calendar is clear.";

    let summary = "Upcoming events:\n";
    events.forEach(event => {
      const start = event.start?.dateTime || event.start?.date;
      summary += `- ${event.summary} (${start})\n`;
    });
    return summary;
  }

  if (action === 'create') {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: details.summary,
        description: details.description || 'Created by Astra EA',
        start: { dateTime: details.startTime, timeZone: 'UTC' },
        end: { dateTime: details.endTime, timeZone: 'UTC' },
      },
    });
    return `Event created: ${details.summary} at ${details.startTime}`;
  }

  return "Calendar action not supported.";
}

export { oauth2Client };
