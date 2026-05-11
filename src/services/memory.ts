import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import logger from './logger.js';
import { generateEmbedding } from './embeddings.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export interface Memory {
  id?: string;
  user_jid: string;
  content: string;
  type: 'COMMITMENT' | 'INFO' | 'LINK';
  due_at?: string;
  created_at?: string;
  embedding?: number[];
}

export async function addMemory(memory: Memory) {
  // Generate embedding for semantic search
  const embedding = await generateEmbedding(memory.content);
  
  const { data, error } = await supabase
    .from('memories')
    .insert([{ ...memory, embedding }])
    .select()
    .single();

  if (error) {
    logger.error(error, 'Failed to save memory');
    throw error;
  }
  return data;
}

export async function searchMemories(jid: string, query: string) {
  const queryEmbedding = await generateEmbedding(query);
  
  if (queryEmbedding.length === 0) {
    // Fallback to text search if embedding fails
    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('user_jid', jid)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false });
    return data || [];
  }

  // Use Vector Similarity Search (RPC)
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5, // 50% similarity
    match_count: 5,
    p_user_jid: jid
  });

  if (error) {
    logger.error(error, 'Vector search failed, falling back to text search');
    return [];
  }
  
  return data;
}
