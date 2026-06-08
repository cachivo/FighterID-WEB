import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AppUserRecord {
  id: string;
  auth_user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  handle: string | null;
  country: string | null;
  birthdate: string | null;
}

export interface EnsureAppUserDefaults {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  country?: string | null;
  handlePrefix?: string;
}

/**
 * Idempotent app_user upsert by auth_user_id.
 *
 * - If a row exists, returns it WITHOUT overwriting any existing fields.
 * - If no row exists, creates one using the provided defaults.
 *
 * Use this from every module onboarding flow (fighter/gym/trainer/judge) so
 * a single email can hold multiple module profiles without one flow stomping
 * over identity data set by another.
 */
export async function ensureAppUser(
  authUser: Pick<User, 'id' | 'email'>,
  defaults: EnsureAppUserDefaults = {}
): Promise<AppUserRecord> {
  const { data: existing, error: selErr } = await supabase
    .from('app_user')
    .select('id, auth_user_id, email, first_name, last_name, phone, handle, country, birthdate')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing as AppUserRecord;

  const handlePrefix = defaults.handlePrefix || 'user';
  const handle = `${handlePrefix}_${Date.now().toString(36)}`
    .toLowerCase()
    .replace(/\s+/g, '_');

  const { data: created, error: insErr } = await supabase
    .from('app_user')
    .insert({
      auth_user_id: authUser.id,
      email: authUser.email ?? null,
      first_name: defaults.firstName ?? '',
      last_name: defaults.lastName ?? '',
      phone: defaults.phone ?? null,
      country: defaults.country ?? null,
      handle,
    })
    .select('id, auth_user_id, email, first_name, last_name, phone, handle, country, birthdate')
    .single();

  if (insErr) {
    // Race: another tab created it. Re-fetch.
    if ((insErr as any).code === '23505') {
      const { data: race } = await supabase
        .from('app_user')
        .select('id, auth_user_id, email, first_name, last_name, phone, handle, country, birthdate')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      if (race) return race as AppUserRecord;
    }
    throw insErr;
  }

  return created as AppUserRecord;
}

/**
 * Non-destructive patch: only writes fields that are currently null/empty
 * on the existing row. Safe to call from any module onboarding.
 */
export async function fillAppUserIfEmpty(
  appUserId: string,
  patch: Partial<Pick<AppUserRecord, 'first_name' | 'last_name' | 'phone' | 'country' | 'birthdate' | 'gender'>>
): Promise<void> {
  const { data: current } = await supabase
    .from('app_user')
    .select('first_name, last_name, phone, country, birthdate')
    .eq('id', appUserId)
    .maybeSingle();

  if (!current) return;

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null || v === '') continue;
    const existing = (current as any)[k];
    if (existing === null || existing === undefined || existing === '') {
      update[k] = v;
    }
  }
  if (Object.keys(update).length === 0) return;

  await supabase.from('app_user').update(update).eq('id', appUserId);
}
