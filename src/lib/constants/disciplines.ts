/**
 * Centralized discipline constants for Fighter ID platform
 * 
 * This file controls which disciplines are available for fighter registration.
 * To enable new disciplines, add them to ENABLED_DISCIPLINES array.
 */

// Disciplines currently enabled in the platform (shown in forms)
export const ENABLED_DISCIPLINES = [
  { value: 'MMA', label: 'MMA (Artes Marciales Mixtas)', icon: 'Swords' },
  { value: 'Boxeo', label: 'Boxeo Profesional', icon: 'Target' },
] as const;

// All disciplines valid in the database (for compatibility)
// These are the enum values in the database
export const ALL_DB_DISCIPLINES = [
  'MMA', 
  'Boxeo', 
  'Judo', 
  'JiuJitsu', 
  'Kickboxing', 
  'MuayThai', 
  'Grappling', 
  'Otro'
] as const;

// Weight classes in Spanish with lbs (standardized)
export const WEIGHT_CLASSES = [
  { value: 'Peso Paja', label: 'Peso Paja (115 lbs)' },
  { value: 'Peso Mosca', label: 'Peso Mosca (125 lbs)' },
  { value: 'Peso Gallo', label: 'Peso Gallo (135 lbs)' },
  { value: 'Peso Pluma', label: 'Peso Pluma (145 lbs)' },
  { value: 'Peso Ligero', label: 'Peso Ligero (155 lbs)' },
  { value: 'Peso Welter', label: 'Peso Welter (170 lbs)' },
  { value: 'Peso Medio', label: 'Peso Medio (185 lbs)' },
  { value: 'Peso Semipesado', label: 'Peso Semipesado (205 lbs)' },
  { value: 'Peso Pesado', label: 'Peso Pesado (265 lbs)' },
  { value: 'Peso Superpesado', label: 'Peso Superpesado (+265 lbs)' },
] as const;

// Fighter levels
export const FIGHTER_LEVELS = [
  { value: 'Amateur', label: 'Amateur' },
  { value: 'Semi-profesional', label: 'Semi-profesional' },
  { value: 'Profesional', label: 'Profesional' },
] as const;

// Types
export type EnabledDiscipline = typeof ENABLED_DISCIPLINES[number]['value'];
export type AllDiscipline = typeof ALL_DB_DISCIPLINES[number];
export type WeightClass = typeof WEIGHT_CLASSES[number]['value'];
export type FighterLevel = typeof FIGHTER_LEVELS[number]['value'];

// Helper to get discipline values only (for forms)
export const getEnabledDisciplineValues = () => 
  ENABLED_DISCIPLINES.map(d => d.value);

/**
 * Get the full weight class label with lbs from the stored value
 * @param value - The weight class value stored in DB (e.g., "Peso Ligero")
 * @returns The full label with lbs (e.g., "Peso Ligero (155 lbs)")
 */
export const getWeightClassLabel = (value: string | undefined | null): string => {
  if (!value) return 'Sin categoría';
  const found = WEIGHT_CLASSES.find(wc => wc.value === value);
  return found ? found.label : value;
};

// Stances for fighters (standardized in Spanish)
export const STANCES = [
  { value: 'Ortodoxo', label: 'Ortodoxo' },
  { value: 'Zurdo', label: 'Zurdo' },
  { value: 'Switch', label: 'Switch' },
] as const;

export type Stance = typeof STANCES[number]['value'];

// Países de Centroamérica y región (estandarizados)
export const COUNTRIES = [
  { value: 'Honduras', label: 'Honduras' },
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'Nicaragua', label: 'Nicaragua' },
  { value: 'Panamá', label: 'Panamá' },
  { value: 'Costa Rica', label: 'Costa Rica' },
  { value: 'México', label: 'México' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'Canadá', label: 'Canadá' },
  { value: 'Otro', label: 'Otro' },
] as const;

export type Country = typeof COUNTRIES[number]['value'];

// Artes marciales para perfil de entrenamiento (NO son disciplinas de competencia)
export const MARTIAL_ARTS_TRAINING = [
  { value: 'MuayThai', label: 'Muay Thai' },
  { value: 'JiuJitsu', label: 'Jiu-Jitsu Brasileño' },
  { value: 'Judo', label: 'Judo' },
  { value: 'Kickboxing', label: 'Kickboxing' },
  { value: 'Grappling', label: 'Grappling' },
  { value: 'Wrestling', label: 'Lucha Libre' },
  { value: 'Karate', label: 'Karate' },
  { value: 'TaeKwonDo', label: 'Tae Kwon Do' },
] as const;

export type MartialArt = typeof MARTIAL_ARTS_TRAINING[number]['value'];

// Géneros para filtros de ranking
export const GENDERS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
] as const;

export type Gender = typeof GENDERS[number]['value'];
