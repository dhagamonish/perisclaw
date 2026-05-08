import { 
  AuthenticationState, 
  AuthenticationCreds, 
  SignalDataTypeMap, 
  initAuthCreds, 
  BufferJSON 
} from '@whiskeysockets/baileys';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import logger from './logger.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export async function useSupabaseAuthState(sessionId: string) {
  const writeData = async (data: any, id: string) => {
    const { error } = await supabase
      .from('whatsapp_sessions')
      .upsert({ 
        id: `${sessionId}_${id}`, 
        data: JSON.parse(JSON.stringify(data, BufferJSON.replacer)),
        updated_at: new Date().toISOString()
      });
    
    if (error) logger.error(error, `Failed to write session data: ${id}`);
  };

  const readData = async (id: string) => {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('data')
      .eq('id', `${sessionId}_${id}`)
      .single();

    if (error || !data) return null;
    return JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
  };

  const removeData = async (id: string) => {
    await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('id', `${sessionId}_${id}`);
  };

  const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
          const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = value;
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data: any) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    } as AuthenticationState,
    saveCreds: () => writeData(creds, 'creds'),
  };
}
