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
      ai_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_fight_results: {
        Row: {
          created_at: string
          duration_seconds: number | null
          fight_id: string
          fighter_a_stats: Json
          fighter_b_stats: Json
          id: string
          metadata: Json | null
          model_version: string
          total_events: number
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          fight_id: string
          fighter_a_stats?: Json
          fighter_b_stats?: Json
          id?: string
          metadata?: Json | null
          model_version: string
          total_events?: number
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          fight_id?: string
          fighter_a_stats?: Json
          fighter_b_stats?: Json
          id?: string
          metadata?: Json | null
          model_version?: string
          total_events?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_fight_results_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: true
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_inference_logs: {
        Row: {
          fight_id: string | null
          id: number
          level: string
          message: string
          metadata: Json | null
          session_id: string | null
          timestamp: string | null
        }
        Insert: {
          fight_id?: string | null
          id?: number
          level: string
          message: string
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
        }
        Update: {
          fight_id?: string | null
          id?: number
          level?: string
          message?: string
          metadata?: Json | null
          session_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_inference_logs_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inference_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_inference_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_inference_sessions: {
        Row: {
          avg_fps: number | null
          avg_latency_ms: number | null
          created_by: string | null
          fight_id: string
          id: string
          metadata: Json | null
          model_version: string
          source_url: string
          started_at: string | null
          status: string
          stopped_at: string | null
          total_frames_processed: number | null
        }
        Insert: {
          avg_fps?: number | null
          avg_latency_ms?: number | null
          created_by?: string | null
          fight_id: string
          id?: string
          metadata?: Json | null
          model_version: string
          source_url: string
          started_at?: string | null
          status?: string
          stopped_at?: string | null
          total_frames_processed?: number | null
        }
        Update: {
          avg_fps?: number | null
          avg_latency_ms?: number | null
          created_by?: string | null
          fight_id?: string
          id?: string
          metadata?: Json | null
          model_version?: string
          source_url?: string
          started_at?: string | null
          status?: string
          stopped_at?: string | null
          total_frames_processed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_inference_sessions_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_versions: {
        Row: {
          created_at: string | null
          deployed_at: string | null
          f1_score: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          notes: string | null
          precision_connected: number | null
          recall_connected: number | null
        }
        Insert: {
          created_at?: string | null
          deployed_at?: string | null
          f1_score?: number | null
          id: string
          is_active?: boolean | null
          metadata?: Json | null
          notes?: string | null
          precision_connected?: number | null
          recall_connected?: number | null
        }
        Update: {
          created_at?: string | null
          deployed_at?: string | null
          f1_score?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          notes?: string | null
          precision_connected?: number | null
          recall_connected?: number | null
        }
        Relationships: []
      }
      ai_strike_events: {
        Row: {
          confidence: number | null
          created_at: string | null
          event_type: string
          fight_id: string
          fighter: string
          id: number
          metadata: Json | null
          model_version: string
          round_number: number
          strike_type: string | null
          timestamp_ms: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          event_type: string
          fight_id: string
          fighter: string
          id?: number
          metadata?: Json | null
          model_version: string
          round_number: number
          strike_type?: string | null
          timestamp_ms: number
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          event_type?: string
          fight_id?: string
          fighter?: string
          id?: number
          metadata?: Json | null
          model_version?: string
          round_number?: number
          strike_type?: string | null
          timestamp_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_strike_events_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          beber_loyalty_id: string | null
          bio: string | null
          birthdate: string | null
          birthdate_verified_at: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          handle: string
          id: string
          is_admin: boolean | null
          kyc_level: number | null
          last_name: string | null
          phone: string | null
          phone_verified: boolean | null
          profile_visibility: Json | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          beber_loyalty_id?: string | null
          bio?: string | null
          birthdate?: string | null
          birthdate_verified_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          handle: string
          id?: string
          is_admin?: boolean | null
          kyc_level?: number | null
          last_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_visibility?: Json | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          beber_loyalty_id?: string | null
          bio?: string | null
          birthdate?: string | null
          birthdate_verified_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          handle?: string
          id?: string
          is_admin?: boolean | null
          kyc_level?: number | null
          last_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          profile_visibility?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          performed_at: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bdg_event: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          discipline: string
          end_time: string | null
          id: string
          meta: Json | null
          name: string
          organization_id: string | null
          poster_url: string | null
          published: boolean | null
          rules_document_url: string | null
          source_event_id: string | null
          start_time: string | null
          state: string
          total_attendees: number | null
          total_fights: number | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discipline: string
          end_time?: string | null
          id?: string
          meta?: Json | null
          name: string
          organization_id?: string | null
          poster_url?: string | null
          published?: boolean | null
          rules_document_url?: string | null
          source_event_id?: string | null
          start_time?: string | null
          state?: string
          total_attendees?: number | null
          total_fights?: number | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discipline?: string
          end_time?: string | null
          id?: string
          meta?: Json | null
          name?: string
          organization_id?: string | null
          poster_url?: string | null
          published?: boolean | null
          rules_document_url?: string | null
          source_event_id?: string | null
          start_time?: string | null
          state?: string
          total_attendees?: number | null
          total_fights?: number | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bdg_event_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ranking_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bdg_event_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_delay_queue: {
        Row: {
          created_at: string
          id: string
          process_at: string
          status: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          process_at?: string
          status?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          process_at?: string
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_delay_queue_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "bet_ticket"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_ticket: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
        ]
      }
      change_request_audit: {
        Row: {
          action: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          performed_at: string
          performed_by: string | null
          request_id: string
        }
        Insert: {
          action: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_at?: string
          performed_by?: string | null
          request_id: string
        }
        Update: {
          action?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_at?: string
          performed_by?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_request_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_request_audit_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "profile_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          activo: boolean | null
          apellidos: string | null
          avatar_url: string | null
          bio: string | null
          ciudad: string | null
          created_at: string | null
          email: string | null
          especialidades: string[] | null
          facebook: string | null
          gym_id: string | null
          id: string
          instagram: string | null
          nombre: string
          owner_id: string | null
          pais: string | null
          slug: string
          telefono: string | null
          tiktok: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean | null
          apellidos?: string | null
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          created_at?: string | null
          email?: string | null
          especialidades?: string[] | null
          facebook?: string | null
          gym_id?: string | null
          id?: string
          instagram?: string | null
          nombre: string
          owner_id?: string | null
          pais?: string | null
          slug: string
          telefono?: string | null
          tiktok?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean | null
          apellidos?: string | null
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          created_at?: string | null
          email?: string | null
          especialidades?: string[] | null
          facebook?: string | null
          gym_id?: string | null
          id?: string
          instagram?: string | null
          nombre?: string
          owner_id?: string | null
          pais?: string | null
          slug?: string
          telefono?: string | null
          tiktok?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
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
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          status: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
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
      doping_tests: {
        Row: {
          created_at: string | null
          id: string
          license_id: string
          notes: string | null
          report_file_url: string | null
          result_status: Database["public"]["Enums"]["doping_result_status"]
          substances_detected: string[] | null
          test_date: string
          test_type: Database["public"]["Enums"]["doping_test_type"]
          testing_agency: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_id: string
          notes?: string | null
          report_file_url?: string | null
          result_status?: Database["public"]["Enums"]["doping_result_status"]
          substances_detected?: string[] | null
          test_date: string
          test_type: Database["public"]["Enums"]["doping_test_type"]
          testing_agency: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_id?: string
          notes?: string | null
          report_file_url?: string | null
          result_status?: Database["public"]["Enums"]["doping_result_status"]
          substances_detected?: string[] | null
          test_date?: string
          test_type?: Database["public"]["Enums"]["doping_test_type"]
          testing_agency?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doping_tests_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doping_tests_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
        ]
      }
      email_campaign_images: {
        Row: {
          alt_text: string | null
          campaign_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          height: number | null
          id: string
          mime_type: string | null
          public_url: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          campaign_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          campaign_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_images_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_log: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          metadata: Json | null
          recipient_filter: string
          sent_by: string | null
          subject: string
          test_mode: boolean
          total_failed: number
          total_sent: number
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id?: string
          metadata?: Json | null
          recipient_filter?: string
          sent_by?: string | null
          subject: string
          test_mode?: boolean
          total_failed?: number
          total_sent?: number
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          metadata?: Json | null
          recipient_filter?: string
          sent_by?: string | null
          subject?: string
          test_mode?: boolean
          total_failed?: number
          total_sent?: number
        }
        Relationships: []
      }
      email_campaigns_v2: {
        Row: {
          asunto: string
          created_at: string
          created_by: string | null
          estado: string
          from_email: string | null
          from_name: string | null
          html_content: string | null
          id: string
          json_content: Json | null
          last_autosave: string | null
          metadata: Json | null
          nombre: string
          preview_text: string | null
          recipient_filter: string | null
          reply_to: string | null
          sent_at: string | null
          total_failed: number | null
          total_recipients: number | null
          total_sent: number | null
          updated_at: string
        }
        Insert: {
          asunto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          from_email?: string | null
          from_name?: string | null
          html_content?: string | null
          id?: string
          json_content?: Json | null
          last_autosave?: string | null
          metadata?: Json | null
          nombre?: string
          preview_text?: string | null
          recipient_filter?: string | null
          reply_to?: string | null
          sent_at?: string | null
          total_failed?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Update: {
          asunto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          from_email?: string | null
          from_name?: string | null
          html_content?: string | null
          id?: string
          json_content?: Json | null
          last_autosave?: string | null
          metadata?: Json | null
          nombre?: string
          preview_text?: string | null
          recipient_filter?: string | null
          reply_to?: string | null
          sent_at?: string | null
          total_failed?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_daily_usage: {
        Row: {
          date: string
          emails_sent: number
          updated_at: string
        }
        Insert: {
          date: string
          emails_sent?: number
          updated_at?: string
        }
        Update: {
          date?: string
          emails_sent?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          campaign_id: string | null
          created_at: string
          error_message: string | null
          html_content: string
          id: string
          priority: number
          recipient_email: string
          resend_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          html_content: string
          id?: string
          priority?: number
          recipient_email: string
          resend_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          error_message?: string | null
          html_content?: string
          id?: string
          priority?: number
          recipient_email?: string
          resend_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_log"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          bounce_type: string | null
          campaign_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string
          resend_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          bounce_type?: string | null
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email: string
          resend_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          bounce_type?: string | null
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string
          resend_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_log"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          activo: boolean | null
          categoria: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          html_content: string | null
          id: string
          json_content: Json | null
          nombre: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          html_content?: string | null
          id?: string
          json_content?: Json | null
          nombre: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          html_content?: string | null
          id?: string
          json_content?: Json | null
          nombre?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_officials: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          event_id: string
          id: string
          notes: string | null
          official_id: string
          role: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          official_id: string
          role: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          official_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_officials_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "bdg_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
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
      external_fighters: {
        Row: {
          country: string | null
          created_at: string | null
          created_by: string | null
          gym: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          nickname: string | null
          record: Json | null
          updated_at: string | null
          weight_class: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          gym?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          nickname?: string | null
          record?: Json | null
          updated_at?: string | null
          weight_class?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          gym?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          nickname?: string | null
          record?: Json | null
          updated_at?: string | null
          weight_class?: string | null
        }
        Relationships: []
      }
      fight_bookings: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_name: string
          fight_type: string | null
          id: string
          license_id: string
          opponent_license_id: string | null
          promoter: string | null
          scheduled_date: string
          status: string | null
          updated_at: string | null
          venue: string | null
          weight_class: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_name: string
          fight_type?: string | null
          id?: string
          license_id: string
          opponent_license_id?: string | null
          promoter?: string | null
          scheduled_date: string
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          weight_class: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_name?: string
          fight_type?: string | null
          id?: string
          license_id?: string
          opponent_license_id?: string | null
          promoter?: string | null
          scheduled_date?: string
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          weight_class?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_bookings_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_bookings_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
          {
            foreignKeyName: "fight_bookings_opponent_license_id_fkey"
            columns: ["opponent_license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_bookings_opponent_license_id_fkey"
            columns: ["opponent_license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
        ]
      }
      fight_control_events: {
        Row: {
          description: string | null
          event_type: string
          fight_id: string
          fighter_affected: string | null
          id: string
          metadata: Json | null
          reason: string | null
          referee_id: string
          round_number: number | null
          timestamp: string
        }
        Insert: {
          description?: string | null
          event_type: string
          fight_id: string
          fighter_affected?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          referee_id: string
          round_number?: number | null
          timestamp?: string
        }
        Update: {
          description?: string | null
          event_type?: string
          fight_id?: string
          fighter_affected?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          referee_id?: string
          round_number?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_control_events_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_control_events_fighter_affected_fkey"
            columns: ["fighter_affected"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_control_events_fighter_affected_fkey"
            columns: ["fighter_affected"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_control_events_fighter_affected_fkey"
            columns: ["fighter_affected"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_control_events_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_judges: {
        Row: {
          assigned_at: string | null
          confirmed: boolean | null
          fight_id: string
          id: string
          judge_id: string
          role: string | null
          station_ip: unknown
          station_number: number | null
        }
        Insert: {
          assigned_at?: string | null
          confirmed?: boolean | null
          fight_id: string
          id?: string
          judge_id: string
          role?: string | null
          station_ip?: unknown
          station_number?: number | null
        }
        Update: {
          assigned_at?: string | null
          confirmed?: boolean | null
          fight_id?: string
          id?: string
          judge_id?: string
          role?: string | null
          station_ip?: unknown
          station_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_judges_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_judges_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_officials: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          fight_id: string
          id: string
          notes: string | null
          official_id: string
          role: string
          station_metadata: Json | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          fight_id: string
          id?: string
          notes?: string | null
          official_id: string
          role: string
          station_metadata?: Json | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          fight_id?: string
          id?: string
          notes?: string | null
          official_id?: string
          role?: string
          station_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_officials_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_requests: {
        Row: {
          created_at: string
          discipline: string
          eligibility_check: Json | null
          event_id: string | null
          fight_id: string | null
          fight_type: string
          fighter_a_id: string | null
          fighter_a_name: string | null
          fighter_b_id: string | null
          fighter_b_name: string | null
          gym_id: string | null
          id: string
          is_championship: boolean | null
          notes: string | null
          number_of_rounds: number | null
          opponent_gym_id: string | null
          rejection_reason: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          weight_class: string
        }
        Insert: {
          created_at?: string
          discipline?: string
          eligibility_check?: Json | null
          event_id?: string | null
          fight_id?: string | null
          fight_type?: string
          fighter_a_id?: string | null
          fighter_a_name?: string | null
          fighter_b_id?: string | null
          fighter_b_name?: string | null
          gym_id?: string | null
          id?: string
          is_championship?: boolean | null
          notes?: string | null
          number_of_rounds?: number | null
          opponent_gym_id?: string | null
          rejection_reason?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          weight_class: string
        }
        Update: {
          created_at?: string
          discipline?: string
          eligibility_check?: Json | null
          event_id?: string | null
          fight_id?: string | null
          fight_type?: string
          fighter_a_id?: string | null
          fighter_a_name?: string | null
          fighter_b_id?: string | null
          fighter_b_name?: string | null
          gym_id?: string | null
          id?: string
          is_championship?: boolean | null
          notes?: string | null
          number_of_rounds?: number | null
          opponent_gym_id?: string | null
          rejection_reason?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          weight_class?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "bdg_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_requests_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_requests_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_requests_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_requests_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_requests_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_requests_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_requests_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_requests_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_requests_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
          {
            foreignKeyName: "fight_requests_opponent_gym_id_fkey"
            columns: ["opponent_gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_requests_opponent_gym_id_fkey"
            columns: ["opponent_gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
          {
            foreignKeyName: "fight_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_results: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          fight_id: string
          fight_of_night: boolean | null
          finish_method: string | null
          finish_round: number | null
          finish_time: string | null
          id: string
          judge_1_scorecard: number[] | null
          judge_1_total: number | null
          judge_2_scorecard: number[] | null
          judge_2_total: number | null
          judge_3_scorecard: number[] | null
          judge_3_total: number | null
          performance_bonus: boolean | null
          result_type: string
          winner_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          fight_id: string
          fight_of_night?: boolean | null
          finish_method?: string | null
          finish_round?: number | null
          finish_time?: string | null
          id?: string
          judge_1_scorecard?: number[] | null
          judge_1_total?: number | null
          judge_2_scorecard?: number[] | null
          judge_2_total?: number | null
          judge_3_scorecard?: number[] | null
          judge_3_total?: number | null
          performance_bonus?: boolean | null
          result_type: string
          winner_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          fight_id?: string
          fight_of_night?: boolean | null
          finish_method?: string | null
          finish_round?: number | null
          finish_time?: string | null
          id?: string
          judge_1_scorecard?: number[] | null
          judge_1_total?: number | null
          judge_2_scorecard?: number[] | null
          judge_2_total?: number | null
          judge_3_scorecard?: number[] | null
          judge_3_total?: number | null
          performance_bonus?: boolean | null
          result_type?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_results_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: true
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_results_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      fight_rounds: {
        Row: {
          created_at: string | null
          duration_seconds: number
          ends_at: string | null
          fight_id: string
          id: string
          number: number
          starts_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number
          ends_at?: string | null
          fight_id: string
          id?: string
          number: number
          starts_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          ends_at?: string | null
          fight_id?: string
          id?: string
          number?: number
          starts_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_rounds_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_scorecards: {
        Row: {
          fight_id: string
          fighter_a_score: number
          fighter_b_score: number
          id: string
          judge_id: string
          knockdown_fighter_a: number | null
          knockdown_fighter_b: number | null
          notes: string | null
          point_deduction_a: number | null
          point_deduction_b: number | null
          round_end_time: string | null
          round_number: number
          round_start_time: string | null
          submitted_at: string
        }
        Insert: {
          fight_id: string
          fighter_a_score: number
          fighter_b_score: number
          id?: string
          judge_id: string
          knockdown_fighter_a?: number | null
          knockdown_fighter_b?: number | null
          notes?: string | null
          point_deduction_a?: number | null
          point_deduction_b?: number | null
          round_end_time?: string | null
          round_number: number
          round_start_time?: string | null
          submitted_at?: string
        }
        Update: {
          fight_id?: string
          fighter_a_score?: number
          fighter_b_score?: number
          id?: string
          judge_id?: string
          knockdown_fighter_a?: number | null
          knockdown_fighter_b?: number | null
          notes?: string | null
          point_deduction_a?: number | null
          point_deduction_b?: number | null
          round_end_time?: string | null
          round_number?: number
          round_start_time?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_scorecards_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_scorecards_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_statistics: {
        Row: {
          aggression_score: number | null
          body_strikes_landed: number | null
          cage_control_time: number | null
          fight_id: string
          fighter_id: string
          ground_control_time: number | null
          head_strikes_landed: number | null
          id: string
          knockdowns: number | null
          leg_strikes_landed: number | null
          recorded_at: string
          recorded_by: string | null
          round_number: number
          significant_strikes_landed: number | null
          significant_strikes_thrown: number | null
          strikes_landed: number | null
          strikes_thrown: number | null
          submission_attempts: number | null
          takedown_attempts: number | null
          takedown_defense: number | null
          takedowns_successful: number | null
        }
        Insert: {
          aggression_score?: number | null
          body_strikes_landed?: number | null
          cage_control_time?: number | null
          fight_id: string
          fighter_id: string
          ground_control_time?: number | null
          head_strikes_landed?: number | null
          id?: string
          knockdowns?: number | null
          leg_strikes_landed?: number | null
          recorded_at?: string
          recorded_by?: string | null
          round_number: number
          significant_strikes_landed?: number | null
          significant_strikes_thrown?: number | null
          strikes_landed?: number | null
          strikes_thrown?: number | null
          submission_attempts?: number | null
          takedown_attempts?: number | null
          takedown_defense?: number | null
          takedowns_successful?: number | null
        }
        Update: {
          aggression_score?: number | null
          body_strikes_landed?: number | null
          cage_control_time?: number | null
          fight_id?: string
          fighter_id?: string
          ground_control_time?: number | null
          head_strikes_landed?: number | null
          id?: string
          knockdowns?: number | null
          leg_strikes_landed?: number | null
          recorded_at?: string
          recorded_by?: string | null
          round_number?: number
          significant_strikes_landed?: number | null
          significant_strikes_thrown?: number | null
          strikes_landed?: number | null
          strikes_thrown?: number | null
          submission_attempts?: number | null
          takedown_attempts?: number | null
          takedown_defense?: number | null
          takedowns_successful?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_statistics_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_statistics_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fight_statistics_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fight_statistics_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      fight_summaries: {
        Row: {
          fight_id: string
          fight_stats_summary: Json | null
          generated_at: string | null
          highlights: Json | null
          id: string
          key_moments: Json | null
          lang: string | null
          model_used: string | null
          summary_md: string
          tokens_used: number | null
        }
        Insert: {
          fight_id: string
          fight_stats_summary?: Json | null
          generated_at?: string | null
          highlights?: Json | null
          id?: string
          key_moments?: Json | null
          lang?: string | null
          model_used?: string | null
          summary_md: string
          tokens_used?: number | null
        }
        Update: {
          fight_id?: string
          fight_stats_summary?: Json | null
          generated_at?: string | null
          highlights?: Json | null
          id?: string
          key_moments?: Json | null
          lang?: string | null
          model_used?: string | null
          summary_md?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_summaries_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_telemetry_events: {
        Row: {
          body_hit: boolean | null
          confidence: number | null
          created_at: string | null
          elbow_angle: number | null
          extension_m: number | null
          face_hit: boolean | null
          fighter_corner: string | null
          fighter_id: string | null
          id: number
          model_version: string | null
          round: number | null
          session_id: string | null
          speed_ms: number | null
          strike_type: string | null
          timestamp_video: number | null
        }
        Insert: {
          body_hit?: boolean | null
          confidence?: number | null
          created_at?: string | null
          elbow_angle?: number | null
          extension_m?: number | null
          face_hit?: boolean | null
          fighter_corner?: string | null
          fighter_id?: string | null
          id?: never
          model_version?: string | null
          round?: number | null
          session_id?: string | null
          speed_ms?: number | null
          strike_type?: string | null
          timestamp_video?: number | null
        }
        Update: {
          body_hit?: boolean | null
          confidence?: number | null
          created_at?: string | null
          elbow_angle?: number | null
          extension_m?: number | null
          face_hit?: boolean | null
          fighter_corner?: string | null
          fighter_id?: string | null
          id?: never
          model_version?: string | null
          round?: number | null
          session_id?: string | null
          speed_ms?: number | null
          strike_type?: string | null
          timestamp_video?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fight_telemetry_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "fight_telemetry_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fight_telemetry_sessions: {
        Row: {
          event_id: string | null
          fight_id: string | null
          fighter_blue_id: string | null
          fighter_red_id: string | null
          hud_connected: boolean | null
          id: string
          last_heartbeat: string | null
          session_token: string
          started_at: string | null
          status: string | null
          vision_connected: boolean | null
        }
        Insert: {
          event_id?: string | null
          fight_id?: string | null
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          hud_connected?: boolean | null
          id?: string
          last_heartbeat?: string | null
          session_token: string
          started_at?: string | null
          status?: string | null
          vision_connected?: boolean | null
        }
        Update: {
          event_id?: string | null
          fight_id?: string | null
          fighter_blue_id?: string | null
          fighter_red_id?: string | null
          hud_connected?: boolean | null
          id?: string
          last_heartbeat?: string | null
          session_token?: string
          started_at?: string | null
          status?: string | null
          vision_connected?: boolean | null
        }
        Relationships: []
      }
      fighter_gym_membership_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          fighter_id: string | null
          gym_id: string | null
          id: string
          notes: string | null
          old_gym_id: string | null
          status_after: string | null
          status_before: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          fighter_id?: string | null
          gym_id?: string | null
          id?: string
          notes?: string | null
          old_gym_id?: string | null
          status_after?: string | null
          status_before?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          fighter_id?: string | null
          gym_id?: string | null
          id?: string
          notes?: string | null
          old_gym_id?: string | null
          status_after?: string | null
          status_before?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_gym_membership_logs_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_membership_logs_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_gym_membership_logs_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_gym_membership_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_membership_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
          {
            foreignKeyName: "fighter_gym_membership_logs_old_gym_id_fkey"
            columns: ["old_gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_membership_logs_old_gym_id_fkey"
            columns: ["old_gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
        ]
      }
      fighter_gym_memberships: {
        Row: {
          coach_user_id: string | null
          created_at: string
          fighter_id: string
          gym_id: string
          id: string
          joined_at: string
          left_at: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          coach_user_id?: string | null
          created_at?: string
          fighter_id: string
          gym_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          coach_user_id?: string | null
          created_at?: string
          fighter_id?: string
          gym_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fighter_gym_memberships_coach_user_id_fkey"
            columns: ["coach_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
        ]
      }
      fighter_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          fighter_profile_id: string | null
          first_name: string
          id: string
          invited_by: string | null
          last_name: string
          phone: string | null
          status: string
          token: string
          weight_class: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          fighter_profile_id?: string | null
          first_name: string
          id?: string
          invited_by?: string | null
          last_name: string
          phone?: string | null
          status?: string
          token: string
          weight_class?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          fighter_profile_id?: string | null
          first_name?: string
          id?: string
          invited_by?: string | null
          last_name?: string
          phone?: string | null
          status?: string
          token?: string
          weight_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_invitations_fighter_profile_id_fkey"
            columns: ["fighter_profile_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_invitations_fighter_profile_id_fkey"
            columns: ["fighter_profile_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_invitations_fighter_profile_id_fkey"
            columns: ["fighter_profile_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      fighter_licenses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          discipline: Database["public"]["Enums"]["discipline"] | null
          expires_at: string | null
          fighter_id: string
          id: string
          is_primary: boolean | null
          issued_at: string | null
          license_level: Database["public"]["Enums"]["license_level"] | null
          license_number: string
          medical_cleared: boolean | null
          medical_expires_at: string | null
          next_fight_date: string | null
          notes: string | null
          organization_id: string | null
          physical_cleared: boolean | null
          qr_code_url: string | null
          status: Database["public"]["Enums"]["license_status"] | null
          suspension_reason: string | null
          suspension_until: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          expires_at?: string | null
          fighter_id: string
          id?: string
          is_primary?: boolean | null
          issued_at?: string | null
          license_level?: Database["public"]["Enums"]["license_level"] | null
          license_number: string
          medical_cleared?: boolean | null
          medical_expires_at?: string | null
          next_fight_date?: string | null
          notes?: string | null
          organization_id?: string | null
          physical_cleared?: boolean | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          suspension_reason?: string | null
          suspension_until?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          expires_at?: string | null
          fighter_id?: string
          id?: string
          is_primary?: boolean | null
          issued_at?: string | null
          license_level?: Database["public"]["Enums"]["license_level"] | null
          license_number?: string
          medical_cleared?: boolean | null
          medical_expires_at?: string | null
          next_fight_date?: string | null
          notes?: string | null
          organization_id?: string | null
          physical_cleared?: boolean | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          suspension_reason?: string | null
          suspension_until?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_licenses_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_licenses_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_licenses_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_licenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fighter_profiles: {
        Row: {
          active: boolean | null
          amateur_draws: number | null
          amateur_losses: number | null
          amateur_wins: number | null
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          birthplace: string | null
          blood_type: string | null
          boxeo_record_draws: number | null
          boxeo_record_losses: number | null
          boxeo_record_wins: number | null
          boxrec_url: string | null
          coach_id: string | null
          completion_level: string | null
          completion_score: number | null
          country: string | null
          created_at: string | null
          discipline: Database["public"]["Enums"]["discipline"] | null
          document_image_url: string | null
          document_number: string | null
          document_type: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          fighting_style: string | null
          first_name: string
          gender: string | null
          gym_id: string | null
          gym_name: string | null
          height_cm: number | null
          id: string
          insurance_company: string | null
          insurance_policy: string | null
          last_name: string
          level: string | null
          license_expires_date: string | null
          license_issued_date: string | null
          license_number: string | null
          license_status: string | null
          martial_arts: string[] | null
          medical_allergies: string | null
          medical_conditions: string | null
          mma_record_draws: number | null
          mma_record_losses: number | null
          mma_record_wins: number | null
          name: string | null
          nickname: string | null
          organization_id: string | null
          primary_license_id: string | null
          pro_draws: number | null
          pro_losses: number | null
          pro_wins: number | null
          reach_cm: number | null
          record_draws: number | null
          record_losses: number | null
          record_type: string | null
          record_wins: number | null
          semi_pro_draws: number | null
          semi_pro_losses: number | null
          semi_pro_wins: number | null
          stance: string | null
          tapology_url: string | null
          updated_at: string | null
          user_id: string | null
          weight_class: string
          weight_kg: number | null
        }
        Insert: {
          active?: boolean | null
          amateur_draws?: number | null
          amateur_losses?: number | null
          amateur_wins?: number | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          birthplace?: string | null
          blood_type?: string | null
          boxeo_record_draws?: number | null
          boxeo_record_losses?: number | null
          boxeo_record_wins?: number | null
          boxrec_url?: string | null
          coach_id?: string | null
          completion_level?: string | null
          completion_score?: number | null
          country?: string | null
          created_at?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          fighting_style?: string | null
          first_name: string
          gender?: string | null
          gym_id?: string | null
          gym_name?: string | null
          height_cm?: number | null
          id?: string
          insurance_company?: string | null
          insurance_policy?: string | null
          last_name: string
          level?: string | null
          license_expires_date?: string | null
          license_issued_date?: string | null
          license_number?: string | null
          license_status?: string | null
          martial_arts?: string[] | null
          medical_allergies?: string | null
          medical_conditions?: string | null
          mma_record_draws?: number | null
          mma_record_losses?: number | null
          mma_record_wins?: number | null
          name?: string | null
          nickname?: string | null
          organization_id?: string | null
          primary_license_id?: string | null
          pro_draws?: number | null
          pro_losses?: number | null
          pro_wins?: number | null
          reach_cm?: number | null
          record_draws?: number | null
          record_losses?: number | null
          record_type?: string | null
          record_wins?: number | null
          semi_pro_draws?: number | null
          semi_pro_losses?: number | null
          semi_pro_wins?: number | null
          stance?: string | null
          tapology_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight_class: string
          weight_kg?: number | null
        }
        Update: {
          active?: boolean | null
          amateur_draws?: number | null
          amateur_losses?: number | null
          amateur_wins?: number | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          birthplace?: string | null
          blood_type?: string | null
          boxeo_record_draws?: number | null
          boxeo_record_losses?: number | null
          boxeo_record_wins?: number | null
          boxrec_url?: string | null
          coach_id?: string | null
          completion_level?: string | null
          completion_score?: number | null
          country?: string | null
          created_at?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          fighting_style?: string | null
          first_name?: string
          gender?: string | null
          gym_id?: string | null
          gym_name?: string | null
          height_cm?: number | null
          id?: string
          insurance_company?: string | null
          insurance_policy?: string | null
          last_name?: string
          level?: string | null
          license_expires_date?: string | null
          license_issued_date?: string | null
          license_number?: string | null
          license_status?: string | null
          martial_arts?: string[] | null
          medical_allergies?: string | null
          medical_conditions?: string | null
          mma_record_draws?: number | null
          mma_record_losses?: number | null
          mma_record_wins?: number | null
          name?: string | null
          nickname?: string | null
          organization_id?: string | null
          primary_license_id?: string | null
          pro_draws?: number | null
          pro_losses?: number | null
          pro_wins?: number | null
          reach_cm?: number | null
          record_draws?: number | null
          record_losses?: number | null
          record_type?: string | null
          record_wins?: number | null
          semi_pro_draws?: number | null
          semi_pro_losses?: number | null
          semi_pro_wins?: number | null
          stance?: string | null
          tapology_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight_class?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
          {
            foreignKeyName: "fighter_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_profiles_primary_license_id_fkey"
            columns: ["primary_license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_profiles_primary_license_id_fkey"
            columns: ["primary_license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
          {
            foreignKeyName: "fighter_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      fighter_rankings: {
        Row: {
          created_at: string | null
          fighter_id: string
          id: string
          is_active: boolean | null
          is_champion: boolean | null
          last_fight_date: string | null
          level: string
          organization_id: string
          points: number | null
          ranking_position: number | null
          updated_at: string | null
          weight_class: string
        }
        Insert: {
          created_at?: string | null
          fighter_id: string
          id?: string
          is_active?: boolean | null
          is_champion?: boolean | null
          last_fight_date?: string | null
          level: string
          organization_id: string
          points?: number | null
          ranking_position?: number | null
          updated_at?: string | null
          weight_class: string
        }
        Update: {
          created_at?: string | null
          fighter_id?: string
          id?: string
          is_active?: boolean | null
          is_champion?: boolean | null
          last_fight_date?: string | null
          level?: string
          organization_id?: string
          points?: number | null
          ranking_position?: number | null
          updated_at?: string | null
          weight_class?: string
        }
        Relationships: [
          {
            foreignKeyName: "fighter_rankings_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_rankings_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_rankings_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_rankings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ranking_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fighter_status_updates: {
        Row: {
          bodyfat_pct: number | null
          created_at: string | null
          created_by: string | null
          fighter_id: string
          id: string
          injuries: string | null
          note: string | null
          ready_to_fight: boolean | null
          weight_kg: number | null
        }
        Insert: {
          bodyfat_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          fighter_id: string
          id?: string
          injuries?: string | null
          note?: string | null
          ready_to_fight?: boolean | null
          weight_kg?: number | null
        }
        Update: {
          bodyfat_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          fighter_id?: string
          id?: string
          injuries?: string | null
          note?: string | null
          ready_to_fight?: boolean | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_status_updates_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_status_updates_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_status_updates_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      fighter_updates: {
        Row: {
          active: boolean
          content: string
          created_at: string
          fighter_id: string
          id: string
          image_url: string | null
          review_status: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          fighter_id: string
          id?: string
          image_url?: string | null
          review_status?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          fighter_id?: string
          id?: string
          image_url?: string | null
          review_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fighter_updates_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_updates_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_updates_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      fights: {
        Row: {
          ai_result: Json | null
          approved_at: string | null
          approved_by: string | null
          card_position: string | null
          created_at: string
          discipline: string | null
          doctor_id: string | null
          event_id: string
          fight_number: number
          fight_type: string
          fighter_a_event_image_url: string | null
          fighter_a_external_id: string | null
          fighter_a_id: string | null
          fighter_b_event_image_url: string | null
          fighter_b_external_id: string | null
          fighter_b_id: string | null
          finish_method: string | null
          finish_round: number | null
          finish_time: string | null
          id: string
          inspector_id: string | null
          is_championship: boolean | null
          notes: string | null
          number_of_rounds: number | null
          referee_id: string | null
          rejection_reason: string | null
          requested_by: string | null
          round_duration_seconds: number | null
          scheduled_time: string | null
          status: string
          timekeeper_id: string | null
          updated_at: string
          weight_class: string
          winner_id: string | null
        }
        Insert: {
          ai_result?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          card_position?: string | null
          created_at?: string
          discipline?: string | null
          doctor_id?: string | null
          event_id: string
          fight_number: number
          fight_type?: string
          fighter_a_event_image_url?: string | null
          fighter_a_external_id?: string | null
          fighter_a_id?: string | null
          fighter_b_event_image_url?: string | null
          fighter_b_external_id?: string | null
          fighter_b_id?: string | null
          finish_method?: string | null
          finish_round?: number | null
          finish_time?: string | null
          id?: string
          inspector_id?: string | null
          is_championship?: boolean | null
          notes?: string | null
          number_of_rounds?: number | null
          referee_id?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          round_duration_seconds?: number | null
          scheduled_time?: string | null
          status?: string
          timekeeper_id?: string | null
          updated_at?: string
          weight_class: string
          winner_id?: string | null
        }
        Update: {
          ai_result?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          card_position?: string | null
          created_at?: string
          discipline?: string | null
          doctor_id?: string | null
          event_id?: string
          fight_number?: number
          fight_type?: string
          fighter_a_event_image_url?: string | null
          fighter_a_external_id?: string | null
          fighter_a_id?: string | null
          fighter_b_event_image_url?: string | null
          fighter_b_external_id?: string | null
          fighter_b_id?: string | null
          finish_method?: string | null
          finish_round?: number | null
          finish_time?: string | null
          id?: string
          inspector_id?: string | null
          is_championship?: boolean | null
          notes?: string | null
          number_of_rounds?: number | null
          referee_id?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          round_duration_seconds?: number | null
          scheduled_time?: string | null
          status?: string
          timekeeper_id?: string | null
          updated_at?: string
          weight_class?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fights_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "bdg_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_a_external_id_fkey"
            columns: ["fighter_a_external_id"]
            isOneToOne: false
            referencedRelation: "external_fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_fighter_a_id_fkey"
            columns: ["fighter_a_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_fighter_b_external_id_fkey"
            columns: ["fighter_b_external_id"]
            isOneToOne: false
            referencedRelation: "external_fighters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_fighter_b_id_fkey"
            columns: ["fighter_b_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_timekeeper_id_fkey"
            columns: ["timekeeper_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      fights_history: {
        Row: {
          blue_fighter_id: string | null
          created_at: string | null
          discipline: Database["public"]["Enums"]["discipline"] | null
          event_date: string | null
          event_name: string | null
          id: string
          method: string | null
          notes: string | null
          organization_id: string | null
          red_fighter_id: string | null
          result: Database["public"]["Enums"]["fight_result"] | null
          round: number | null
          time_in_round: string | null
          weight_class: string | null
        }
        Insert: {
          blue_fighter_id?: string | null
          created_at?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          organization_id?: string | null
          red_fighter_id?: string | null
          result?: Database["public"]["Enums"]["fight_result"] | null
          round?: number | null
          time_in_round?: string | null
          weight_class?: string | null
        }
        Update: {
          blue_fighter_id?: string | null
          created_at?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          organization_id?: string | null
          red_fighter_id?: string | null
          result?: Database["public"]["Enums"]["fight_result"] | null
          round?: number | null
          time_in_round?: string | null
          weight_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fights_history_blue_fighter_id_fkey"
            columns: ["blue_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_history_blue_fighter_id_fkey"
            columns: ["blue_fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_history_blue_fighter_id_fkey"
            columns: ["blue_fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_history_red_fighter_id_fkey"
            columns: ["red_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fights_history_red_fighter_id_fkey"
            columns: ["red_fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fights_history_red_fighter_id_fkey"
            columns: ["red_fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_disciplines: {
        Row: {
          created_at: string
          discipline_id: string
          gym_id: string
          id: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          gym_id: string
          id?: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          gym_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_disciplines_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_disciplines_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_disciplines_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
        ]
      }
      gym_invitations: {
        Row: {
          accepted_at: string | null
          coach_name: string | null
          created_at: string
          email: string
          expires_at: string
          gym_id: string
          id: string
          invited_by: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          coach_name?: string | null
          created_at?: string
          email: string
          expires_at?: string
          gym_id: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          coach_name?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          gym_id?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_invitations_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_invitations_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
        ]
      }
      gym_staff: {
        Row: {
          active: boolean
          created_at: string
          gym_id: string
          id: string
          is_primary: boolean
          role: Database["public"]["Enums"]["gym_staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          gym_id: string
          id?: string
          is_primary?: boolean
          role: Database["public"]["Enums"]["gym_staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          gym_id?: string
          id?: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["gym_staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_staff_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_staff_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
          {
            foreignKeyName: "gym_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          activo: boolean | null
          banner_url: string | null
          ciudad: string | null
          created_at: string | null
          descripcion: string | null
          direccion: string | null
          disciplinas: string[] | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nombre: string
          owner_id: string | null
          pais: string | null
          slug: string
          telefono: string | null
          tiktok: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean | null
          banner_url?: string | null
          ciudad?: string | null
          created_at?: string | null
          descripcion?: string | null
          direccion?: string | null
          disciplinas?: string[] | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nombre: string
          owner_id?: string | null
          pais?: string | null
          slug: string
          telefono?: string | null
          tiktok?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean | null
          banner_url?: string | null
          ciudad?: string | null
          created_at?: string | null
          descripcion?: string | null
          direccion?: string | null
          disciplinas?: string[] | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nombre?: string
          owner_id?: string | null
          pais?: string | null
          slug?: string
          telefono?: string | null
          tiktok?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      judge_station_pins: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          fight_id: string
          id: string
          judge_id: string | null
          pin_code: string
          station_number: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          fight_id: string
          id?: string
          judge_id?: string | null
          pin_code: string
          station_number: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          fight_id?: string
          id?: string
          judge_id?: string | null
          pin_code?: string
          station_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "judge_station_pins_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_station_pins_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_station_sessions: {
        Row: {
          fight_id: string
          id: string
          ip_address: unknown
          judge_id: string | null
          login_at: string | null
          logout_at: string | null
          pin_used: string
          station_number: number
          user_agent: string | null
        }
        Insert: {
          fight_id: string
          id?: string
          ip_address?: unknown
          judge_id?: string | null
          login_at?: string | null
          logout_at?: string | null
          pin_used: string
          station_number: number
          user_agent?: string | null
        }
        Update: {
          fight_id?: string
          id?: string
          ip_address?: unknown
          judge_id?: string | null
          login_at?: string | null
          logout_at?: string | null
          pin_used?: string
          station_number?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_station_sessions_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_station_sessions_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      judges: {
        Row: {
          active: boolean
          certification_level: string
          certified_since: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_activity: string | null
          last_name: string
          license_number: string
          organization_id: string | null
          phone: string | null
          specialization: string[] | null
          total_fights_judged: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          certification_level?: string
          certified_since?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_activity?: string | null
          last_name: string
          license_number: string
          organization_id?: string | null
          phone?: string | null
          specialization?: string[] | null
          total_fights_judged?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          certification_level?: string
          certified_since?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_activity?: string | null
          last_name?: string
          license_number?: string
          organization_id?: string | null
          phone?: string | null
          specialization?: string[] | null
          total_fights_judged?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      license_audit_log: {
        Row: {
          action: string
          id: string
          license_id: string
          metadata: Json | null
          new_level: Database["public"]["Enums"]["license_level"] | null
          new_status: Database["public"]["Enums"]["license_status"] | null
          old_level: Database["public"]["Enums"]["license_level"] | null
          old_status: Database["public"]["Enums"]["license_status"] | null
          performed_at: string | null
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          id?: string
          license_id: string
          metadata?: Json | null
          new_level?: Database["public"]["Enums"]["license_level"] | null
          new_status?: Database["public"]["Enums"]["license_status"] | null
          old_level?: Database["public"]["Enums"]["license_level"] | null
          old_status?: Database["public"]["Enums"]["license_status"] | null
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          id?: string
          license_id?: string
          metadata?: Json | null
          new_level?: Database["public"]["Enums"]["license_level"] | null
          new_status?: Database["public"]["Enums"]["license_status"] | null
          old_level?: Database["public"]["Enums"]["license_level"] | null
          old_status?: Database["public"]["Enums"]["license_status"] | null
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_audit_log_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_audit_log_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
        ]
      }
      license_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          license_id: string
          mime_type: string | null
          notes: string | null
          updated_at: string
          uploaded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          license_id: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          license_id?: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_documents_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_documents_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
        ]
      }
      license_verification_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          license_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          license_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          license_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_verification_tokens_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_verification_tokens_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
        ]
      }
      link_previews: {
        Row: {
          created_at: string | null
          description: string | null
          embed_html: string | null
          embed_type: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          site_name: string | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          embed_html?: string | null
          embed_type?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          site_name?: string | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          embed_html?: string | null
          embed_type?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          site_name?: string | null
          title?: string | null
          url?: string
        }
        Relationships: []
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
      medical_certifications: {
        Row: {
          certification_type: string
          cleared: boolean | null
          created_at: string | null
          expires_date: string
          file_url: string | null
          id: string
          issued_by: string
          issued_date: string | null
          license_id: string
          medical_number: string | null
          notes: string | null
          restrictions: string | null
        }
        Insert: {
          certification_type: string
          cleared?: boolean | null
          created_at?: string | null
          expires_date: string
          file_url?: string | null
          id?: string
          issued_by: string
          issued_date?: string | null
          license_id: string
          medical_number?: string | null
          notes?: string | null
          restrictions?: string | null
        }
        Update: {
          certification_type?: string
          cleared?: boolean | null
          created_at?: string | null
          expires_date?: string
          file_url?: string | null
          id?: string
          issued_by?: string
          issued_date?: string | null
          license_id?: string
          medical_number?: string | null
          notes?: string | null
          restrictions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_certifications_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "fighter_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_certifications_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["license_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      official_certifications: {
        Row: {
          active: boolean | null
          certification_type: string
          created_at: string
          discipline: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          issuing_body: string
          official_id: string
          updated_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          active?: boolean | null
          certification_type: string
          created_at?: string
          discipline: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date: string
          issuing_body: string
          official_id: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          active?: boolean | null
          certification_type?: string
          created_at?: string
          discipline?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          issuing_body?: string
          official_id?: string
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_certifications_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      officials: {
        Row: {
          active: boolean | null
          available: boolean | null
          average_rating: number | null
          certification_date: string | null
          certification_expires: string | null
          certification_level: string
          certified_by: string | null
          country: string | null
          created_at: string
          document_id: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          legacy_judge_id: string | null
          license_number: string | null
          official_type: string
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          specialization: string[] | null
          suspended: boolean | null
          total_events_worked: number | null
          total_fights_worked: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          available?: boolean | null
          average_rating?: number | null
          certification_date?: string | null
          certification_expires?: string | null
          certification_level?: string
          certified_by?: string | null
          country?: string | null
          created_at?: string
          document_id?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          legacy_judge_id?: string | null
          license_number?: string | null
          official_type: string
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          specialization?: string[] | null
          suspended?: boolean | null
          total_events_worked?: number | null
          total_fights_worked?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          available?: boolean | null
          average_rating?: number | null
          certification_date?: string | null
          certification_expires?: string | null
          certification_level?: string
          certified_by?: string | null
          country?: string | null
          created_at?: string
          document_id?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          legacy_judge_id?: string | null
          license_number?: string | null
          official_type?: string
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          specialization?: string[] | null
          suspended?: boolean | null
          total_events_worked?: number | null
          total_fights_worked?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          name: string
          short_code: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          short_code?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          short_code?: string | null
        }
        Relationships: []
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
      post_comments: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string | null
          hashtag: string
          id: string
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          hashtag: string
          id?: string
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          hashtag?: string
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string | null
          duration: number | null
          file_path: string
          file_size: number | null
          file_type: string
          height: number | null
          id: string
          mime_type: string | null
          post_id: string
          thumbnail_path: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_path: string
          file_size?: number | null
          file_type: string
          height?: number | null
          id?: string
          mime_type?: string | null
          post_id: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_path?: string
          file_size?: number | null
          file_type?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          post_id?: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          mentioned_user_type: string
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          mentioned_user_type: string
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          mentioned_user_type?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_change_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          fighter_profile_id: string
          id: string
          requested_changes: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          fighter_profile_id: string
          id?: string
          requested_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          fighter_profile_id?: string
          id?: string
          requested_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_requests_fighter_profile_id_fkey"
            columns: ["fighter_profile_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_change_requests_fighter_profile_id_fkey"
            columns: ["fighter_profile_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "profile_change_requests_fighter_profile_id_fkey"
            columns: ["fighter_profile_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "profile_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_change_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_organizations: {
        Row: {
          allowed_levels: string[]
          can_create_events: boolean
          can_sanction_fights: boolean
          code: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          description: string | null
          discipline: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          short_name: string
          slug: string | null
          updated_at: string | null
          verified: boolean
          website: string | null
        }
        Insert: {
          allowed_levels: string[]
          can_create_events?: boolean
          can_sanction_fights?: boolean
          code: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          discipline: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          short_name: string
          slug?: string | null
          updated_at?: string | null
          verified?: boolean
          website?: string | null
        }
        Update: {
          allowed_levels?: string[]
          can_create_events?: boolean
          can_sanction_fights?: boolean
          code?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          discipline?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          short_name?: string
          slug?: string | null
          updated_at?: string | null
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      ranking_point_adjustments: {
        Row: {
          adjusted_by: string
          adjustment_amount: number
          created_at: string | null
          fight_id: string | null
          fighter_id: string
          id: string
          new_points: number
          previous_points: number
          ranking_id: string
          reason: string
        }
        Insert: {
          adjusted_by: string
          adjustment_amount: number
          created_at?: string | null
          fight_id?: string | null
          fighter_id: string
          id?: string
          new_points: number
          previous_points: number
          ranking_id: string
          reason: string
        }
        Update: {
          adjusted_by?: string
          adjustment_amount?: number
          created_at?: string | null
          fight_id?: string | null
          fighter_id?: string
          id?: string
          new_points?: number
          previous_points?: number
          ranking_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_point_adjustments_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_point_adjustments_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_point_adjustments_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "ranking_point_adjustments_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "ranking_point_adjustments_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "fighter_rankings"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "round_contestants_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
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
            foreignKeyName: "round_totals_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
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
      sanction_appeals: {
        Row: {
          appealed_by: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          sanction_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appealed_by: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          sanction_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appealed_by?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          sanction_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanction_appeals_sanction_id_fkey"
            columns: ["sanction_id"]
            isOneToOne: false
            referencedRelation: "sanctions"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          description: string | null
          end_date: string | null
          evidence_urls: string[] | null
          fine_amount: number | null
          fine_paid: boolean | null
          id: string
          issued_by: string | null
          notes: string | null
          reason: string
          related_event_id: string | null
          related_fight_id: string | null
          sanction_type: string
          severity: number
          start_date: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          description?: string | null
          end_date?: string | null
          evidence_urls?: string[] | null
          fine_amount?: number | null
          fine_paid?: boolean | null
          id?: string
          issued_by?: string | null
          notes?: string | null
          reason: string
          related_event_id?: string | null
          related_fight_id?: string | null
          sanction_type: string
          severity?: number
          start_date?: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          description?: string | null
          end_date?: string | null
          evidence_urls?: string[] | null
          fine_amount?: number | null
          fine_paid?: boolean | null
          id?: string
          issued_by?: string | null
          notes?: string | null
          reason?: string
          related_event_id?: string | null
          related_fight_id?: string | null
          sanction_type?: string
          severity?: number
          start_date?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "bdg_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_related_fight_id_fkey"
            columns: ["related_fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_events: {
        Row: {
          corner: Database["public"]["Enums"]["corner"]
          created_at: string | null
          fight_id: string
          id: number
          judge_id: string
          power: number | null
          round_id: string
          target: Database["public"]["Enums"]["strike_target"] | null
          timestamp_ms: number
          type: Database["public"]["Enums"]["strike_type"]
        }
        Insert: {
          corner: Database["public"]["Enums"]["corner"]
          created_at?: string | null
          fight_id: string
          id?: number
          judge_id: string
          power?: number | null
          round_id: string
          target?: Database["public"]["Enums"]["strike_target"] | null
          timestamp_ms: number
          type: Database["public"]["Enums"]["strike_type"]
        }
        Update: {
          corner?: Database["public"]["Enums"]["corner"]
          created_at?: string | null
          fight_id?: string
          id?: number
          judge_id?: string
          power?: number | null
          round_id?: string
          target?: Database["public"]["Enums"]["strike_target"] | null
          timestamp_ms?: number
          type?: Database["public"]["Enums"]["strike_type"]
        }
        Relationships: [
          {
            foreignKeyName: "scoring_events_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_weights: {
        Row: {
          body_multiplier: number | null
          created_at: string | null
          defense_weight: number | null
          event_id: string | null
          head_multiplier: number | null
          id: number
          kick_weight: number | null
          punch_weight: number | null
        }
        Insert: {
          body_multiplier?: number | null
          created_at?: string | null
          defense_weight?: number | null
          event_id?: string | null
          head_multiplier?: number | null
          id?: number
          kick_weight?: number | null
          punch_weight?: number | null
        }
        Update: {
          body_multiplier?: number | null
          created_at?: string | null
          defense_weight?: number | null
          event_id?: string | null
          head_multiplier?: number | null
          id?: number
          kick_weight?: number | null
          punch_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_weights_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "bdg_event"
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
      social_posts: {
        Row: {
          active: boolean
          author_id: string
          author_type: string
          comments_count: number
          content: string
          created_at: string
          featured: boolean
          id: string
          likes_count: number
          media_files: Json | null
          media_urls: string[] | null
          post_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author_id: string
          author_type: string
          comments_count?: number
          content: string
          created_at?: string
          featured?: boolean
          id?: string
          likes_count?: number
          media_files?: Json | null
          media_urls?: string[] | null
          post_type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author_id?: string
          author_type?: string
          comments_count?: number
          content?: string
          created_at?: string
          featured?: boolean
          id?: string
          likes_count?: number
          media_files?: Json | null
          media_urls?: string[] | null
          post_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sparring_requests: {
        Row: {
          created_at: string | null
          discipline: Database["public"]["Enums"]["discipline"] | null
          from_fighter_id: string
          id: string
          location: string | null
          message: string | null
          proposed_at: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          to_fighter_id: string | null
          weight_range: string | null
        }
        Insert: {
          created_at?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          from_fighter_id: string
          id?: string
          location?: string | null
          message?: string | null
          proposed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          to_fighter_id?: string | null
          weight_range?: string | null
        }
        Update: {
          created_at?: string | null
          discipline?: Database["public"]["Enums"]["discipline"] | null
          from_fighter_id?: string
          id?: string
          location?: string | null
          message?: string | null
          proposed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          to_fighter_id?: string | null
          weight_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sparring_requests_from_fighter_id_fkey"
            columns: ["from_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sparring_requests_from_fighter_id_fkey"
            columns: ["from_fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "sparring_requests_from_fighter_id_fkey"
            columns: ["from_fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "sparring_requests_to_fighter_id_fkey"
            columns: ["to_fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sparring_requests_to_fighter_id_fkey"
            columns: ["to_fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "sparring_requests_to_fighter_id_fkey"
            columns: ["to_fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
        ]
      }
      sports_news: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          published_at: string
          source: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          published_at: string
          source: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          published_at?: string
          source?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      station_access_log: {
        Row: {
          accessed_at: string | null
          disconnected_at: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          judge_name_provided: string | null
          pin_attempted: string
          session_duration: string | null
          session_id: string | null
          station_number: number
          success: boolean
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          disconnected_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          judge_name_provided?: string | null
          pin_attempted: string
          session_duration?: string | null
          session_id?: string | null
          station_number: number
          success: boolean
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          disconnected_at?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          judge_name_provided?: string | null
          pin_attempted?: string
          session_duration?: string | null
          session_id?: string | null
          station_number?: number
          success?: boolean
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "station_access_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "station_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      station_rate_limits: {
        Row: {
          failed_attempts: number | null
          first_attempt_at: string | null
          id: string
          ip_address: unknown
          locked_until: string | null
          station_number: number
        }
        Insert: {
          failed_attempts?: number | null
          first_attempt_at?: string | null
          id?: string
          ip_address: unknown
          locked_until?: string | null
          station_number: number
        }
        Update: {
          failed_attempts?: number | null
          first_attempt_at?: string | null
          id?: string
          ip_address?: unknown
          locked_until?: string | null
          station_number?: number
        }
        Relationships: []
      }
      station_sessions: {
        Row: {
          assigned_judge_id: string | null
          created_at: string | null
          created_by: string | null
          event_id: string
          expires_at: string
          id: string
          is_active: boolean | null
          pin_code: string
          station_number: number
        }
        Insert: {
          assigned_judge_id?: string | null
          created_at?: string | null
          created_by?: string | null
          event_id: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          pin_code: string
          station_number: number
        }
        Update: {
          assigned_judge_id?: string | null
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          pin_code?: string
          station_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "station_sessions_assigned_judge_id_fkey"
            columns: ["assigned_judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "bdg_event"
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
      trending_hashtags: {
        Row: {
          count: number | null
          hashtag: string
          id: string
          period: string | null
          updated_at: string | null
        }
        Insert: {
          count?: number | null
          hashtag: string
          id?: string
          period?: string | null
          updated_at?: string | null
        }
        Update: {
          count?: number | null
          hashtag?: string
          id?: string
          period?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_discipline_access: {
        Row: {
          created_at: string
          discipline: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discipline: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discipline?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_processing_jobs: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          file_size_bytes: number | null
          id: string
          metadata: Json | null
          original_path: string
          post_id: string | null
          processed_path: string | null
          progress: number | null
          resolution: string | null
          status: string | null
          thumbnail_path: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          original_path: string
          post_id?: string | null
          processed_path?: string | null
          progress?: number | null
          resolution?: string | null
          status?: string | null
          thumbnail_path?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          original_path?: string
          post_id?: string | null
          processed_path?: string | null
          progress?: number | null
          resolution?: string | null
          status?: string | null
          thumbnail_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_processing_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_sync_sessions: {
        Row: {
          created_at: string
          fight_id: string | null
          hud_connected: boolean
          id: string
          session_token: string
          vision_connected: boolean
        }
        Insert: {
          created_at?: string
          fight_id?: string | null
          hud_connected?: boolean
          id?: string
          session_token: string
          vision_connected?: boolean
        }
        Update: {
          created_at?: string
          fight_id?: string | null
          hud_connected?: boolean
          id?: string
          session_token?: string
          vision_connected?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vision_sync_sessions_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          device_id: string | null
          id: number
          ip: unknown
          round_id: string
          user_id: string | null
          value_json: Json
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: number
          ip?: unknown
          round_id: string
          user_id?: string | null
          value_json: Json
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: number
          ip?: unknown
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
      incomplete_fighter_profiles: {
        Row: {
          approved_at: string | null
          birthdate: string | null
          blood_type: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          fighter_id: string | null
          first_name: string | null
          gender: string | null
          last_name: string | null
          license_created_at: string | null
          license_id: string | null
          license_number: string | null
          license_status: Database["public"]["Enums"]["license_status"] | null
          missing_fields: string[] | null
          user_phone: string | null
        }
        Relationships: []
      }
      v_fighter_gym_history: {
        Row: {
          duration_days: number | null
          fighter_id: string | null
          first_name: string | null
          gym_id: string | null
          gym_nombre: string | null
          joined_at: string | null
          last_name: string | null
          left_at: string | null
          membership_id: string | null
          status: Database["public"]["Enums"]["membership_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_gym_memberships_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "fighter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "incomplete_fighter_profiles"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_fighter_id_fkey"
            columns: ["fighter_id"]
            isOneToOne: false
            referencedRelation: "v_fighters_current_gym"
            referencedColumns: ["fighter_id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_gym_memberships_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
        ]
      }
      v_fighters_current_gym: {
        Row: {
          days_in_gym: number | null
          fighter_id: string | null
          first_name: string | null
          full_name: string | null
          gym_id: string | null
          gym_nombre: string | null
          gym_slug: string | null
          joined_at: string | null
          last_name: string | null
          nickname: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fighter_profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fighter_profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "v_gym_statistics"
            referencedColumns: ["gym_id"]
          },
        ]
      }
      v_gym_statistics: {
        Row: {
          active_fighters: number | null
          avg_days_active_fighters: number | null
          gym_id: string | null
          gym_nombre: string | null
          last_fighter_joined: string | null
          slug: string | null
          total_fighters_all_time: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_fighter_invitation: {
        Args: { p_fighter_profile_id: string; p_token: string }
        Returns: boolean
      }
      accept_gym_invitation: { Args: { p_token: string }; Returns: Json }
      adjust_ranking_points: {
        Args: {
          p_fight_id?: string
          p_new_points: number
          p_ranking_id: string
          p_reason: string
        }
        Returns: undefined
      }
      admin_create_fighter_profile: {
        Args: { p_profile_data: Json }
        Returns: string
      }
      admin_delete_fighter_profile: {
        Args: { p_fighter_id: string }
        Returns: undefined
      }
      admin_update_fighter_profile:
        | {
            Args: {
              p_avatar_url?: string
              p_bio?: string
              p_blood_type?: string
              p_boxrec_url?: string
              p_city?: string
              p_coach_id?: string
              p_country?: string
              p_discipline?: string
              p_emergency_contact_name?: string
              p_emergency_contact_phone?: string
              p_facebook?: string
              p_fighter_id: string
              p_first_name?: string
              p_gender?: string
              p_gym_id?: string
              p_height_cm?: number
              p_instagram?: string
              p_last_name?: string
              p_level?: string
              p_medical_notes?: string
              p_nickname?: string
              p_reach_cm?: number
              p_stance?: string
              p_tapology_url?: string
              p_tiktok?: string
              p_twitter?: string
              p_weight_class?: string
              p_youtube?: string
            }
            Returns: Json
          }
        | {
            Args: { p_fighter_id: string; p_profile_data: Json }
            Returns: undefined
          }
      admin_update_fighter_profile_v10: {
        Args: { p_fighter_id: string; p_profile_data: Json }
        Returns: undefined
      }
      approve_license: {
        Args: {
          p_level?: Database["public"]["Enums"]["license_level"]
          p_license_id: string
        }
        Returns: undefined
      }
      approve_license_with_sync: {
        Args: {
          p_level?: Database["public"]["Enums"]["license_level"]
          p_license_id: string
        }
        Returns: undefined
      }
      assign_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_parimutuel_payout: {
        Args: { p_market_id: string; p_outcome_id: string; p_stake: number }
        Returns: number
      }
      calculate_profile_completion: {
        Args: { p_fighter_id: string }
        Returns: Json
      }
      can_join_gym: {
        Args: { p_fighter_id: string; p_gym_id: string }
        Returns: boolean
      }
      check_doping_eligibility: {
        Args: { p_license_id: string }
        Returns: Json
      }
      check_email_exists_fn: { Args: { p_email: string }; Returns: boolean }
      check_user_license_status: {
        Args: { p_auth_user_id: string }
        Returns: Json
      }
      cleanup_expired_invitations: { Args: never; Returns: number }
      cleanup_old_ai_events: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      confirm_bet_after_delay: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      control_round: {
        Args: { p_action: string; p_round_id: string }
        Returns: Json
      }
      create_complete_fighter_registration: {
        Args: {
          p_auth_user_id: string
          p_avatar_url?: string
          p_bio?: string
          p_birthdate?: string
          p_birthplace?: string
          p_blood_type?: string
          p_country: string
          p_discipline?: string
          p_document_number?: string
          p_document_type?: string
          p_email: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_emergency_contact_relation?: string
          p_fighting_style?: string
          p_first_name: string
          p_gender?: string
          p_gym_name?: string
          p_height_cm?: number
          p_insurance_company?: string
          p_insurance_policy?: string
          p_last_name: string
          p_level?: string
          p_martial_arts?: string[]
          p_medical_allergies?: string
          p_medical_conditions?: string
          p_nickname?: string
          p_phone: string
          p_reach_cm?: number
          p_record_draws?: number
          p_record_losses?: number
          p_record_wins?: number
          p_stance?: string
          p_weight_class: string
          p_weight_kg?: number
        }
        Returns: Json
      }
      create_fighter_profile_with_license: {
        Args: {
          p_auth_user_id: string
          p_bio?: string
          p_birthdate?: string
          p_country: string
          p_discipline?: Database["public"]["Enums"]["discipline"]
          p_email: string
          p_fighting_style?: string
          p_first_name: string
          p_gender?: string
          p_gym_name?: string
          p_height_cm: number
          p_last_name: string
          p_level?: string
          p_martial_arts?: string[]
          p_nickname?: string
          p_phone?: string
          p_reach_cm?: number
          p_record_draws?: number
          p_record_losses?: number
          p_record_type?: string
          p_record_wins?: number
          p_stance?: string
          p_weight_class: string
          p_weight_kg: number
        }
        Returns: Json
      }
      create_friendship: {
        Args: { p_user1_id: string; p_user2_id: string }
        Returns: undefined
      }
      delete_fighter_license: {
        Args: { p_license_id: string }
        Returns: undefined
      }
      enroll_fighter_in_ranking: {
        Args: {
          p_fighter_id: string
          p_level: string
          p_organization_code: string
          p_weight_class: string
        }
        Returns: string
      }
      expire_old_licenses: { Args: never; Returns: undefined }
      generate_license_number: { Args: never; Returns: string }
      generate_license_qr_token: {
        Args: { p_license_id: string }
        Returns: string
      }
      generate_station_pin: {
        Args: {
          p_assigned_judge_id?: string
          p_created_by?: string
          p_event_id: string
          p_station_number: number
        }
        Returns: {
          expires_at: string
          pin_code: string
          session_id: string
        }[]
      }
      get_ai_fight_stats: {
        Args: { p_fight_id: string; p_round_number?: number }
        Returns: {
          accuracy: number
          attempted_count: number
          connected_count: number
          fighter: string
          last_strike_ms: number
        }[]
      }
      get_current_user_judge_id: { Args: never; Returns: string }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_fighter_gym_history: {
        Args: { p_fighter_id: string }
        Returns: {
          duration_days: number
          gym_id: string
          gym_nombre: string
          joined_at: string
          left_at: string
          status: string
        }[]
      }
      get_fighter_sensitive_data: {
        Args: { p_fighter_id: string }
        Returns: {
          birthdate: string
          birthplace: string
          blood_type: string
          document_number: string
          document_type: string
          emergency_contact_name: string
          emergency_contact_phone: string
          emergency_contact_relation: string
          insurance_company: string
          insurance_policy: string
          license_expires_date: string
          license_issued_date: string
          medical_allergies: string
          medical_conditions: string
        }[]
      }
      get_or_create_daily_usage: {
        Args: { target_date: string }
        Returns: {
          date: string
          emails_sent: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "email_daily_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_post_comments_with_author: {
        Args: { p_post_id: string }
        Returns: {
          active: boolean
          author_avatar: string
          author_discipline: string
          author_name: string
          author_nickname: string
          author_record_type: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_recent_doping_tests: {
        Args: { p_license_id: string; p_months?: number }
        Returns: {
          id: string
          result_status: Database["public"]["Enums"]["doping_result_status"]
          test_date: string
          test_type: Database["public"]["Enums"]["doping_test_type"]
          testing_agency: string
          verified_at: string
        }[]
      }
      get_station_number: { Args: { p_role: string }; Returns: number }
      get_station_status: {
        Args: { p_event_id: string }
        Returns: {
          assigned_judge_name: string
          connected_judge_name: string
          expires_at: string
          is_active: boolean
          is_connected: boolean
          last_access: string
          pin_code: string
          station_number: number
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_official_role: {
        Args: { _official_type: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_fighter_data: {
        Args: {
          p_academy?: string
          p_age: number
          p_birth_date?: string
          p_country: string
          p_first_name: string
          p_height_text: string
          p_last_name: string
          p_nickname?: string
          p_record: string
          p_weight_lbs: number
        }
        Returns: string
      }
      increment_daily_email_count: {
        Args: { increment_by?: number; target_date: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_app_admin: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_judge: { Args: { p_fight_id: string }; Returns: boolean }
      is_assigned_referee: { Args: { p_fight_id: string }; Returns: boolean }
      is_fighter_owner: { Args: { p_fighter_id: string }; Returns: boolean }
      is_gym_owner: {
        Args: { _gym_id: string; _user_id: string }
        Returns: boolean
      }
      is_gym_staff: {
        Args: { _gym_id: string; _user_id: string }
        Returns: boolean
      }
      is_judge: { Args: { _user_id: string }; Returns: boolean }
      moderate_fighter_update: {
        Args: {
          p_admin_notes?: string
          p_new_status: string
          p_update_id: string
        }
        Returns: Json
      }
      prepare_fight_for_scoring: {
        Args: {
          p_fight_id: string
          p_judge_1_id: string
          p_judge_2_id: string
          p_judge_3_id: string
          p_referee_id: string
        }
        Returns: Json
      }
      process_bet_transaction: {
        Args: {
          p_market_id: string
          p_outcome_id: string
          p_stake: number
          p_user_id: string
        }
        Returns: string
      }
      reactivate_fighter_profile: {
        Args: { p_auth_user_id: string; p_email: string }
        Returns: Json
      }
      refund_bet: {
        Args: { p_reason: string; p_ticket_id: string }
        Returns: undefined
      }
      remove_fighter_from_ranking: {
        Args: { p_ranking_id: string }
        Returns: undefined
      }
      remove_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      reprocess_approved_profile_changes: { Args: never; Returns: undefined }
      request_fighter_license: {
        Args: {
          p_document_urls?: Json
          p_fighter_profile_data: Json
          p_license_data?: Json
        }
        Returns: Json
      }
      search_fighters_for_gym:
        | {
            Args: {
              p_discipline?: string
              p_level?: string
              p_limit?: number
              p_offset?: number
              p_search?: string
              p_weight_class?: string
            }
            Returns: {
              active_gym_id: string
              active_gym_name: string
              avatar_url: string
              boxeo_record_draws: number
              boxeo_record_losses: number
              boxeo_record_wins: number
              discipline: Database["public"]["Enums"]["discipline"]
              first_name: string
              id: string
              last_name: string
              level: string
              mma_record_draws: number
              mma_record_losses: number
              mma_record_wins: number
              nickname: string
              record_draws: number
              record_losses: number
              record_wins: number
              weight_class: string
            }[]
          }
        | {
            Args: {
              p_discipline?: string
              p_gym_id?: string
              p_level?: string
              p_limit?: number
              p_offset?: number
              p_search?: string
              p_weight_class?: string
            }
            Returns: {
              active_gym_id: string
              active_gym_name: string
              avatar_url: string
              boxeo_record_draws: number
              boxeo_record_losses: number
              boxeo_record_wins: number
              discipline: Database["public"]["Enums"]["discipline"]
              first_name: string
              id: string
              last_name: string
              level: string
              mma_record_draws: number
              mma_record_losses: number
              mma_record_wins: number
              nickname: string
              record_draws: number
              record_losses: number
              record_wins: number
              weight_class: string
            }[]
          }
      settle_market_payouts: {
        Args: { p_market_id: string; p_winning_outcome_id: string }
        Returns: undefined
      }
      suspend_license: {
        Args: { p_license_id: string; p_reason: string; p_until?: string }
        Returns: undefined
      }
      update_fighter_ranking_level: {
        Args: { p_new_level: string; p_ranking_id: string }
        Returns: undefined
      }
      update_single_fighter_record: {
        Args: { p_fight_type: string; p_fighter_id: string }
        Returns: undefined
      }
      user_update_fighter_profile: {
        Args: { p_fighter_id: string; p_profile_data: Json }
        Returns: undefined
      }
      validate_fight_eligibility: {
        Args: {
          p_fighter_a_id: string
          p_fighter_b_id: string
          p_weight_class?: string
        }
        Returns: Json
      }
      validate_fighter_invitation: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          first_name: string
          id: string
          last_name: string
          phone: string
          weight_class: string
        }[]
      }
      validate_profile_change_request: {
        Args: { p_fighter_id: string; p_requested_changes: Json }
        Returns: Json
      }
      validate_station_pin:
        | {
            Args: {
              p_fight_id: string
              p_pin_code: string
              p_station_number: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_ip_address?: unknown
              p_judge_name?: string
              p_pin_code: string
              p_station_number: number
              p_user_agent?: string
            }
            Returns: {
              current_fight_id: string
              event_id: string
              event_name: string
              failure_reason: string
              session_id: string
              valid: boolean
            }[]
          }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "judge"
        | "super_admin"
        | "license_officer"
        | "technical_coordinator"
        | "auditor"
        | "promoter"
        | "official_judge"
        | "official_referee"
        | "official_doctor"
        | "official_timekeeper"
        | "official_inspector"
        | "gym_owner"
        | "gym_coach"
        | "gym_assistant"
      corner: "red" | "blue"
      discipline:
        | "MMA"
        | "Boxeo"
        | "Judo"
        | "JiuJitsu"
        | "Kickboxing"
        | "MuayThai"
        | "Grappling"
        | "Otro"
      discipline_type:
        | "MMA"
        | "Boxeo"
        | "Judo"
        | "JiuJitsu"
        | "Kickboxing"
        | "MuayThai"
        | "Grappling"
        | "Otro"
      doping_result_status: "PENDING" | "CLEAN" | "POSITIVE" | "INCONCLUSIVE"
      doping_test_type: "PRE_FIGHT" | "RANDOM" | "POST_FIGHT" | "ANNUAL"
      fight_result: "red_win" | "blue_win" | "draw" | "no_contest" | "scheduled"
      gym_staff_role: "OWNER" | "HEAD_COACH" | "ASSISTANT_COACH"
      license_level:
        | "AMATEUR"
        | "SEMI_PRO"
        | "PROFESSIONAL"
        | "SUSPENDED"
        | "RETIRED"
      license_state: "active" | "suspended" | "expired" | "pending"
      license_status:
        | "APPLIED"
        | "PENDING_REVIEW"
        | "ACTIVE"
        | "SUSPENDED"
        | "REVOKED"
        | "EXPIRED"
      membership_status: "ACTIVE" | "INACTIVE" | "TRANSFERRED" | "SUSPENDED"
      request_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "expired"
      strike_target: "head" | "body" | "leg"
      strike_type:
        | "punch"
        | "kick"
        | "elbow"
        | "knee"
        | "takedown"
        | "knockdown"
        | "defense"
        | "foul"
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
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "judge",
        "super_admin",
        "license_officer",
        "technical_coordinator",
        "auditor",
        "promoter",
        "official_judge",
        "official_referee",
        "official_doctor",
        "official_timekeeper",
        "official_inspector",
        "gym_owner",
        "gym_coach",
        "gym_assistant",
      ],
      corner: ["red", "blue"],
      discipline: [
        "MMA",
        "Boxeo",
        "Judo",
        "JiuJitsu",
        "Kickboxing",
        "MuayThai",
        "Grappling",
        "Otro",
      ],
      discipline_type: [
        "MMA",
        "Boxeo",
        "Judo",
        "JiuJitsu",
        "Kickboxing",
        "MuayThai",
        "Grappling",
        "Otro",
      ],
      doping_result_status: ["PENDING", "CLEAN", "POSITIVE", "INCONCLUSIVE"],
      doping_test_type: ["PRE_FIGHT", "RANDOM", "POST_FIGHT", "ANNUAL"],
      fight_result: ["red_win", "blue_win", "draw", "no_contest", "scheduled"],
      gym_staff_role: ["OWNER", "HEAD_COACH", "ASSISTANT_COACH"],
      license_level: [
        "AMATEUR",
        "SEMI_PRO",
        "PROFESSIONAL",
        "SUSPENDED",
        "RETIRED",
      ],
      license_state: ["active", "suspended", "expired", "pending"],
      license_status: [
        "APPLIED",
        "PENDING_REVIEW",
        "ACTIVE",
        "SUSPENDED",
        "REVOKED",
        "EXPIRED",
      ],
      membership_status: ["ACTIVE", "INACTIVE", "TRANSFERRED", "SUSPENDED"],
      request_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "expired",
      ],
      strike_target: ["head", "body", "leg"],
      strike_type: [
        "punch",
        "kick",
        "elbow",
        "knee",
        "takedown",
        "knockdown",
        "defense",
        "foul",
      ],
    },
  },
} as const
