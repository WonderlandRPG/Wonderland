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
      v2_characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          race_id: string;
          class_id: string;
          class_path_key: string | null;
          level: number;
          xp: number;
          gold: number;
          image_url: string | null;
          last_daily_claim: string | null;
          daily_streak: number;
          kingdom: string;
          adventure_rank: string;
          allocated_attributes: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          race_id: string;
          class_id: string;
          class_path_key?: string | null;
          level?: number;
          xp?: number;
          gold?: number;
          image_url?: string | null;
          last_daily_claim?: string | null;
          daily_streak?: number;
          kingdom?: string;
          adventure_rank?: string;
          allocated_attributes: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_characters"]["Insert"]>;
        Relationships: [];
      };
      v2_character_inventory: {
        Row: {
          id: string;
          character_id: string;
          item_id: string;
          quantity: number;
          equipped_slot: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          item_id: string;
          quantity?: number;
          equipped_slot?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_character_inventory"]["Insert"]>;
        Relationships: [];
      };
      v2_pvp_queue: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          rank: string;
          status: string;
          opponent_character_id: string | null;
          match_id: string | null;
          joined_at: string;
          matched_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          rank: string;
          status?: string;
          opponent_character_id?: string | null;
          match_id?: string | null;
          joined_at?: string;
          matched_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["v2_pvp_queue"]["Insert"]>;
        Relationships: [];
      };
      v2_pvp_matches: {
        Row: {
          id: string;
          player_one_user_id: string;
          player_one_character_id: string;
          player_two_user_id: string;
          player_two_character_id: string;
          rank: string;
          state: Json | null;
          version: number;
          status: string;
          winner_character_id: string | null;
          created_at: string;
          updated_at: string;
          finished_at: string | null;
        };
        Insert: {
          id: string;
          player_one_user_id: string;
          player_one_character_id: string;
          player_two_user_id: string;
          player_two_character_id: string;
          rank: string;
          state?: Json | null;
          version?: number;
          status?: string;
          winner_character_id?: string | null;
          created_at?: string;
          updated_at?: string;
          finished_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["v2_pvp_matches"]["Insert"]>;
        Relationships: [];
      };
      v2_active_characters: {
        Row: { user_id: string; character_id: string; selected_at: string };
        Insert: { user_id: string; character_id: string; selected_at?: string };
        Update: Partial<Database["public"]["Tables"]["v2_active_characters"]["Insert"]>;
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
          slot: string;
          rarity: string;
          attributes: Json;
          two_handed: boolean;
          sort_order: number;
          special_effects: Json;
          title_style: Json;
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
          slot?: string;
          rarity?: string;
          attributes?: Json;
          two_handed?: boolean;
          sort_order?: number;
          special_effects?: Json;
          title_style?: Json;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_shop_items"]["Insert"]>;
        Relationships: [];
      };
      v2_presence_rewards: {
        Row: {
          day_number: number;
          reward_type: "xp" | "wg" | "item" | "title";
          amount: number;
          item_id: string | null;
          active: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          day_number: number;
          reward_type: "xp" | "wg" | "item" | "title";
          amount?: number;
          item_id?: string | null;
          active?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_presence_rewards"]["Insert"]>;
        Relationships: [];
      };
      v2_presence_pass_config: {
        Row: {
          id: boolean;
          starts_on: string;
          ends_on: string;
          day_count: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          starts_on: string;
          ends_on: string;
          day_count?: number;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_presence_pass_config"]["Insert"]>;
        Relationships: [];
      };
      v2_events: {
        Row: {
          id: string;
          title: string;
          event_type: string;
          description: string;
          starts_at: string;
          registration_label: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          event_type?: string;
          description?: string;
          starts_at: string;
          registration_label?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_events"]["Insert"]>;
        Relationships: [];
      };
      v2_updates: {
        Row: {
          id: string;
          version: string;
          title: string;
          notes: Json;
          published_on: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version: string;
          title: string;
          notes?: Json;
          published_on?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_updates"]["Insert"]>;
        Relationships: [];
      };
      v2_inventory: {
        Row: { user_id: string; item_id: string; quantity: number; acquired_at: string };
        Insert: { user_id: string; item_id: string; quantity?: number; acquired_at?: string };
        Update: Partial<Database["public"]["Tables"]["v2_inventory"]["Insert"]>;
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
      v2_arena_sessions: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          mode: string;
          status: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          mode: string;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["v2_arena_sessions"]["Insert"]>;
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
      v2_start_arena_session: { Args: { p_character_id: string; p_mode: string }; Returns: string };
      v2_get_pve_daily_status: { Args: { p_character_id: string }; Returns: Json };
      v2_claim_arena_victory: { Args: { p_session_id: string }; Returns: Json };
      v2_join_pvp_queue: { Args: { p_character_id: string }; Returns: Json };
      v2_poll_pvp_queue: { Args: { p_queue_id: string }; Returns: Json };
      v2_cancel_pvp_queue: { Args: { p_queue_id: string }; Returns: undefined };
      v2_get_pvp_opponent: { Args: { p_match_id: string }; Returns: Json };
      v2_initialize_pvp_match: { Args: { p_match_id: string; p_state: Json }; Returns: boolean };
      v2_get_pvp_match_state: { Args: { p_match_id: string }; Returns: Json };
      v2_update_pvp_match_state: {
        Args: { p_match_id: string; p_expected_version: number; p_state: Json };
        Returns: Json;
      };
      v2_buy_shop_item: { Args: { p_item_id: string }; Returns: undefined };
      v2_select_character: { Args: { p_character_id: string }; Returns: undefined };
      v2_character_ranking: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          user_id: string;
          name: string;
          level: number;
          xp: number;
          race_name: string;
          class_name: string;
          image_url: string | null;
          kingdom: string;
          adventure_rank: string;
        }>;
      };
      v2_equip_inventory_item: {
        Args: { p_inventory_id: string; p_slot: string };
        Returns: Database["public"]["Tables"]["v2_character_inventory"]["Row"];
      };
      v2_unequip_inventory_item: {
        Args: { p_inventory_id: string };
        Returns: Database["public"]["Tables"]["v2_character_inventory"]["Row"];
      };
      v2_set_character_image: {
        Args: { p_character_id: string; p_image_url: string };
        Returns: Database["public"]["Tables"]["v2_characters"]["Row"];
      };
      v2_admin_update_character: {
        Args: {
          p_character_id: string;
          p_name: string;
          p_xp: number;
          p_gold: number;
          p_image_url: string;
          p_kingdom: string;
          p_adventure_rank: string;
          p_class_path_key: string | null;
        };
        Returns: Database["public"]["Tables"]["v2_characters"]["Row"];
      };
      v2_choose_class_path: {
        Args: { p_character_id: string; p_path_key: string };
        Returns: undefined;
      };
      v2_admin_grant_reward_command: {
        Args: {
          p_target_name: string;
          p_reward_type: string;
          p_reward_name: string;
          p_amount: number;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
