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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_logs: {
        Row: {
          action_taken: string
          campaign_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          action_taken: string
          campaign_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          action_taken?: string
          campaign_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participants: {
        Row: {
          campaign_id: string
          created_at: string | null
          creator_id: string
          current_engagement_rate: number | null
          escrow_amount: number | null
          id: string
          real_time_sales_lift: number | null
          status: Database["public"]["Enums"]["participant_status"]
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          creator_id: string
          current_engagement_rate?: number | null
          escrow_amount?: number | null
          id?: string
          real_time_sales_lift?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          creator_id?: string
          current_engagement_rate?: number | null
          escrow_amount?: number | null
          id?: string
          real_time_sales_lift?: number | null
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_rewards: {
        Row: {
          bonus_rate_viral: number | null
          budget_cap: number
          campaign_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          min_payout_threshold: number
          min_view_threshold: number
          rate_per_1k_views: number
          updated_at: string | null
        }
        Insert: {
          bonus_rate_viral?: number | null
          budget_cap?: number
          campaign_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_payout_threshold?: number
          min_view_threshold?: number
          rate_per_1k_views?: number
          updated_at?: string | null
        }
        Update: {
          bonus_rate_viral?: number | null
          budget_cap?: number
          campaign_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_payout_threshold?: number
          min_view_threshold?: number
          rate_per_1k_views?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_rewards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          agency_user_id: string
          cpv_rate: number | null
          created_at: string | null
          id: string
          is_cpv_campaign: boolean | null
          locked_budget: number | null
          name: string
          remaining_budget: number
          status: Database["public"]["Enums"]["campaign_status"]
          total_budget: number
          updated_at: string | null
          vibe_description: string | null
          viral_threshold: number | null
        }
        Insert: {
          agency_user_id: string
          cpv_rate?: number | null
          created_at?: string | null
          id?: string
          is_cpv_campaign?: boolean | null
          locked_budget?: number | null
          name: string
          remaining_budget?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          total_budget?: number
          updated_at?: string | null
          vibe_description?: string | null
          viral_threshold?: number | null
        }
        Update: {
          agency_user_id?: string
          cpv_rate?: number | null
          created_at?: string | null
          id?: string
          is_cpv_campaign?: boolean | null
          locked_budget?: number | null
          name?: string
          remaining_budget?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          total_budget?: number
          updated_at?: string | null
          vibe_description?: string | null
          viral_threshold?: number | null
        }
        Relationships: []
      }
      content_performance: {
        Row: {
          campaign_id: string
          content_url: string | null
          created_at: string | null
          creator_id: string
          id: string
          is_viral: boolean | null
          last_synced_at: string | null
          platform: string
          previous_view_count: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          campaign_id: string
          content_url?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          is_viral?: boolean | null
          last_synced_at?: string | null
          platform: string
          previous_view_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          campaign_id?: string
          content_url?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          is_viral?: boolean | null
          last_synced_at?: string | null
          platform?: string
          previous_view_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_performance_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_wallets: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          last_payout_at: string | null
          min_payout_threshold: number | null
          payout_status: string | null
          pending_earnings: number | null
          stripe_account_id: string | null
          total_earned: number | null
          total_withdrawn: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          last_payout_at?: string | null
          min_payout_threshold?: number | null
          payout_status?: string | null
          pending_earnings?: number | null
          stripe_account_id?: string | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          last_payout_at?: string | null
          min_payout_threshold?: number | null
          payout_status?: string | null
          pending_earnings?: number | null
          stripe_account_id?: string | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_wallets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          aesthetic_score: number | null
          avatar_url: string | null
          base_rate: number | null
          created_at: string | null
          handle: string
          id: string
          name: string
          niche: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aesthetic_score?: number | null
          avatar_url?: string | null
          base_rate?: number | null
          created_at?: string | null
          handle: string
          id?: string
          name: string
          niche?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aesthetic_score?: number | null
          avatar_url?: string | null
          base_rate?: number | null
          created_at?: string | null
          handle?: string
          id?: string
          name?: string
          niche?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      earnings_history: {
        Row: {
          amount_earned: number
          campaign_id: string
          content_performance_id: string | null
          cpv_rate: number
          created_at: string | null
          creator_id: string
          id: string
          views_earned: number
        }
        Insert: {
          amount_earned: number
          campaign_id: string
          content_performance_id?: string | null
          cpv_rate: number
          created_at?: string | null
          creator_id: string
          id?: string
          views_earned: number
        }
        Update: {
          amount_earned?: number
          campaign_id?: string
          content_performance_id?: string | null
          cpv_rate?: number
          created_at?: string | null
          creator_id?: string
          id?: string
          views_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "earnings_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_history_content_performance_id_fkey"
            columns: ["content_performance_id"]
            isOneToOne: false
            referencedRelation: "content_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_history_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string | null
          creator_id: string
          error_message: string | null
          id: string
          processed_at: string | null
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creator_id: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creator_id?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sales_events: {
        Row: {
          campaign_id: string
          commission_amount: number
          created_at: string | null
          creator_id: string
          customer_email: string | null
          id: string
          order_id: string | null
          product_name: string | null
          sale_amount: number
          tracking_code_id: string
        }
        Insert: {
          campaign_id: string
          commission_amount: number
          created_at?: string | null
          creator_id: string
          customer_email?: string | null
          id?: string
          order_id?: string | null
          product_name?: string | null
          sale_amount: number
          tracking_code_id: string
        }
        Update: {
          campaign_id?: string
          commission_amount?: number
          created_at?: string | null
          creator_id?: string
          customer_email?: string | null
          id?: string
          order_id?: string | null
          product_name?: string | null
          sale_amount?: number
          tracking_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_events_tracking_code_id_fkey"
            columns: ["tracking_code_id"]
            isOneToOne: false
            referencedRelation: "tracking_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_codes: {
        Row: {
          campaign_id: string
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          creator_id: string
          discount_percent: number | null
          id: string
          is_active: boolean | null
          revenue_generated: number | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string | null
          creator_id: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          revenue_generated?: number | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string | null
          creator_id?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          revenue_generated?: number | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_codes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          amount: number | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          tracking_code_id: string
          user_agent: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tracking_code_id: string
          user_agent?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tracking_code_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_tracking_code_id_fkey"
            columns: ["tracking_code_id"]
            isOneToOne: false
            referencedRelation: "tracking_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string | null
          creator_id: string
          id: string
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          is_priority: boolean
          referral_code: string
          referral_count: number
          referred_by: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          waitlist_position: number | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_priority?: boolean
          referral_code?: string
          referral_count?: number
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          waitlist_position?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_priority?: boolean
          referral_code?: string
          referral_count?: number
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          waitlist_position?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_cpv_earnings: {
        Args: { p_content_performance_id: string; p_new_view_count: number }
        Returns: number
      }
      calculate_waitlist_position: {
        Args: { waitlist_id: string }
        Returns: number
      }
      get_creator_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "agency" | "creator"
      campaign_status:
        | "draft"
        | "active"
        | "optimizing"
        | "scaling"
        | "halted"
        | "completed"
      participant_status: "pending" | "active" | "paused" | "completed"
      transaction_status: "locked" | "pending" | "released"
      transaction_type: "escrow" | "bonus" | "payout"
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
      app_role: ["agency", "creator"],
      campaign_status: [
        "draft",
        "active",
        "optimizing",
        "scaling",
        "halted",
        "completed",
      ],
      participant_status: ["pending", "active", "paused", "completed"],
      transaction_status: ["locked", "pending", "released"],
      transaction_type: ["escrow", "bonus", "payout"],
    },
  },
} as const
