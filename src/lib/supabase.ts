import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

// Validates if the project has actual Supabase credentials configured
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseAnonKey.length > 20
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    client = null;
  }
}

export const supabase = client;

/**
 * Normalizes an identifier into either an email or a valid phone number.
 */
export function parseIdentifier(identifier: string): { type: 'email' | 'phone'; value: string } {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return { type: 'email', value: trimmed.toLowerCase() };
  }
  // Remove non-digit characters except leading plus
  let cleaned = trimmed.replace(/[^\d+]/g, '');
  // Default to Brazil country code (+55) if standard 10 or 11 digits without country code
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = `+55${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return { type: 'phone', value: cleaned };
}
