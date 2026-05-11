import { 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  WASocket,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import logger from './logger.js';
import path from 'path';
import { env } from '../config/env.js';
import { parseIntent, processVoiceNote, AstraIntent } from './ai.js';
import { setPendingAction, getPendingAction, clearPendingAction } from './state.js';
import { addReminder } from './reminders.js';
import { createCalendarEvent, getAuthUrl } from './google.js';
import { useSupabaseAuthState } from './auth.js';

export async function initializeWhatsApp() {
  const { state, saveCreds } = await useSupabaseAuthState('astra_production_v1');
  const { version } = await fetchLatestBaileysVersion();

  logger.info({ version }, 'Starting WhatsApp Socket');

  const sock: WASocket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger as any,
    browser: ['Windows', 'Chrome', '114.0.5735.199'],
  });

  // Handle Pairing Code if phone number is provided
  if (env.WA_PHONE_NUMBER && !sock.authState.creds.registered) {
    logger.info({ phone: env.WA_PHONE_NUMBER }, 'Requesting Pairing Code...');
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(env.WA_PHONE_NUMBER);
        logger.info('--- WHATSAPP PAIRING CODE ---');
        logger.info(`YOUR CODE: ${code}`);
        logger.info('-----------------------------');
      } catch (err) {
        logger.error(err, 'Failed to request pairing code');
      }
    }, 3000); // Wait for socket to be ready
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('New QR Code received. Please scan with WhatsApp.');
      qrcode.generate(qr, { small: true });
      
      // Also save as image for easier access
      const qrPath = path.join(process.cwd(), 'qr.png');
      QRCode.toFile(qrPath, qr, (err) => {
        if (err) logger.error(err, 'Failed to save QR code to file');
        else logger.info({ path: qrPath }, 'QR Code saved to file');
      });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.warn({ reason: lastDisconnect?.error, shouldReconnect }, 'Connection closed');
      
      if (shouldReconnect) {
        initializeWhatsApp();
      }
    } else if (connection === 'open') {
      logger.info('WhatsApp Connection Opened Successfully');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        // Only process messages from the owner (you)
        // We check for primary number, second number, or the internal LID
        const keyString = JSON.stringify(msg.key);
        const isFromOwner = 
          keyString.includes(env.WA_PHONE_NUMBER) || 
          keyString.includes(env.AUTHORIZED_USER_NUMBER) ||
          keyString.includes('10527669489749');
        
        // Skip if not from authorized sources OR if it's Astra's own response
        const isAstraReplying = msg.key.fromMe && msg.message?.conversation?.includes('Confirm?');
        
        if (!isFromOwner || isAstraReplying) {
          if (!isFromOwner) logger.debug({ from: msg.key.remoteJid }, 'Ignoring unauthorized sender');
          continue;
        }

        let intent: AstraIntent | null = null;
        let text = '';
        if (msg.message?.conversation) {
          text = msg.message.conversation;
        } else if (msg.message?.extendedTextMessage?.text) {
          text = msg.message.extendedTextMessage.text;
        }

        logger.info({ from: msg.key.remoteJid, text: text }, 'Incoming Message');

        try {
          if (msg.message?.audioMessage) {
            logger.info('Processing Voice Note with Gemini...');
            const buffer = await downloadMediaMessage(msg, 'buffer', {});
            intent = await processVoiceNote(buffer as Buffer);
          } else {
            if (msg.message?.conversation) {
              text = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
              text = msg.message.extendedTextMessage.text;
            }

            if (text) {
              if (text.toLowerCase().includes('authorize')) {
                const url = getAuthUrl();
                await sock.sendMessage(msg.key.remoteJid!, { 
                  text: `🔐 *Astra Authorization*\n\nPlease click the link below to grant me access to your Calendar and Gmail:\n\n${url}\n\nI will notify you once it is complete.`
                });
                return;
              }
              intent = await parseIntent(text);
            }
          }

          if (intent && intent.type !== 'UNKNOWN') {
            if (intent.type === 'CLARIFY') {
              await sock.sendMessage(msg.key.remoteJid!, { text: intent.summary });
              return;
            }

            // Store as pending action
            setPendingAction(msg.key.remoteJid!, intent);
            
            const responseText = `${intent.summary}\n\nConfirm? (React or reply "Yes")`;
            logger.info({ summary: intent.summary }, 'Astra Sending Summary Response');
            await sock.sendMessage(msg.key.remoteJid!, { text: responseText });
          } 
          // Handle Confirmation
          else if (text.toLowerCase() === 'yes') {
            const pending = getPendingAction(msg.key.remoteJid!);
            if (pending) {
              logger.info({ intent: pending.type }, 'Executing Confirmed Action');
              
              try {
                if (pending.type === 'REMINDER') {
                  await addReminder({
                    user_jid: msg.key.remoteJid!,
                    text: pending.summary,
                    due_at: pending.data.dueAt || new Date().toISOString(),
                    status: 'PENDING'
                  });
                  await sock.sendMessage(msg.key.remoteJid!, { text: 'Stoic Success: Reminder set.' });
                } else if (pending.type === 'CALENDAR') {
                  // TODO: Fetch real tokens from Supabase
                  // For now, we log the intent
                  logger.info(pending.data, 'Calendar logic would execute here with OAuth2 tokens');
                  await sock.sendMessage(msg.key.remoteJid!, { text: 'Stoic Success: Calendar event scheduled (OAuth pending).' });
                }
                
                clearPendingAction(msg.key.remoteJid!);
              } catch (err) {
                logger.error(err, 'Failed to execute confirmed action');
                await sock.sendMessage(msg.key.remoteJid!, { text: 'Stoic Error: Execution failed.' });
              }
            }
          }
        } catch (err) {
          logger.error(err, 'Message processing failed');
          await sock.sendMessage(msg.key.remoteJid!, { text: 'Stoic Error: Failed to process message.' });
        }
      }
    }
  });

  return sock;
}
