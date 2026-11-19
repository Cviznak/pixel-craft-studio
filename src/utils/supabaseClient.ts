import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl: string = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabasePublishableKey: string = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured: boolean =
  supabaseUrl.length > 0 && supabasePublishableKey.length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
