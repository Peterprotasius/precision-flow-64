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
      achievements: {
        Row: {
          badge_description: string | null
          badge_key: string
          badge_name: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_key: string
          badge_name: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_key?: string
          badge_name?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_connections: {
        Row: {
          account_number: string | null
          broker_name: string
          broker_type: string
          created_at: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          sync_status: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          broker_name: string
          broker_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          sync_status?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          broker_name?: string
          broker_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          sync_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          importance: string
          source_url: string | null
          title: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          importance?: string
          source_url?: string | null
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          importance?: string
          source_url?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_pro: boolean
          pro_expires_at: string | null
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_pro?: boolean
          pro_expires_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_pro?: boolean
          pro_expires_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prop_accounts: {
        Row: {
          account_label: string
          account_size: number
          created_at: string
          current_balance: number
          current_pnl: number
          daily_loss_limit_pct: number
          daily_pnl: number
          end_date: string | null
          firm_name: string
          id: string
          phase: string
          profit_target_pct: number
          start_date: string
          status: string
          total_drawdown_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label?: string
          account_size?: number
          created_at?: string
          current_balance?: number
          current_pnl?: number
          daily_loss_limit_pct?: number
          daily_pnl?: number
          end_date?: string | null
          firm_name: string
          id?: string
          phase?: string
          profit_target_pct?: number
          start_date?: string
          status?: string
          total_drawdown_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_label?: string
          account_size?: number
          created_at?: string
          current_balance?: number
          current_pnl?: number
          daily_loss_limit_pct?: number
          daily_pnl?: number
          end_date?: string | null
          firm_name?: string
          id?: string
          phase?: string
          profit_target_pct?: number
          start_date?: string
          status?: string
          total_drawdown_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      psychology_checkins: {
        Row: {
          checkin_type: string
          confidence_rating: number
          created_at: string
          emotional_state: string
          energy_level: number
          htf_bias: string | null
          id: string
          market_conditions: string | null
          notes: string | null
          sleep_quality: number
          user_id: string
        }
        Insert: {
          checkin_type?: string
          confidence_rating?: number
          created_at?: string
          emotional_state?: string
          energy_level?: number
          htf_bias?: string | null
          id?: string
          market_conditions?: string | null
          notes?: string | null
          sleep_quality?: number
          user_id: string
        }
        Update: {
          checkin_type?: string
          confidence_rating?: number
          created_at?: string
          emotional_state?: string
          energy_level?: number
          htf_bias?: string | null
          id?: string
          market_conditions?: string | null
          notes?: string | null
          sleep_quality?: number
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_screenshots: {
        Row: {
          annotated_url: string | null
          created_at: string
          id: string
          image_type: string
          image_url: string
          trade_id: string
          user_id: string
        }
        Insert: {
          annotated_url?: string | null
          created_at?: string
          id?: string
          image_type?: string
          image_url: string
          trade_id: string
          user_id: string
        }
        Update: {
          annotated_url?: string | null
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_tags: {
        Row: {
          created_at: string
          custom_strategy_name: string | null
          execution_quality: string | null
          id: string
          session: string | null
          setup_types: string[] | null
          strategy: string | null
          timeframe_bias: string[] | null
          trade_id: string
          trade_outcome_tag: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_strategy_name?: string | null
          execution_quality?: string | null
          id?: string
          session?: string | null
          setup_types?: string[] | null
          strategy?: string | null
          timeframe_bias?: string[] | null
          trade_id: string
          trade_outcome_tag?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          custom_strategy_name?: string | null
          execution_quality?: string | null
          id?: string
          session?: string | null
          setup_types?: string[] | null
          strategy?: string | null
          timeframe_bias?: string[] | null
          trade_id?: string
          trade_outcome_tag?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          bos_present: boolean
          confidence_level: number
          created_at: string
          direction: string
          emotion_after: string | null
          emotion_before: string | null
          entry_price: number
          htf_bias: string
          id: string
          liquidity_sweep: boolean
          lot_size: number
          notes: string | null
          order_block: boolean
          pair: string
          profit_loss_amount: number
          result: string
          risk_percent: number
          rr_ratio: number
          screenshot_url: string | null
          stop_loss: number
          take_profit: number
          timeframe: string
          user_id: string
        }
        Insert: {
          bos_present?: boolean
          confidence_level?: number
          created_at?: string
          direction: string
          emotion_after?: string | null
          emotion_before?: string | null
          entry_price: number
          htf_bias?: string
          id?: string
          liquidity_sweep?: boolean
          lot_size?: number
          notes?: string | null
          order_block?: boolean
          pair: string
          profit_loss_amount?: number
          result?: string
          risk_percent?: number
          rr_ratio?: number
          screenshot_url?: string | null
          stop_loss: number
          take_profit: number
          timeframe?: string
          user_id: string
        }
        Update: {
          bos_present?: boolean
          confidence_level?: number
          created_at?: string
          direction?: string
          emotion_after?: string | null
          emotion_before?: string | null
          entry_price?: number
          htf_bias?: string
          id?: string
          liquidity_sweep?: boolean
          lot_size?: number
          notes?: string | null
          order_block?: boolean
          pair?: string
          profit_loss_amount?: number
          result?: string
          risk_percent?: number
          rr_ratio?: number
          screenshot_url?: string | null
          stop_loss?: number
          take_profit?: number
          timeframe?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          current_level: string
          current_streak: number
          id: string
          last_trade_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: string
          current_streak?: number
          id?: string
          last_trade_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: string
          current_streak?: number
          id?: string
          last_trade_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
