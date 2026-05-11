import { 
  DisconnectReason, 
  fetchLatestBaileysVersion,
  WASocket,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import logger from './logger.js';
import { env } from '../config/env.js';
import { parseIntent, processVoiceNote } from './ai.js';
import { state, SessionAction } from './state.js';
import { addReminder, scheduleReminder, startupReminderSweep } from './reminders.js';
import { astraGmail, astraCalendar } from './google.js';
import { useSupabaseAuthState } from './auth.js';

export async function initializeWhatsApp() {
  const { state: authState, saveCreds } = await useSupabaseAuthState('astra_production_v1');
  const { version } = await fetchLatestBaileysVersion();

  logger.info({ version }, 'Starting WhatsApp Socket');

  const sock: WASocket = makeWASocket({
    version,
    auth: authState,
    printQRInTerminal: false,
    logger: logger.child({ level: 'silent' }) as any,
    browser: ['Windows', 'Chrome', '114.0.5735.199'],
  });

  state.setSock(sock);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      logger.info('New QR Code received.');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      const isConflict = statusCode === DisconnectReason.connectionReplaced;
      
      if (shouldReconnect) {
        const delay = isConflict ? 30000 : 5000;
        if (isConflict) logger.warn('Connection conflict detected. Waiting 30s...');
        setTimeout(() => initializeWhatsApp(), delay);
      }
    } else if (connection === 'open') {
      logger.info('WhatsApp Connection Opened Successfully');
      startupReminderSweep(sock);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        const keyString = JSON.stringify(msg.key);
        const isFromOwner = keyString.includes(env.WA_PHONE_NUMBER) || keyString.includes(env.AUTHORIZED_USER_NUMBER) || keyString.includes('10527669489749');
        
        if (!isFromOwner || msg.key.fromMe) continue;

        let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        
        // Handle Voice Notes
        if (!text && msg.message?.audioMessage) {
          logger.info('Processing Voice Note...');
          const buffer = await downloadMediaMessage(msg, 'buffer', {});
          const intent = await processVoiceNote(buffer as Buffer);
          await handleIntent(sock, msg, intent);
          continue;
        }

        try {
          // INTERACTIVE CHOICE HANDLING
          const currentSession = state.getSession(msg.key.remoteJid!);
          const choice = text.trim();
          
          if (currentSession && /^\d+$/.test(choice)) {
            const selectedAction = currentSession.find(a => a.id === choice);
            if (selectedAction) {
              await executeAction(sock, msg, selectedAction);
              state.clearSession(msg.key.remoteJid!);
              continue;
            }
          }

          // NORMAL INTENT HANDLING
          const intent = await parseIntent(text);
          await handleIntent(sock, msg, intent);
        } catch (err) {
          logger.error(err, 'Message processing failed');
        }
      }
    }
  });
}

async function handleIntent(sock: any, msg: any, intent: any) {
  if (intent.type === 'UNKNOWN') return;

  if (intent.type === 'CLARIFY') {
    await sock.sendMessage(msg.key.remoteJid!, { text: `🤔 *Astra Needs Clarity*\n\n${intent.summary}` });
    return;
  }

  // Generate Interactive Hub
  const actions = intent.suggested_actions || [];
  if (actions.length > 0) {
    state.setSession(msg.key.remoteJid!, actions);
    let menu = `🕵️‍♂️ *Astra Intelligence Hub*\n\n${intent.summary}\n\n*What should I do?*\n`;
    actions.forEach((a: SessionAction) => {
      menu += `\n${a.id}. ${a.label}`;
    });
    menu += `\n\n_Reply with the number to execute._`;
    await sock.sendMessage(msg.key.remoteJid!, { text: menu });
  } else {
    // Default fallback
    await sock.sendMessage(msg.key.remoteJid!, { text: `✅ *Astra Understood:*\n${intent.summary}` });
  }
}

async function executeAction(sock: any, msg: any, action: SessionAction) {
  try {
    await sock.sendMessage(msg.key.remoteJid!, { text: `⚙️ *Executing:* ${action.label}...` });
    
    let result = '';
    if (action.type === 'GMAIL') {
      result = await astraGmail(action.data.query, action.data.action, action.data);
    } else if (action.type === 'CALENDAR') {
      result = await astraCalendar(action.data.summary, action.data.action, action.data);
    } else if (action.type === 'REMINDER') {
      const reminder = await addReminder({
        user_jid: msg.key.remoteJid!,
        text: action.summary,
        due_at: action.data.dueAt || new Date().toISOString(),
        status: 'PENDING'
      });
      scheduleReminder(sock, reminder);
      result = 'Stoic success: Reminder set.';
    }

    await sock.sendMessage(msg.key.remoteJid!, { text: `✅ *Task Completed*\n\n${result}` });
  } catch (err: any) {
    logger.error(err, 'Execution failed');
    await sock.sendMessage(msg.key.remoteJid!, { text: `❌ *Execution Failed:* ${err.message}` });
  }
}
