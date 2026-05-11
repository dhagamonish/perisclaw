import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import logger from './logger.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export interface Reminder {
  id?: string;
  user_jid: string;
  text: string;
  due_at: string;
  status: 'PENDING' | 'SENT' | 'CANCELLED';
}

export async function addReminder(reminder: Reminder) {
  const { data, error } = await supabase
    .from('reminders')
    .insert([reminder])
    .select();

  if (error) {
    logger.error(error, 'Failed to add reminder to Supabase');
    throw error;
  }
  
  logger.info({ reminderId: data[0].id, dueAt: reminder.due_at, text: reminder.text }, 'Reminder added to Supabase');
  return data[0];
}

// Polling function to check for due reminders
export async function checkReminders(sock: any) {
  const now = new Date().toISOString();
  logger.info({ now }, 'Engine: Checking for due reminders');

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'PENDING')
    .lte('due_at', now);

  if (error) {
    logger.error(error, 'Engine: Failed to fetch reminders');
    return;
  }

  if (data && data.length > 0) {
    logger.info({ count: data.length }, 'Engine: Found due reminders! Sending now...');
    for (const reminder of data) {
      try {
        await sock.sendMessage(reminder.user_jid, {
          text: `🚨 *STRICT REMINDER*\n\n${reminder.text}\n\nAction required.`
        });

        await supabase
          .from('reminders')
          .update({ status: 'SENT' })
          .eq('id', reminder.id);
          
        logger.info({ id: reminder.id }, 'Engine: Reminder sent and marked as done');
      } catch (err) {
        logger.error(err, 'Engine: Failed to send reminder message');
      }
    }
  }
}
