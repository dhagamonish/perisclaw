import logger from './services/logger.js';
import { env } from './config/env.js';
import { initializeWhatsApp } from './services/whatsapp.js';
import { startDashboard } from './services/dashboard.js';
import { checkReminders } from './services/reminders.js';

async function main() {
  logger.info('Astra EA starting...');

  // Start Live Dashboard
  startDashboard();

  // Check for critical missing keys and log warnings
  if (!env.GROQ_API_KEY) logger.warn('GROQ_API_KEY is missing. Intelligence will be disabled.');
  if (!env.SUPABASE_URL) logger.warn('SUPABASE_URL is missing. Persistence will be disabled.');

  // Initialize WhatsApp Bridge
  const sock = await initializeWhatsApp();

  // Start Reminder Polling (every 60 seconds)
  setInterval(async () => {
    await checkReminders(async (reminder) => {
      logger.info({ reminderId: reminder.id }, 'Sending due reminder to WhatsApp');
      await sock.sendMessage(reminder.user_jid, { 
        text: `🚨 *STRICT REMINDER*\n\n${reminder.text}\n\nAction required.` 
      });
    });
  }, 60000);
  
  logger.info('Astra EA Bridge Active. Waiting for messages...');
}

main().catch((err) => {
  logger.error(err, 'Critical error during initialization');
  process.exit(1);
});
