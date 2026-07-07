/** Backend provider selector: real Supabase when configured, else in-memory mock. */
import { BackendProvider } from '../types';
import { createMockBackend } from './mockBackend';
import { createSupabaseBackend } from './supabaseBackend';
import { getSupabaseClient } from './supabaseClient';

let instance: BackendProvider | null = null;

export function getBackend(): BackendProvider {
  if (instance) return instance;
  const client = getSupabaseClient();
  instance = client ? createSupabaseBackend(client) : createMockBackend();
  return instance;
}

export type { BackendProvider };
