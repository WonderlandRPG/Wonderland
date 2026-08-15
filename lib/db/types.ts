export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ContentStatus = "draft" | "published" | "archived";

export type UserRole = "player" | "moderator" | "guild_leader" | "admin" | "founder";

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
      v2_dungeon_queue: {
        Row: {
          id: string;
          dungeon_key: string;
          user_id: string;
          character_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          dungeon_key: string;
          user_id: string;
          character_id: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_dungeon_queue"]["Insert"]>;
        Relationships: [];
      };
      v2_dungeon_runs: {
        Row: {
          id: string;
          dungeon_key: string;
          party_character_ids: string[];
          started_by: string;
          forced_start: boolean;
          status: string;
          started_at: string;
          finished_at: string | null;
          state: Json | null;
          version: number;
        };
        Insert: {
          id?: string;
          dungeon_key: string;
          party_character_ids: string[];
          started_by: string;
          forced_start?: boolean;
          status?: string;
          started_at?: string;
          finished_at?: string | null;
          state?: Json | null;
          version?: number;
        };
        Update: Partial<Database["public"]["Tables"]["v2_dungeon_runs"]["Insert"]>;
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
      v2_pvp_history: {
        Row: {
          id: number;
          match_id: string;
          character_id: string;
          opponent_character_id: string;
          result: "victory" | "defeat";
          rank: string;
          rounds: number;
          finished_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          match_id: string;
          character_id: string;
          opponent_character_id: string;
          result: "victory" | "defeat";
          rank: string;
          rounds?: number;
          finished_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_pvp_history"]["Insert"]>;
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
      v2_missions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          objective: string;
          kingdom: string;
          rank: string;
          min_level: number;
          reward_xp: number;
          reward_gold: number;
          is_rank_trial: boolean;
          promotion_rank: string | null;
          active: boolean;
          available_after: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          objective: string;
          kingdom: string;
          rank: string;
          min_level?: number;
          reward_xp?: number;
          reward_gold?: number;
          is_rank_trial?: boolean;
          promotion_rank?: string | null;
          active?: boolean;
          available_after?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_missions"]["Insert"]>;
        Relationships: [];
      };
      v2_mission_assignments: {
        Row: {
          id: string;
          mission_id: string;
          user_id: string;
          character_id: string;
          status: string;
          accepted_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
          retry_after: string | null;
          reward_xp: number;
          reward_gold: number;
        };
        Insert: {
          id?: string;
          mission_id: string;
          user_id: string;
          character_id: string;
          status?: string;
          accepted_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          retry_after?: string | null;
          reward_xp?: number;
          reward_gold?: number;
        };
        Update: Partial<Database["public"]["Tables"]["v2_mission_assignments"]["Insert"]>;
        Relationships: [];
      };
      v2_rank_mission_requirements: {
        Row: { rank: string; required_completions: number; promotion_rank: string };
        Insert: { rank: string; required_completions: number; promotion_rank: string };
        Update: Partial<Database["public"]["Tables"]["v2_rank_mission_requirements"]["Insert"]>;
        Relationships: [];
      };
      v2_kingdom_states: {
        Row: {
          kingdom: string;
          requested_stars: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          kingdom: string;
          requested_stars?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["v2_kingdom_states"]["Insert"]>;
        Relationships: [];
      };
      v2_kingdom_leadership: {
        Row: {
          kingdom: string;
          office: "monarch" | "realm_councilor" | "war_councilor";
          character_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          kingdom: string;
          office: "monarch" | "realm_councilor" | "war_councilor";
          character_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_kingdom_leadership"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      v2_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      v2_is_mission_manager: { Args: Record<PropertyKey, never>; Returns: boolean };
      v2_character_has_active_mission: { Args: { p_character_id: string }; Returns: boolean };
      v2_get_mission_board: { Args: { p_character_id: string }; Returns: Json };
      v2_accept_mission: { Args: { p_mission_id: string; p_character_id: string }; Returns: Json };
      v2_get_managed_missions: { Args: Record<PropertyKey, never>; Returns: Json };
      v2_resolve_mission: {
        Args: { p_assignment_id: string; p_completed: boolean };
        Returns: Json;
      };
      v2_touch_player_presence: { Args: Record<PropertyKey, never>; Returns: undefined };
      v2_get_online_player_count: { Args: Record<PropertyKey, never>; Returns: number };
      v2_join_dungeon_queue: {
        Args: { p_dungeon_key: string; p_character_id: string };
        Returns: Json;
      };
      v2_leave_dungeon_queue: { Args: { p_dungeon_key: string }; Returns: undefined };
      v2_get_dungeon_queue: { Args: { p_dungeon_key: string }; Returns: Json };
      v2_get_own_active_dungeon_run: { Args: { p_dungeon_key: string }; Returns: string | null };
      v2_start_dungeon: { Args: { p_dungeon_key: string; p_force?: boolean }; Returns: Json };
      v2_get_dungeon_run: { Args: { p_run_id: string }; Returns: Json };
      v2_initialize_dungeon_run: { Args: { p_run_id: string; p_state: Json }; Returns: Json };
      v2_update_dungeon_run: {
        Args: { p_run_id: string; p_expected_version: number; p_state: Json };
        Returns: Json;
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
      v2_leave_all_queues: { Args: { p_character_id: string }; Returns: Json };
      v2_get_current_kingdom: { Args: { p_character_id: string }; Returns: Json };
      v2_buy_kingdom_star: { Args: { p_character_id: string }; Returns: Json };
      v2_admin_set_kingdom_office: {
        Args: { p_kingdom: string; p_office: string; p_character_id?: string | null };
        Returns: undefined;
      };
      v2_get_pvp_opponent: { Args: { p_match_id: string }; Returns: Json };
      v2_initialize_pvp_match: { Args: { p_match_id: string; p_state: Json }; Returns: boolean };
      v2_get_pvp_match_state: { Args: { p_match_id: string }; Returns: Json };
      v2_update_pvp_match_state: {
        Args: { p_match_id: string; p_expected_version: number; p_state: Json };
        Returns: Json;
      };
      v2_pvp_ranking: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{
          id: string;
          user_id: string;
          name: string;
          level: number;
          image_url: string | null;
          race_name: string;
          class_name: string;
          adventure_rank: string;
          matches: number;
          victories: number;
          defeats: number;
          win_rate: number;
          title_name: string | null;
        }>;
      };
      v2_my_pvp_history: {
        Args: { p_character_id: string };
        Returns: Array<{
          match_id: string;
          result: "victory" | "defeat";
          rank: string;
          rounds: number;
          finished_at: string;
          opponent_id: string;
          opponent_name: string;
          opponent_image_url: string | null;
        }>;
      };
      v2_buy_shop_item: { Args: { p_item_id: string }; Returns: undefined };
      v2_buy_shop_cart: { Args: { p_item_ids: string[] }; Returns: Json };
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
          title_name: string | null;
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
      v2_sell_inventory_item: { Args: { p_inventory_id: string }; Returns: Json };
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
      v2_admin_delete_title: { Args: { p_title_id: string }; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
