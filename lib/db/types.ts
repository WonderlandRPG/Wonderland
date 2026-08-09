export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ContentStatus = "draft" | "published" | "archived";

export type UserRole = "player" | "moderator" | "admin" | "founder";

export interface Database {
  public: {
    Tables: {
      v2_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_profiles"]["Insert"]>;
        Relationships: [];
      };
      v2_content: {
        Row: {
          id: string;
          content_type: string;
          slug: string;
          name: string;
          status: ContentStatus;
          payload: Json;
          revision: number;
          created_by: string | null;
          updated_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_type: string;
          slug: string;
          name: string;
          status?: ContentStatus;
          payload?: Json;
          revision?: number;
          created_by?: string | null;
          updated_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_content"]["Insert"]>;
        Relationships: [];
      };
      v2_content_revisions: {
        Row: {
          id: number;
          content_id: string;
          revision: number;
          snapshot: Json;
          edited_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          content_id: string;
          revision: number;
          snapshot: Json;
          edited_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_content_revisions"]["Insert"]>;
        Relationships: [];
      };
      v2_game_settings: {
        Row: {
          key: string;
          category: string;
          label: string;
          description: string;
          value: Json;
          status: ContentStatus;
          revision: number;
          updated_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          category: string;
          label: string;
          description?: string;
          value?: Json;
          status?: ContentStatus;
          revision?: number;
          updated_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_game_settings"]["Insert"]>;
        Relationships: [];
      };
      v2_user_roles: {
        Row: {
          user_id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_user_roles"]["Insert"]>;
        Relationships: [];
      };
      v2_player_progress: {
        Row: {
          user_id: string;
          level: number;
          experience: number;
          coins: number;
          last_seen_at: string;
          last_daily_claim: string | null;
          daily_streak: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          level?: number;
          experience?: number;
          coins?: number;
          last_seen_at?: string;
          last_daily_claim?: string | null;
          daily_streak?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_player_progress"]["Insert"]>;
        Relationships: [];
      };
      v2_shop_items: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          category: string;
          price: number;
          image_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string;
          category?: string;
          price: number;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_shop_items"]["Insert"]>;
        Relationships: [];
      };
      v2_inventory: {
        Row: { user_id: string; item_id: string; quantity: number; acquired_at: string };
        Insert: { user_id: string; item_id: string; quantity?: number; acquired_at?: string };
        Update: Partial<Database["public"]["Tables"]["v2_inventory"]["Insert"]>;
        Relationships: [];
      };
      v2_player_achievements: {
        Row: { user_id: string; achievement_slug: string; unlocked_at: string };
        Insert: { user_id: string; achievement_slug: string; unlocked_at?: string };
        Update: Partial<Database["public"]["Tables"]["v2_player_achievements"]["Insert"]>;
        Relationships: [];
      };
      v2_admin_history: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_admin_history"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      v2_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      v2_publish_content: {
        Args: { p_content_id: string };
        Returns: Database["public"]["Tables"]["v2_content"]["Row"];
      };
      v2_publish_setting: {
        Args: { p_setting_key: string };
        Returns: Database["public"]["Tables"]["v2_game_settings"]["Row"];
      };
      v2_set_player_role: { Args: { p_user_id: string; p_role: string }; Returns: undefined };
      v2_claim_daily_reward: { Args: Record<PropertyKey, never>; Returns: Json };
      v2_buy_shop_item: { Args: { p_item_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
