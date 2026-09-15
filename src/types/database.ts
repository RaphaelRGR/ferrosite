// Gerado por scripts/db-types-local.mjs a partir de supabase/migrations (não editar à mão).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_event: {
        Row: {
          id: number;
          project_id: string;
          mission_id: string | null;
          actor_id: string | null;
          kind: string;
          from_value: string | null;
          to_value: string | null;
          occurred_at: string;
          payload: Json | null;
        };
        Insert: {
          project_id: string;
          mission_id?: string | null;
          actor_id?: string | null;
          kind: string;
          from_value?: string | null;
          to_value?: string | null;
          occurred_at?: string;
          payload?: Json | null;
        };
        Update: {
          project_id?: string;
          mission_id?: string | null;
          actor_id?: string | null;
          kind?: string;
          from_value?: string | null;
          to_value?: string | null;
          occurred_at?: string;
          payload?: Json | null;
        };
        Relationships: [];
      };
      audit_event: {
        Row: {
          id: number;
          occurred_at: string;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          result: string;
          request_id: string | null;
          origin: string | null;
          diff: Json | null;
        };
        Insert: {
          occurred_at?: string;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          result?: string;
          request_id?: string | null;
          origin?: string | null;
          diff?: Json | null;
        };
        Update: {
          occurred_at?: string;
          actor_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          result?: string;
          request_id?: string | null;
          origin?: string | null;
          diff?: Json | null;
        };
        Relationships: [];
      };
      mission: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          status: Database["public"]["Enums"]["mission_status"];
          priority: Database["public"]["Enums"]["mission_priority"];
          due_at: string | null;
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
          version: number;
          deliverables: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          status?: Database["public"]["Enums"]["mission_status"];
          priority?: Database["public"]["Enums"]["mission_priority"];
          due_at?: string | null;
          created_by: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deliverables?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string;
          status?: Database["public"]["Enums"]["mission_status"];
          priority?: Database["public"]["Enums"]["mission_priority"];
          due_at?: string | null;
          created_by?: string;
          updated_by?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
          deliverables?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      mission_assignee: {
        Row: { mission_id: string; profile_id: string; assigned_at: string };
        Insert: {
          mission_id: string;
          profile_id: string;
          assigned_at?: string;
        };
        Update: {
          mission_id?: string;
          profile_id?: string;
          assigned_at?: string;
        };
        Relationships: [];
      };
      mission_checklist_item: {
        Row: {
          id: string;
          mission_id: string;
          label: string;
          done: boolean;
          position: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          label: string;
          done?: boolean;
          position?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          label?: string;
          done?: boolean;
          position?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mission_comment: {
        Row: {
          id: string;
          mission_id: string;
          author_id: string;
          body: string;
          created_at: string;
          edited_at: string | null;
        };
        Insert: {
          id?: string;
          mission_id: string;
          author_id: string;
          body: string;
          created_at?: string;
          edited_at?: string | null;
        };
        Update: {
          id?: string;
          mission_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
          edited_at?: string | null;
        };
        Relationships: [];
      };
      profile: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          global_role: Database["public"]["Enums"]["global_role"];
          status: Database["public"]["Enums"]["account_status"];
          created_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          global_role?: Database["public"]["Enums"]["global_role"];
          status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          global_role?: Database["public"]["Enums"]["global_role"];
          status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      project: {
        Row: {
          id: string;
          slug: string;
          name: string;
          summary: string;
          status: Database["public"]["Enums"]["project_status"];
          classification: Database["public"]["Enums"]["classification"];
          created_by: string;
          updated_by: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          version: number;
          name_en: string;
          summary_en: string;
          category: string;
          starts_on: string | null;
          ends_on: string | null;
          modules: string[];
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          summary?: string;
          status?: Database["public"]["Enums"]["project_status"];
          classification?: Database["public"]["Enums"]["classification"];
          created_by: string;
          updated_by: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          name_en?: string;
          summary_en?: string;
          category?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          modules?: string[];
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          summary?: string;
          status?: Database["public"]["Enums"]["project_status"];
          classification?: Database["public"]["Enums"]["classification"];
          created_by?: string;
          updated_by?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          name_en?: string;
          summary_en?: string;
          category?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          modules?: string[];
        };
        Relationships: [];
      };
      project_membership: {
        Row: {
          project_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["project_role"];
          status: Database["public"]["Enums"]["membership_status"];
          expires_at: string | null;
          granted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          profile_id: string;
          role?: Database["public"]["Enums"]["project_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          expires_at?: string | null;
          granted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          profile_id?: string;
          role?: Database["public"]["Enums"]["project_role"];
          status?: Database["public"]["Enums"]["membership_status"];
          expires_at?: string | null;
          granted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preference: {
        Row: {
          profile_id: string;
          theme: Database["public"]["Enums"]["theme_preference"];
          locale: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          theme?: Database["public"]["Enums"]["theme_preference"];
          locale?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          theme?: Database["public"]["Enums"]["theme_preference"];
          locale?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_manage_mission: {
        Args: { p_mission: string };
        Returns: boolean;
      };
      current_profile_status: {
        Args: {};
        Returns: Database["public"]["Enums"]["account_status"];
      };
      find_profile_by_email: {
        Args: { p_email: string };
        Returns: {
          id: string;
          full_name: string;
          email: string;
          status: Database["public"]["Enums"]["account_status"];
        }[];
      };
      has_global_role: {
        Args: { roles: Database["public"]["Enums"]["global_role"][] };
        Returns: boolean;
      };
      is_active_user: {
        Args: {};
        Returns: boolean;
      };
      is_member_of: {
        Args: { p_project: string; p_profile: string };
        Returns: boolean;
      };
      is_project_leader: {
        Args: { p_project: string };
        Returns: boolean;
      };
      is_project_member: {
        Args: { p_project: string };
        Returns: boolean;
      };
      is_project_overseer: {
        Args: {};
        Returns: boolean;
      };
      log_audit: {
        Args: {
          p_action: string;
          p_target_type: string;
          p_target_id: string;
          p_result?: string;
          p_diff?: Json;
        };
        Returns: undefined;
      };
      mission_project: {
        Args: { p_mission: string };
        Returns: string;
      };
      project_role_of: {
        Args: { p_project: string };
        Returns: Database["public"]["Enums"]["project_role"];
      };
      shares_project_with: {
        Args: { p_other: string };
        Returns: boolean;
      };
    };
    Enums: {
      account_status: "pending" | "active" | "disabled";
      classification: "public" | "internal" | "restricted" | "administrative";
      global_role:
        "admin" | "coordination" | "advisor" | "member" | "external" | "viewer";
      membership_status: "active" | "removed";
      mission_priority: "low" | "medium" | "high";
      mission_status:
        | "planned"
        | "in_progress"
        | "in_validation"
        | "done"
        | "paused"
        | "cancelled";
      project_role: "leader" | "member" | "viewer" | "external";
      project_status:
        | "draft"
        | "planned"
        | "active"
        | "paused"
        | "completed"
        | "archived"
        | "cancelled";
      theme_preference: "light" | "dark" | "system";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
