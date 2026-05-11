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

// In-memory timer store to prevent duplicates
const activeTimers = new Map<string, NodeJS.Timeout>();

export async function addReminder(reminder: Reminder) {
  const { data, error } = await supabase
    .from('reminders')
    .insert([reminder])
    .select();

  if (error) {
    logger.error(error, 'Failed to add reminder to Supabase');
    throw error;
  }
  
  const newReminder = data[0];
  logger.info({ reminderId: newReminder.id, dueAt: newReminder.due_at }, 'Reminder persisted to Supabase');
  return newReminder;
}

/**
 * Schedules a reminder to be sent at the exact time.
 */
export function scheduleReminder(sock: any, reminder: Reminder) {
  if (!reminder.id) return;
  
  // Clear existing timer if any (for updates)
  if (activeTimers.has(reminder.id)) {
    clearTimeout(activeTimers.get(reminder.id));
  }

  const now = new Date().getTime();
  const due = new Date(reminder.due_at).getTime();
  const delay = due - now;

  // If it's already in the past, send it immediately
  if (delay <= 0) {
    triggerReminder(sock, reminder);
    return;
  }

  logger.info({ id: reminder.id, delayMs: delay }, 'Pro-Scheduler: Task queued in-memory');

  const timer = setTimeout(() => {
    triggerReminder(sock, reminder);
    activeTimers.delete(reminder.id!);
  }, delay);

  activeTimers.set(reminder.id, timer);
}

async function triggerReminder(sock: any, reminder: Reminder) {
  try {
    logger.info({ id: reminder.id }, 'Pro-Scheduler: Triggering reminder now!');
    
    await sock.sendMessage(reminder.user_jid, {
      text: `🚨 *STRICT REMINDER*\n\n${reminder.text}\n\nAction required.`
    });

    await supabase
      .from('reminders')
      .update({ status: 'SENT' })
      .eq('id', reminder.id);
      
    logger.info({ id: reminder.id }, 'Pro-Scheduler: Success. Reminder marked as SENT.');
  } catch (err) {
    logger.error({ id: reminder.id, err }, 'Pro-Scheduler: Failed to trigger reminder');
  }
}

/**
 * One-time startup sweep to load pending reminders from the database.
 */
export async function startupReminderSweep(sock: any) {
  logger.info('Pro-Scheduler: Running startup sweep...');
  
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'PENDING');

  if (error) {
    logger.error(error, 'Pro-Scheduler: Startup sweep failed');
    return;
  }

  if (data && data.length > 0) {
    logger.info({ count: data.length }, 'Pro-Scheduler: Found pending tasks. Rescheduling...');
    for (const reminder of data) {
      scheduleReminder(sock, reminder);
    }
  }
}
