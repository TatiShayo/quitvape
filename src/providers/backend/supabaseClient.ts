/**
 * Supabase client with a device-bound, SecureStore-backed session store.
 * Storing the auth session in expo-secure-store keeps the anon session device-bound
 * (threat model: "device-bound (secure storage for the Supabase session)").
 *
 * Only constructed when Supabase is configured; callers must null-check.
 */
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/config/env';

/** SecureStore has a ~2KB value cap and disallows some key chars; keys are namespaced. */
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(safeKey(key)),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(safeKey(key), value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(safeKey(key)),
};

function safeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!env.supabase.configured || !env.supabase.url || !env.supabase.anonKey) return null;
  if (!client) {
    client = createClient(env.supabase.url, env.supabase.anonKey, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
