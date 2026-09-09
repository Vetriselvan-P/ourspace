import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Normalize URL: strip trailing /rest/v1 or trailing slashes if accidentally included
export const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey = rawKey;

// Check if credentials are valid and not default placeholders
export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref')
);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
