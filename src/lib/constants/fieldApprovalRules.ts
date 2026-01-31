/**
 * Field Approval Rules for Fighter Profile Changes
 * 
 * This file defines which fields can be auto-approved vs which require admin review.
 * The classification is based on the field's impact on competitive integrity.
 */

// Campos que se auto-aprueban (el usuario puede cambiar libremente)
// Estos campos son cosméticos o personales, no afectan la elegibilidad competitiva
export const AUTO_APPROVE_FIELDS = [
  'nickname',           // Apodo - cosmético
  'bio',                // Biografía personal
  'fighting_style',     // Estilo preferido - información
  'stance',             // Guardia (Orthodox/Southpaw)
  'gym_name',           // Gimnasio de afiliación
  'boxrec_url',         // Link externo
  'tapology_url',       // Link externo
  'height_cm',          // Altura - verificable en pesaje
  'reach_cm',           // Alcance - verificable en pesaje
  'martial_arts',       // Artes marciales practicadas
  'medical_conditions', // Información médica personal
  'medical_allergies',  // Alergias del usuario
  'emergency_contact_name',     // Contacto de emergencia
  'emergency_contact_phone',    // Teléfono de emergencia
  'emergency_contact_relation', // Relación con contacto
  'insurance_company',  // Seguro médico
  'insurance_policy',   // Póliza de seguro
] as const;

// Campos que requieren aprobación administrativa
// Estos campos afectan la identidad oficial, elegibilidad competitiva o ranking
export const REQUIRES_APPROVAL_FIELDS = [
  'first_name',         // Identidad oficial en licencia
  'last_name',          // Identidad oficial en licencia
  'record_wins',        // Afecta ranking y matchmaking
  'record_losses',      // Afecta ranking y matchmaking
  'record_draws',       // Afecta ranking y matchmaking
  'weight_class',       // Determina categoría de pelea
  'weight_kg',          // Afecta elegibilidad de categoría
  'level',              // Amateur vs Profesional
  'discipline',         // Tipo de licencia (MMA vs Boxeo)
  'gender',             // Elegibilidad de competencia
  'country',            // Regulaciones por país
  'document_type',      // Documento de identidad
  'document_number',    // Número de documento
  'birthdate',          // Edad mínima para competir
  'birthplace',         // Lugar de nacimiento
  'blood_type',         // Tipo de sangre (información médica crítica)
] as const;

// Types
export type AutoApproveField = typeof AUTO_APPROVE_FIELDS[number];
export type RequiresApprovalField = typeof REQUIRES_APPROVAL_FIELDS[number];

// Field labels in Spanish for UI display
export const FIELD_LABELS: Record<string, string> = {
  nickname: 'Apodo',
  bio: 'Biografía',
  fighting_style: 'Estilo de Pelea',
  stance: 'Guardia',
  gym_name: 'Gimnasio',
  boxrec_url: 'BoxRec URL',
  tapology_url: 'Tapology URL',
  height_cm: 'Altura (cm)',
  reach_cm: 'Alcance (cm)',
  martial_arts: 'Artes Marciales',
  medical_conditions: 'Condiciones Médicas',
  medical_allergies: 'Alergias',
  emergency_contact_name: 'Contacto de Emergencia',
  emergency_contact_phone: 'Teléfono de Emergencia',
  emergency_contact_relation: 'Relación con Contacto',
  insurance_company: 'Compañía de Seguro',
  insurance_policy: 'Póliza de Seguro',
  first_name: 'Nombre',
  last_name: 'Apellido',
  record_wins: 'Victorias',
  record_losses: 'Derrotas',
  record_draws: 'Empates',
  weight_class: 'Categoría de Peso',
  weight_kg: 'Peso (kg)',
  level: 'Nivel',
  discipline: 'Disciplina',
  gender: 'Género',
  country: 'País',
  document_type: 'Tipo de Documento',
  document_number: 'Número de Documento',
  birthdate: 'Fecha de Nacimiento',
  birthplace: 'Lugar de Nacimiento',
  blood_type: 'Tipo de Sangre',
};

/**
 * Classifies changes into auto-approve and requires-approval categories
 * @param changes - Object containing field changes
 * @returns Object with autoApprove and requiresApproval categorized changes
 */
export function classifyChanges(changes: Record<string, any>): {
  autoApprove: Record<string, any>;
  requiresApproval: Record<string, any>;
  hasAutoApprove: boolean;
  hasRequiresApproval: boolean;
} {
  const autoApprove: Record<string, any> = {};
  const requiresApproval: Record<string, any> = {};
  
  Object.entries(changes).forEach(([field, value]) => {
    if (AUTO_APPROVE_FIELDS.includes(field as AutoApproveField)) {
      autoApprove[field] = value;
    } else {
      // Default: any field not in AUTO_APPROVE_FIELDS requires approval
      requiresApproval[field] = value;
    }
  });
  
  return { 
    autoApprove, 
    requiresApproval,
    hasAutoApprove: Object.keys(autoApprove).length > 0,
    hasRequiresApproval: Object.keys(requiresApproval).length > 0
  };
}

/**
 * Gets the human-readable label for a field
 */
export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}
