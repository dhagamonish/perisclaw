import { createClient } from '@supabase/supabase-core';
import { env } from '../config/env.js';
import logger from './logger.js';

const supabase = (createClient as any)(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export interface Memory {
  id?: string;
  user_jid: string;
  content: string;
  type: 'COMMITMENT' | 'INFO' | 'LINK';
  due_at?: string;
  created_at?: string;
}

export async function addMemory(memory: Memory) {
  const { data, error } = await supabase
    .from('memories')
    .insert([memory])
    .select()
    .single();

  if (error) {
    logger.error(error, 'Failed to save memory');
    throw error;
  }
  return data;
}

export async function searchMemories(jid: string, query: string) {
  // Simple text search for now, can be upgraded to Vector Search later
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_jid', jid)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error(error, 'Failed to search memories');
    return [];
  }
  return data;
}
