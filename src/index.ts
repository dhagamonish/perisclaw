import logger from './services/logger.js';
import { env } from './config/env.js';
import { initializeWhatsApp } from './services/whatsapp.js';
import { startDashboard } from './services/dashboard.js';
import { startupReminderSweep } from './services/reminders.js';
import { state } from './services/state.js';
import { setupProactiveTasks } from './services/proactive.js';

async function main() {
  logger.info('Astra EA starting...');

  // Start Live Dashboard
  startDashboard();

  // Check for critical missing keys and log warnings
  if (!env.GROQ_API_KEY) logger.warn('GROQ_API_KEY is missing. Intelligence will be disabled.');
  if (!env.SUPABASE_URL) logger.warn('SUPABASE_URL is missing. Persistence will be disabled.');

  // Initialize WhatsApp Bridge
  await initializeWhatsApp();

  // Run startup reminder sweep and schedule pending tasks
  const activeSock = state.getSock();
  if (activeSock) {
    await startupReminderSweep(activeSock);
    setupProactiveTasks();
  }
  
  logger.info('Astra EA Bridge Active. Waiting for messages...');
}

main().catch((err) => {
  logger.error(err, 'Critical error during initialization');
  process.exit(1);
});
