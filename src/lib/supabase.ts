import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Passenger } from '../components/ui';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Sign up a new passenger in Supabase Auth & store their pass in user_metadata or profiles table
 */
export async function signUpPassenger({
  email,
  password,
  name,
  pnr,
  originStopId,
  originStopName,
  travelClass,
}: {
  email: string;
  password: string;
  name: string;
  pnr: string;
  originStopId: string;
  originStopName: string;
  travelClass: '1A' | '2A' | 'SL';
}): Promise<{ data: Passenger | null; error: string | null }> {
  // If Supabase is not configured yet, save to local storage as fallback
  if (!supabase) {
    const passenger: Passenger = {
      name,
      email,
      pnr,
      originStopId,
      originStopName,
      travelClass,
      dateIssued: 'OCT 2026',
      isGuest: false,
    };
    localStorage.setItem('wanderwords_passenger', JSON.stringify(passenger));
    return { data: passenger, error: null };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          pnr,
          origin_stop_id: originStopId,
          origin_stop_name: originStopName,
          travel_class: travelClass,
          date_issued: 'OCT 2026',
        },
      },
    });

    if (error) {
      return { data: null, error: error.message };
    }

    const passenger: Passenger = {
      name: data.user?.user_metadata?.full_name || name,
      email: data.user?.email || email,
      pnr: data.user?.user_metadata?.pnr || pnr,
      originStopId: data.user?.user_metadata?.origin_stop_id || originStopId,
      originStopName: data.user?.user_metadata?.origin_stop_name || originStopName,
      travelClass: data.user?.user_metadata?.travel_class || travelClass,
      dateIssued: data.user?.user_metadata?.date_issued || 'OCT 2026',
      isGuest: false,
    };

    localStorage.setItem('wanderwords_passenger', JSON.stringify(passenger));
    return { data: passenger, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during registration';
    return { data: null, error: message };
  }
}

/**
 * Sign in an existing passenger with Supabase Auth
 */
export async function signInPassenger({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ data: Passenger | null; error: string | null }> {
  if (!supabase) {
    // Check local fallback
    const saved = localStorage.getItem('wanderwords_passenger');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email === email) {
        return { data: parsed, error: null };
      }
    }
    const demoPassenger: Passenger = {
      name: email.split('@')[0],
      email,
      pnr: `WW-${Math.floor(1000 + Math.random() * 8999)}-IN`,
      originStopId: 'jaipur',
      originStopName: 'Jaipur',
      travelClass: '1A',
      dateIssued: 'OCT 2026',
      isGuest: false,
    };
    localStorage.setItem('wanderwords_passenger', JSON.stringify(demoPassenger));
    return { data: demoPassenger, error: null };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    const meta = data.user?.user_metadata || {};
    const passenger: Passenger = {
      name: meta.full_name || data.user?.email?.split('@')[0] || 'Passenger',
      email: data.user?.email || email,
      pnr: meta.pnr || `WW-${Math.floor(1000 + Math.random() * 8999)}-IN`,
      originStopId: meta.origin_stop_id || 'jaipur',
      originStopName: meta.origin_stop_name || 'Jaipur',
      travelClass: meta.travel_class || '1A',
      dateIssued: meta.date_issued || 'OCT 2026',
      isGuest: false,
    };

    localStorage.setItem('wanderwords_passenger', JSON.stringify(passenger));
    return { data: passenger, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to verify traveler credentials';
    return { data: null, error: message };
  }
}

/**
 * Sign out current passenger
 */
export async function signOutPassenger(): Promise<void> {
  localStorage.removeItem('wanderwords_passenger');
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

/**
 * Send password reset email
 */
export async function resetPassengerPassword(email: string): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) {
    return { success: true, error: null };
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error sending password reset telegraph';
    return { success: false, error: message };
  }
}
