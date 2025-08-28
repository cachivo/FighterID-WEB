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
      [_ in never]: never
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
