import { google } from 'googleapis';
import { env } from '../config/env.js';
import logger from './logger.js';

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.modify'
];

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

export async function createCalendarEvent(tokens: any, eventData: any) {
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description || 'Created by Astra EA',
        start: {
          dateTime: eventData.startTime,
          timeZone: 'UTC', 
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: 'UTC',
        },
      },
    });
    logger.info({ eventId: res.data.id }, 'Calendar Event Created');
    return res.data;
  } catch (err) {
    logger.error(err, 'Failed to create calendar event');
    throw err;
  }
}

export async function searchEmails(tokens: any, query: string) {
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 5
    });

    const messages = await Promise.all(
      (res.data.messages || []).map(async (m) => {
        const detail = await gmail.users.messages.get({ userId: 'me', id: m.id! });
        return {
          id: m.id,
          snippet: detail.data.snippet,
          subject: detail.data.payload?.headers?.find(h => h.name === 'Subject')?.value
        };
      })
    );

    return messages;
  } catch (err) {
    logger.error(err, 'Failed to search emails');
    throw err;
  }
}

export async function draftEmail(tokens: any, to: string, subject: string, body: string) {
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const raw = Buffer.from(
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n\r\n` +
    `${body}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: raw
        }
      }
    });
    return res.data;
  } catch (err) {
    logger.error(err, 'Failed to create email draft');
    throw err;
  }
}
