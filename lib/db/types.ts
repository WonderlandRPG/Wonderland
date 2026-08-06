export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ContentStatus = "draft" | "published" | "archived";

export interface Database {
  public: {
    Tables: {
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
          role: "player" | "moderator" | "admin" | "founder";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: "player" | "moderator" | "admin" | "founder";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["v2_user_roles"]["Insert"]>;
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
