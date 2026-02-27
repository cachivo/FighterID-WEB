// Tipo centralizado para sesión de estación de juez
// Todos los archivos de estación deben importar desde aquí
export interface StationSession {
  session_id: string;
  station_number: number;
  event_id: string;
  event_name: string;
  current_fight_id: string | null;
  judge_name: string;
  logged_in_at: string;
}
