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

export function extractDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  return digits;
}

/**
 * Normalizes an identifier into either an email or a valid canonical phone number.
 */
export function parseIdentifier(identifier: string): { type: 'email' | 'phone'; value: string } {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return { type: 'email', value: trimmed.toLowerCase() };
  }
  const digits = extractDigits(trimmed);
  const canonical = digits.length === 10 || digits.length === 11 ? `+55${digits}` : `+${digits || trimmed}`;
  return { type: 'phone', value: canonical };
}

/**
 * Compares two identifiers resiliently (supports various Brazilian phone formats: with/without +55, DDD, masks)
 */
export function matchIdentifiers(id1: string, id2: string): boolean {
  const trimmed1 = id1.trim();
  const trimmed2 = id2.trim();
  if (trimmed1.toLowerCase() === trimmed2.toLowerCase()) return true;
  if (trimmed1.includes('@') || trimmed2.includes('@')) return false;

  const d1 = extractDigits(trimmed1);
  const d2 = extractDigits(trimmed2);
  if (d1 && d2 && d1 === d2) return true;
  if (d1.length >= 8 && d2.length >= 8) {
    if (d1.slice(-8) === d2.slice(-8)) {
      if (d1.length >= 10 && d2.length >= 10) {
        return d1.slice(0, 2) === d2.slice(0, 2);
      }
      return true;
    }
  }
  return false;
}
