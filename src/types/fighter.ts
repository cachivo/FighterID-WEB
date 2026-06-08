/**
 * Central fighter type definitions.
 * Previously imported from @/hooks/useFighterProfiles (deprecated).
 * All new code should import types from here.
 */

export interface FighterProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  country: string;
  weight_class: string;
  height_cm?: number;
  weight_kg?: number;
  reach_cm?: number;
  fighting_style?: string;
  gym_name?: string;
  gym_id?: string | null;
  coach_id?: string | null;
  coach?: {
    id: string;
    nombre: string;
    apellidos?: string;
    avatar_url?: string;
    especialidades?: string[];
    slug?: string;
  };
  record_wins: number;
  record_losses: number;
  record_draws: number;
  avatar_url?: string;
  bio?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  license_number?: string;
  license_status?: string;
  primary_license_id?: string;
  discipline?: 'MMA' | 'Boxeo' | 'Judo' | 'JiuJitsu' | 'Kickboxing' | 'MuayThai' | 'Grappling' | 'Otro';
  martial_arts?: string[];
  gender?: string;
  phone?: string;
  stance?: string;
  level?: string;
  birthdate?: string;
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface FighterProfileData {
  first_name: string;
  last_name: string;
  nickname?: string;
  country?: string;
  weight_class: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  reach_cm?: number | null;
  fighting_style?: string;
  gym_name?: string;
  gym_id?: string | null;
  bio?: string;
  avatar_url?: string;
  discipline?: FighterProfile['discipline'];
  martial_arts?: string[];
  gender?: string;
  stance?: string;
  level?: string;
  birthdate?: string;
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface AdminFighterFormData extends FighterProfileData {
  record_wins?: number;
  record_losses?: number;
  record_draws?: number;
  mma_record_wins?: number;
  mma_record_losses?: number;
  mma_record_draws?: number;
  boxeo_record_wins?: number;
  boxeo_record_losses?: number;
  boxeo_record_draws?: number;
  boxrec_url?: string;
  tapology_url?: string;
  record_type?: string;
  insurance_company?: string;
  insurance_policy?: string;
  medical_allergies?: string;
  medical_conditions?: string;
}
