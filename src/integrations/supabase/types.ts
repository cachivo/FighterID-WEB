export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_user: {
        Row: {
          auth_user_id: string | null
          beber_loyalty_id: string | null
          birthdate: string | null
          birthdate_verified_at: string | null
          country: string | null
          created_at: string | null
          email: string | null
          handle: string
          id: string
          kyc_level: number | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          beber_loyalty_id?: string | null
          birthdate?: string | null
          birthdate_verified_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          handle: string
          id?: string
          kyc_level?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          beber_loyalty_id?: string | null
          birthdate?: string | null
          birthdate_verified_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          handle?: string
          id?: string
          kyc_level?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bdg_event: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          discipline: string
          end_time: string | null
          id: string
          meta: Json | null
          name: string
          source_event_id: string | null
          start_time: string | null
          state: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discipline: string
          end_time?: string | null
          id?: string
          meta?: Json | null
          name: string
          source_event_id?: string | null
          start_time?: string | null
          state?: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discipline?: string
          end_time?: string | null
          id?: string
          meta?: Json | null
          name?: string
          source_event_id?: string | null
          start_time?: string | null
          state?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bdg_event_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_ticket: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ip_address: unknown | null
          kind: string
          market_id: string
          outcome_id: string
          payout_amount: number | null
          potential_payout: number | null
          price_locked: number | null
          settled_at: string | null
          stake: number
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          ip_address?: unknown | null
          kind?: string
          market_id: string
          outcome_id: string
          payout_amount?: number | null
          potential_payout?: number | null
          price_locked?: number | null
          settled_at?: string | null
          stake: number
          status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          ip_address?: unknown | null
          kind?: string
          market_id?: string
          outcome_id?: string
          payout_amount?: number | null
          potential_payout?: number | null
          price_locked?: number | null
          settled_at?: string | null
          stake?: number
          status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_ticket_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_ticket_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "outcome"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_ticket_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_sitio: {
        Row: {
          clave: string
          descripcion: string | null
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          clave: string
          descripcion?: string | null
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          clave?: string
          descripcion?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      contestants: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          event_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          event_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contestants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      estadisticas: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          numero: string
          orden: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          numero: string
          orden?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          numero?: string
          orden?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      eventos_deportivos: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          orden: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          orden?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          orden?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos_destacados: {
        Row: {
          activo: boolean | null
          audiencia: string
          created_at: string
          id: string
          nombre: string
          orden: number | null
          participantes: string
          ranking: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          audiencia: string
          created_at?: string
          id?: string
          nombre: string
          orden?: number | null
          participantes: string
          ranking: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          audiencia?: string
          created_at?: string
          id?: string
          nombre?: string
          orden?: number | null
          participantes?: string
          ranking?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos_digitales: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          orden: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          orden?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          orden?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          active: boolean
          allow_guest_votes: boolean
          created_at: string
          created_by: string
          description: string | null
          discipline_id: string
          ends_at: string | null
          id: string
          public: boolean
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          allow_guest_votes?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          discipline_id: string
          ends_at?: string | null
          id?: string
          public?: boolean
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          allow_guest_votes?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          discipline_id?: string
          ends_at?: string | null
          id?: string
          public?: boolean
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      market: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          kind: string
          max_stake: number | null
          meta: Json | null
          min_stake: number | null
          rake: number | null
          settlement_delay_seconds: number | null
          state: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          kind?: string
          max_stake?: number | null
          meta?: Json | null
          min_stake?: number | null
          rake?: number | null
          settlement_delay_seconds?: number | null
          state?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          kind?: string
          max_stake?: number | null
          meta?: Json | null
          min_stake?: number | null
          rake?: number | null
          settlement_delay_seconds?: number | null
          state?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "bdg_event"
            referencedColumns: ["id"]
          },
        ]
      }
      market_state_log: {
        Row: {
          actor: string | null
          created_at: string | null
          from_state: string | null
          id: string
          market_id: string
          reason: string | null
          to_state: string
        }
        Insert: {
          actor?: string | null
          created_at?: string | null
          from_state?: string | null
          id?: string
          market_id: string
          reason?: string | null
          to_state: string
        }
        Update: {
          actor?: string | null
          created_at?: string | null
          from_state?: string | null
          id?: string
          market_id?: string
          reason?: string | null
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_state_log_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          label: string
          market_id: string
          pool: number | null
          price: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          market_id: string
          pool?: number | null
          price?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          market_id?: string
          pool?: number | null
          price?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          id: string
          logo: string | null
          nombre: string
          orden: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          id?: string
          logo?: string | null
          nombre: string
          orden?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          id?: string
          logo?: string | null
          nombre?: string
          orden?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      round_contestants: {
        Row: {
          contestant_id: string
          round_id: string
        }
        Insert: {
          contestant_id: string
          round_id: string
        }
        Update: {
          contestant_id?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_contestants_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_contestants_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "vw_round_leaderboard"
            referencedColumns: ["contestant_id"]
          },
          {
            foreignKeyName: "round_contestants_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_contestants_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "vw_round_leaderboard"
            referencedColumns: ["round_id"]
          },
        ]
      }
      round_totals: {
        Row: {
          contestant_id: string
          round_id: string
          total: number
          updated_at: string
        }
        Insert: {
          contestant_id: string
          round_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          contestant_id?: string
          round_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_totals_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "contestants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_totals_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "vw_round_leaderboard"
            referencedColumns: ["contestant_id"]
          },
          {
            foreignKeyName: "round_totals_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_totals_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "vw_round_leaderboard"
            referencedColumns: ["round_id"]
          },
        ]
      }
      rounds: {
        Row: {
          active: boolean
          created_at: string
          event_id: string
          id: string
          name: string
          strategy: string
          strategy_config: Json
          updated_at: string
          voting_closes_at: string
          voting_opens_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_id: string
          id?: string
          name: string
          strategy: string
          strategy_config?: Json
          updated_at?: string
          voting_closes_at: string
          voting_opens_at: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          strategy?: string
          strategy_config?: Json
          updated_at?: string
          voting_closes_at?: string
          voting_opens_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string
          icono: string
          id: string
          items: string[]
          orden: number | null
          titulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion: string
          icono: string
          id?: string
          items?: string[]
          orden?: number | null
          titulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string
          icono?: string
          id?: string
          items?: string[]
          orden?: number | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      settlement: {
        Row: {
          confirmed_by: string | null
          created_at: string | null
          id: string
          market_id: string
          result_meta: Json | null
          result_type: string | null
          settled_by: string | null
          total_payout: number | null
          total_pool: number | null
          total_rake: number | null
          winning_outcome_id: string | null
        }
        Insert: {
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          market_id: string
          result_meta?: Json | null
          result_type?: string | null
          settled_by?: string | null
          total_payout?: number | null
          total_pool?: number | null
          total_rake?: number | null
          winning_outcome_id?: string | null
        }
        Update: {
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          market_id?: string
          result_meta?: Json | null
          result_type?: string | null
          settled_by?: string | null
          total_payout?: number | null
          total_pool?: number | null
          total_rake?: number | null
          winning_outcome_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "market"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_winning_outcome_id_fkey"
            columns: ["winning_outcome_id"]
            isOneToOne: false
            referencedRelation: "outcome"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonios: {
        Row: {
          activo: boolean | null
          avatar: string | null
          cargo: string
          created_at: string
          id: string
          nombre: string
          orden: number | null
          testimonio: string
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          avatar?: string | null
          cargo: string
          created_at?: string
          id?: string
          nombre: string
          orden?: number | null
          testimonio: string
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          avatar?: string | null
          cargo?: string
          created_at?: string
          id?: string
          nombre?: string
          orden?: number | null
          testimonio?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_limit: {
        Row: {
          active: boolean | null
          created_at: string | null
          current_amount: number | null
          id: string
          limit_type: string
          max_amount: number
          period: string
          reset_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          current_amount?: number | null
          id?: string
          limit_type: string
          max_amount: number
          period: string
          reset_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          current_amount?: number | null
          id?: string
          limit_type?: string
          max_amount?: number
          period?: string
          reset_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_limit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          device_id: string | null
          id: number
          ip: unknown | null
          round_id: string
          user_id: string | null
          value_json: Json
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: number
          ip?: unknown | null
          round_id: string
          user_id?: string | null
          value_json: Json
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: number
          ip?: unknown | null
          round_id?: string
          user_id?: string | null
          value_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "vw_round_leaderboard"
            referencedColumns: ["round_id"]
          },
        ]
      }
      wallet: {
        Row: {
          balance: number
          created_at: string | null
          currency: string
          hold: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency: string
          hold?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string
          hold?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_tx: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          kind: string
          meta: Json | null
          reference_id: string | null
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          kind: string
          meta?: Json | null
          reference_id?: string | null
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          kind?: string
          meta?: Json | null
          reference_id?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_tx_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallet"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_round_leaderboard: {
        Row: {
          contestant_id: string | null
          contestant_name: string | null
          position: number | null
          round_id: string | null
          round_name: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_parimutuel_payout: {
        Args: { p_market_id: string; p_outcome_id: string; p_stake: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
