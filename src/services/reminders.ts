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
  
  logger.info({ reminderId: data[0].id }, 'Reminder added to Supabase');
  return data[0];
}

// Polling function to check for due reminders
export async function checkReminders(onDue: (reminder: Reminder) => Promise<void>) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'PENDING')
    .lte('due_at', new Date().toISOString());

  if (error) {
    logger.error(error, 'Error polling reminders');
    return;
  }

  for (const reminder of (data || [])) {
    try {
      await onDue(reminder);
      await supabase
        .from('reminders')
        .update({ status: 'SENT' })
        .eq('id', reminder.id);
    } catch (err) {
      logger.error(err, 'Failed to process due reminder');
    }
  }
}
