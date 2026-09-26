// Gerado por scripts/db-types-local.mjs a partir de supabase/migrations (não editar à mão).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity_event: {
        Row: { id: number; project_id: string; mission_id: string | null; actor_id: string | null; kind: string; from_value: string | null; to_value: string | null; occurred_at: string; payload: Json | null };
        Insert: { project_id: string; mission_id?: string | null; actor_id?: string | null; kind: string; from_value?: string | null; to_value?: string | null; occurred_at?: string; payload?: Json | null };
        Update: { project_id?: string; mission_id?: string | null; actor_id?: string | null; kind?: string; from_value?: string | null; to_value?: string | null; occurred_at?: string; payload?: Json | null };
        Relationships: [];
      };
      approval_request: {
        Row: { id: string; item_id: string; revision_id: string; requested_by: string; reviewer_id: string | null; decision: Database["public"]["Enums"]["approval_decision"]; comment: string; created_at: string; decided_at: string | null };
        Insert: { id?: string; item_id: string; revision_id: string; requested_by: string; reviewer_id?: string | null; decision?: Database["public"]["Enums"]["approval_decision"]; comment?: string; created_at?: string; decided_at?: string | null };
        Update: { id?: string; item_id?: string; revision_id?: string; requested_by?: string; reviewer_id?: string | null; decision?: Database["public"]["Enums"]["approval_decision"]; comment?: string; created_at?: string; decided_at?: string | null };
        Relationships: [];
      };
      audit_event: {
        Row: { id: number; occurred_at: string; actor_id: string | null; action: string; target_type: string; target_id: string | null; result: string; request_id: string | null; origin: string | null; diff: Json | null };
        Insert: { occurred_at?: string; actor_id?: string | null; action: string; target_type: string; target_id?: string | null; result?: string; request_id?: string | null; origin?: string | null; diff?: Json | null };
        Update: { occurred_at?: string; actor_id?: string | null; action?: string; target_type?: string; target_id?: string | null; result?: string; request_id?: string | null; origin?: string | null; diff?: Json | null };
        Relationships: [];
      };
      contact: {
        Row: { id: string; organization_id: string; full_name: string; role_title: string; email: string; phone: string; consent_note: string; created_by: string; created_at: string; updated_at: string; version: number };
        Insert: { id?: string; organization_id: string; full_name: string; role_title?: string; email?: string; phone?: string; consent_note?: string; created_by: string; created_at?: string; updated_at?: string; version?: number };
        Update: { id?: string; organization_id?: string; full_name?: string; role_title?: string; email?: string; phone?: string; consent_note?: string; created_by?: string; created_at?: string; updated_at?: string; version?: number };
        Relationships: [];
      };
      content_file: {
        Row: { item_id: string; file_id: string; kind: Database["public"]["Enums"]["file_link_kind"]; position: number; caption: string; linked_by: string; linked_at: string };
        Insert: { item_id: string; file_id: string; kind?: Database["public"]["Enums"]["file_link_kind"]; position?: number; caption?: string; linked_by: string; linked_at?: string };
        Update: { item_id?: string; file_id?: string; kind?: Database["public"]["Enums"]["file_link_kind"]; position?: number; caption?: string; linked_by?: string; linked_at?: string };
        Relationships: [];
      };
      content_item: {
        Row: { id: string; type: Database["public"]["Enums"]["content_type"]; locale: string; slug: string; title: string; summary: string; body_md: string; event_at: string | null; event_place: string; project_id: string | null; organization_id: string | null; cover_file_id: string | null; source_note: string; consent_confirmed: boolean; status: Database["public"]["Enums"]["content_status"]; scheduled_for: string | null; preview_token: string; author_id: string; updated_by: string; created_at: string; updated_at: string; version: number };
        Insert: { id?: string; type: Database["public"]["Enums"]["content_type"]; locale: string; slug: string; title: string; summary?: string; body_md?: string; event_at?: string | null; event_place?: string; project_id?: string | null; organization_id?: string | null; cover_file_id?: string | null; source_note?: string; consent_confirmed?: boolean; status?: Database["public"]["Enums"]["content_status"]; scheduled_for?: string | null; preview_token?: string; author_id: string; updated_by: string; created_at?: string; updated_at?: string; version?: number };
        Update: { id?: string; type?: Database["public"]["Enums"]["content_type"]; locale?: string; slug?: string; title?: string; summary?: string; body_md?: string; event_at?: string | null; event_place?: string; project_id?: string | null; organization_id?: string | null; cover_file_id?: string | null; source_note?: string; consent_confirmed?: boolean; status?: Database["public"]["Enums"]["content_status"]; scheduled_for?: string | null; preview_token?: string; author_id?: string; updated_by?: string; created_at?: string; updated_at?: string; version?: number };
        Relationships: [];
      };
      content_revision: {
        Row: { id: string; item_id: string; revision_no: number; snapshot: Json; note: string; author_id: string; created_at: string };
        Insert: { id?: string; item_id: string; revision_no: number; snapshot: Json; note?: string; author_id: string; created_at?: string };
        Update: { id?: string; item_id?: string; revision_no?: number; snapshot?: Json; note?: string; author_id?: string; created_at?: string };
        Relationships: [];
      };
      crm_event: {
        Row: { id: number; organization_id: string | null; challenge_id: string | null; actor_id: string | null; kind: string; from_value: string | null; to_value: string | null; occurred_at: string; payload: Json | null };
        Insert: { organization_id?: string | null; challenge_id?: string | null; actor_id?: string | null; kind: string; from_value?: string | null; to_value?: string | null; occurred_at?: string; payload?: Json | null };
        Update: { organization_id?: string | null; challenge_id?: string | null; actor_id?: string | null; kind?: string; from_value?: string | null; to_value?: string | null; occurred_at?: string; payload?: Json | null };
        Relationships: [];
      };
      drive_folder: {
        Row: { path: string; drive_id: string; created_by: string | null; created_at: string };
        Insert: { path: string; drive_id: string; created_by?: string | null; created_at?: string };
        Update: { path?: string; drive_id?: string; created_by?: string | null; created_at?: string };
        Relationships: [];
      };
      drive_integration: {
        Row: { singleton: boolean; status: Database["public"]["Enums"]["drive_connection_status"]; provider_account_email: string; provider_account_name: string; scope: string; access_token_enc: string; refresh_token_enc: string; access_token_expires_at: string | null; root_folder_id: string; root_folder_name: string; connected_by: string | null; connected_at: string | null; last_checked_at: string | null; last_check_result: Json; last_error: string; updated_at: string };
        Insert: { singleton?: boolean; status?: Database["public"]["Enums"]["drive_connection_status"]; provider_account_email?: string; provider_account_name?: string; scope?: string; access_token_enc?: string; refresh_token_enc?: string; access_token_expires_at?: string | null; root_folder_id?: string; root_folder_name?: string; connected_by?: string | null; connected_at?: string | null; last_checked_at?: string | null; last_check_result?: Json; last_error?: string; updated_at?: string };
        Update: { singleton?: boolean; status?: Database["public"]["Enums"]["drive_connection_status"]; provider_account_email?: string; provider_account_name?: string; scope?: string; access_token_enc?: string; refresh_token_enc?: string; access_token_expires_at?: string | null; root_folder_id?: string; root_folder_name?: string; connected_by?: string | null; connected_at?: string | null; last_checked_at?: string | null; last_check_result?: Json; last_error?: string; updated_at?: string };
        Relationships: [];
      };
      file_asset: {
        Row: { id: string; provider: Database["public"]["Enums"]["file_provider"]; external_id: string; name: string; mime_type: string; size_bytes: number | null; content_hash: string | null; classification: Database["public"]["Enums"]["classification"]; status: Database["public"]["Enums"]["file_status"]; credit: string; alt_text: string; alt_text_en: string; consent: Database["public"]["Enums"]["consent_status"]; consent_note: string; owner_id: string; created_by: string; updated_by: string; verified_at: string | null; archived_at: string | null; created_at: string; updated_at: string; version: number; verified_by: string | null; storage_path: string; drive_folder_id: string };
        Insert: { id?: string; provider?: Database["public"]["Enums"]["file_provider"]; external_id: string; name: string; mime_type?: string; size_bytes?: number | null; content_hash?: string | null; classification?: Database["public"]["Enums"]["classification"]; status?: Database["public"]["Enums"]["file_status"]; credit?: string; alt_text?: string; alt_text_en?: string; consent?: Database["public"]["Enums"]["consent_status"]; consent_note?: string; owner_id: string; created_by: string; updated_by: string; verified_at?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string; version?: number; verified_by?: string | null; storage_path?: string; drive_folder_id?: string };
        Update: { id?: string; provider?: Database["public"]["Enums"]["file_provider"]; external_id?: string; name?: string; mime_type?: string; size_bytes?: number | null; content_hash?: string | null; classification?: Database["public"]["Enums"]["classification"]; status?: Database["public"]["Enums"]["file_status"]; credit?: string; alt_text?: string; alt_text_en?: string; consent?: Database["public"]["Enums"]["consent_status"]; consent_note?: string; owner_id?: string; created_by?: string; updated_by?: string; verified_at?: string | null; archived_at?: string | null; created_at?: string; updated_at?: string; version?: number; verified_by?: string | null; storage_path?: string; drive_folder_id?: string };
        Relationships: [];
      };
      file_type_allowlist: {
        Row: { mime_type: string; max_bytes: number; gallery: boolean; uploadable: boolean; extension: string };
        Insert: { mime_type: string; max_bytes: number; gallery?: boolean; uploadable?: boolean; extension?: string };
        Update: { mime_type?: string; max_bytes?: number; gallery?: boolean; uploadable?: boolean; extension?: string };
        Relationships: [];
      };
      mail_outbox: {
        Row: { id: string; template: string; locale: string; recipient_email: string; recipient_profile_id: string | null; target_type: string; target_id: string; payload: Json; status: Database["public"]["Enums"]["mail_status"]; attempts: number; last_error: string; provider_message_id: string; created_at: string; claimed_at: string | null; sent_at: string | null };
        Insert: { id?: string; template: string; locale?: string; recipient_email: string; recipient_profile_id?: string | null; target_type?: string; target_id?: string; payload?: Json; status?: Database["public"]["Enums"]["mail_status"]; attempts?: number; last_error?: string; provider_message_id?: string; created_at?: string; claimed_at?: string | null; sent_at?: string | null };
        Update: { id?: string; template?: string; locale?: string; recipient_email?: string; recipient_profile_id?: string | null; target_type?: string; target_id?: string; payload?: Json; status?: Database["public"]["Enums"]["mail_status"]; attempts?: number; last_error?: string; provider_message_id?: string; created_at?: string; claimed_at?: string | null; sent_at?: string | null };
        Relationships: [];
      };
      mission: {
        Row: { id: string; project_id: string; title: string; description: string; status: Database["public"]["Enums"]["mission_status"]; priority: Database["public"]["Enums"]["mission_priority"]; due_at: string | null; created_by: string; updated_by: string; created_at: string; updated_at: string; version: number; deliverables: string; completed_at: string | null };
        Insert: { id?: string; project_id: string; title: string; description?: string; status?: Database["public"]["Enums"]["mission_status"]; priority?: Database["public"]["Enums"]["mission_priority"]; due_at?: string | null; created_by: string; updated_by: string; created_at?: string; updated_at?: string; version?: number; deliverables?: string; completed_at?: string | null };
        Update: { id?: string; project_id?: string; title?: string; description?: string; status?: Database["public"]["Enums"]["mission_status"]; priority?: Database["public"]["Enums"]["mission_priority"]; due_at?: string | null; created_by?: string; updated_by?: string; created_at?: string; updated_at?: string; version?: number; deliverables?: string; completed_at?: string | null };
        Relationships: [];
      };
      mission_assignee: {
        Row: { mission_id: string; profile_id: string; assigned_at: string };
        Insert: { mission_id: string; profile_id: string; assigned_at?: string };
        Update: { mission_id?: string; profile_id?: string; assigned_at?: string };
        Relationships: [];
      };
      mission_checklist_item: {
        Row: { id: string; mission_id: string; label: string; done: boolean; position: number; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; mission_id: string; label: string; done?: boolean; position?: number; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: string; mission_id?: string; label?: string; done?: boolean; position?: number; created_by?: string; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      mission_comment: {
        Row: { id: string; mission_id: string; author_id: string; body: string; created_at: string; edited_at: string | null };
        Insert: { id?: string; mission_id: string; author_id: string; body: string; created_at?: string; edited_at?: string | null };
        Update: { id?: string; mission_id?: string; author_id?: string; body?: string; created_at?: string; edited_at?: string | null };
        Relationships: [];
      };
      mission_file: {
        Row: { mission_id: string; file_id: string; kind: Database["public"]["Enums"]["file_link_kind"]; linked_by: string; linked_at: string };
        Insert: { mission_id: string; file_id: string; kind?: Database["public"]["Enums"]["file_link_kind"]; linked_by: string; linked_at?: string };
        Update: { mission_id?: string; file_id?: string; kind?: Database["public"]["Enums"]["file_link_kind"]; linked_by?: string; linked_at?: string };
        Relationships: [];
      };
      organization: {
        Row: { id: string; name: string; kind: Database["public"]["Enums"]["organization_kind"]; sector: string; city: string; state: string; country: string; website: string; public_partner: boolean; brand_authorized_at: string | null; stage: Database["public"]["Enums"]["partnership_stage"]; stage_reason: string; owner_id: string | null; notes: string; created_by: string; updated_by: string; archived_at: string | null; created_at: string; updated_at: string; version: number };
        Insert: { id?: string; name: string; kind?: Database["public"]["Enums"]["organization_kind"]; sector?: string; city?: string; state?: string; country?: string; website?: string; public_partner?: boolean; brand_authorized_at?: string | null; stage?: Database["public"]["Enums"]["partnership_stage"]; stage_reason?: string; owner_id?: string | null; notes?: string; created_by: string; updated_by: string; archived_at?: string | null; created_at?: string; updated_at?: string; version?: number };
        Update: { id?: string; name?: string; kind?: Database["public"]["Enums"]["organization_kind"]; sector?: string; city?: string; state?: string; country?: string; website?: string; public_partner?: boolean; brand_authorized_at?: string | null; stage?: Database["public"]["Enums"]["partnership_stage"]; stage_reason?: string; owner_id?: string | null; notes?: string; created_by?: string; updated_by?: string; archived_at?: string | null; created_at?: string; updated_at?: string; version?: number };
        Relationships: [];
      };
      profile: {
        Row: { id: string; email: string; full_name: string; global_role: Database["public"]["Enums"]["global_role"]; status: Database["public"]["Enums"]["account_status"]; created_at: string; updated_at: string; version: number };
        Insert: { id: string; email: string; full_name?: string; global_role?: Database["public"]["Enums"]["global_role"]; status?: Database["public"]["Enums"]["account_status"]; created_at?: string; updated_at?: string; version?: number };
        Update: { id?: string; email?: string; full_name?: string; global_role?: Database["public"]["Enums"]["global_role"]; status?: Database["public"]["Enums"]["account_status"]; created_at?: string; updated_at?: string; version?: number };
        Relationships: [];
      };
      project: {
        Row: { id: string; slug: string; name: string; summary: string; status: Database["public"]["Enums"]["project_status"]; classification: Database["public"]["Enums"]["classification"]; created_by: string; updated_by: string; archived_at: string | null; created_at: string; updated_at: string; version: number; name_en: string; summary_en: string; category: string; starts_on: string | null; ends_on: string | null; modules: string[]; description_md: string; description_md_en: string };
        Insert: { id?: string; slug: string; name: string; summary?: string; status?: Database["public"]["Enums"]["project_status"]; classification?: Database["public"]["Enums"]["classification"]; created_by: string; updated_by: string; archived_at?: string | null; created_at?: string; updated_at?: string; version?: number; name_en?: string; summary_en?: string; category?: string; starts_on?: string | null; ends_on?: string | null; modules?: string[]; description_md?: string; description_md_en?: string };
        Update: { id?: string; slug?: string; name?: string; summary?: string; status?: Database["public"]["Enums"]["project_status"]; classification?: Database["public"]["Enums"]["classification"]; created_by?: string; updated_by?: string; archived_at?: string | null; created_at?: string; updated_at?: string; version?: number; name_en?: string; summary_en?: string; category?: string; starts_on?: string | null; ends_on?: string | null; modules?: string[]; description_md?: string; description_md_en?: string };
        Relationships: [];
      };
      project_file: {
        Row: { project_id: string; file_id: string; kind: Database["public"]["Enums"]["file_link_kind"]; position: number; linked_by: string; linked_at: string };
        Insert: { project_id: string; file_id: string; kind?: Database["public"]["Enums"]["file_link_kind"]; position?: number; linked_by: string; linked_at?: string };
        Update: { project_id?: string; file_id?: string; kind?: Database["public"]["Enums"]["file_link_kind"]; position?: number; linked_by?: string; linked_at?: string };
        Relationships: [];
      };
      project_membership: {
        Row: { project_id: string; profile_id: string; role: Database["public"]["Enums"]["project_role"]; status: Database["public"]["Enums"]["membership_status"]; expires_at: string | null; granted_by: string | null; created_at: string; updated_at: string };
        Insert: { project_id: string; profile_id: string; role?: Database["public"]["Enums"]["project_role"]; status?: Database["public"]["Enums"]["membership_status"]; expires_at?: string | null; granted_by?: string | null; created_at?: string; updated_at?: string };
        Update: { project_id?: string; profile_id?: string; role?: Database["public"]["Enums"]["project_role"]; status?: Database["public"]["Enums"]["membership_status"]; expires_at?: string | null; granted_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      public_submission_rate: {
        Row: { bucket: string; window_start: string; count: number };
        Insert: { bucket: string; window_start?: string; count?: number };
        Update: { bucket?: string; window_start?: string; count?: number };
        Relationships: [];
      };
      publication: {
        Row: { id: string; item_id: string; revision_id: string; type: Database["public"]["Enums"]["content_type"]; locale: string; slug: string; title: string; summary: string; body_md: string; event_at: string | null; event_place: string; cover_alt: string; cover_credit: string; published_at: string; published_by: string; unpublished_at: string | null; unpublished_by: string | null; cover_file_id: string | null; gallery_file_ids: string[] };
        Insert: { id?: string; item_id: string; revision_id: string; type: Database["public"]["Enums"]["content_type"]; locale: string; slug: string; title: string; summary: string; body_md: string; event_at?: string | null; event_place?: string; cover_alt?: string; cover_credit?: string; published_at?: string; published_by: string; unpublished_at?: string | null; unpublished_by?: string | null; cover_file_id?: string | null; gallery_file_ids?: string[] };
        Update: { id?: string; item_id?: string; revision_id?: string; type?: Database["public"]["Enums"]["content_type"]; locale?: string; slug?: string; title?: string; summary?: string; body_md?: string; event_at?: string | null; event_place?: string; cover_alt?: string; cover_credit?: string; published_at?: string; published_by?: string; unpublished_at?: string | null; unpublished_by?: string | null; cover_file_id?: string | null; gallery_file_ids?: string[] };
        Relationships: [];
      };
      relationship_activity: {
        Row: { id: string; organization_id: string; contact_id: string | null; kind: Database["public"]["Enums"]["relationship_activity_kind"]; occurred_at: string; summary: string; next_action: string; next_action_at: string | null; created_by: string; created_at: string };
        Insert: { id?: string; organization_id: string; contact_id?: string | null; kind?: Database["public"]["Enums"]["relationship_activity_kind"]; occurred_at?: string; summary: string; next_action?: string; next_action_at?: string | null; created_by: string; created_at?: string };
        Update: { id?: string; organization_id?: string; contact_id?: string | null; kind?: Database["public"]["Enums"]["relationship_activity_kind"]; occurred_at?: string; summary?: string; next_action?: string; next_action_at?: string | null; created_by?: string; created_at?: string };
        Relationships: [];
      };
      report_snapshot: {
        Row: { id: string; kind: string; period_start: string; period_end: string; formulas_version: number; data: Json; generated_by: string; generated_at: string };
        Insert: { id?: string; kind?: string; period_start: string; period_end: string; formulas_version: number; data: Json; generated_by: string; generated_at?: string };
        Update: { id?: string; kind?: string; period_start?: string; period_end?: string; formulas_version?: number; data?: Json; generated_by?: string; generated_at?: string };
        Relationships: [];
      };
      research_challenge: {
        Row: { id: string; protocol: string; organization_name: string; organization_id: string | null; contact_name: string; contact_email: string; contact_phone: string; title: string; description: string; capability_ids: string[]; confidentiality_requested: boolean; consent_at: string; locale: string; status: Database["public"]["Enums"]["challenge_status"]; assigned_to: string | null; triage_notes: string; submitter_hash: string; created_at: string; updated_at: string; updated_by: string | null; version: number };
        Insert: { id?: string; protocol: string; organization_name: string; organization_id?: string | null; contact_name: string; contact_email: string; contact_phone?: string; title: string; description: string; capability_ids?: string[]; confidentiality_requested?: boolean; consent_at: string; locale?: string; status?: Database["public"]["Enums"]["challenge_status"]; assigned_to?: string | null; triage_notes?: string; submitter_hash?: string; created_at?: string; updated_at?: string; updated_by?: string | null; version?: number };
        Update: { id?: string; protocol?: string; organization_name?: string; organization_id?: string | null; contact_name?: string; contact_email?: string; contact_phone?: string; title?: string; description?: string; capability_ids?: string[]; confidentiality_requested?: boolean; consent_at?: string; locale?: string; status?: Database["public"]["Enums"]["challenge_status"]; assigned_to?: string | null; triage_notes?: string; submitter_hash?: string; created_at?: string; updated_at?: string; updated_by?: string | null; version?: number };
        Relationships: [];
      };
      site_image: {
        Row: { key: string; file_id: string; updated_by: string | null; updated_at: string };
        Insert: { key: string; file_id: string; updated_by?: string | null; updated_at?: string };
        Update: { key?: string; file_id?: string; updated_by?: string | null; updated_at?: string };
        Relationships: [];
      };
      user_preference: {
        Row: { profile_id: string; theme: Database["public"]["Enums"]["theme_preference"]; locale: string; updated_at: string };
        Insert: { profile_id: string; theme?: Database["public"]["Enums"]["theme_preference"]; locale?: string; updated_at?: string };
        Update: { profile_id?: string; theme?: Database["public"]["Enums"]["theme_preference"]; locale?: string; updated_at?: string };
        Relationships: [];
      };
      work_item: {
        Row: { id: string; kind: Database["public"]["Enums"]["work_item_kind"]; title: string; description: string; status: Database["public"]["Enums"]["work_item_status"]; priority: Database["public"]["Enums"]["mission_priority"]; owner_id: string | null; due_at: string | null; approver_id: string | null; approved_by: string | null; approved_at: string | null; waiting_on: Database["public"]["Enums"]["waiting_party"] | null; waiting_note: string; waiting_since: string | null; snoozed_until: string | null; decision_options: string[]; decision_outcome: string; decided_by: string | null; decided_at: string | null; status_note: string; project_id: string | null; mission_id: string | null; organization_id: string | null; created_by: string; updated_by: string; completed_at: string | null; created_at: string; updated_at: string; version: number };
        Insert: { id?: string; kind?: Database["public"]["Enums"]["work_item_kind"]; title: string; description?: string; status?: Database["public"]["Enums"]["work_item_status"]; priority?: Database["public"]["Enums"]["mission_priority"]; owner_id?: string | null; due_at?: string | null; approver_id?: string | null; approved_by?: string | null; approved_at?: string | null; waiting_on?: Database["public"]["Enums"]["waiting_party"] | null; waiting_note?: string; waiting_since?: string | null; snoozed_until?: string | null; decision_options?: string[]; decision_outcome?: string; decided_by?: string | null; decided_at?: string | null; status_note?: string; project_id?: string | null; mission_id?: string | null; organization_id?: string | null; created_by: string; updated_by: string; completed_at?: string | null; created_at?: string; updated_at?: string; version?: number };
        Update: { id?: string; kind?: Database["public"]["Enums"]["work_item_kind"]; title?: string; description?: string; status?: Database["public"]["Enums"]["work_item_status"]; priority?: Database["public"]["Enums"]["mission_priority"]; owner_id?: string | null; due_at?: string | null; approver_id?: string | null; approved_by?: string | null; approved_at?: string | null; waiting_on?: Database["public"]["Enums"]["waiting_party"] | null; waiting_note?: string; waiting_since?: string | null; snoozed_until?: string | null; decision_options?: string[]; decision_outcome?: string; decided_by?: string | null; decided_at?: string | null; status_note?: string; project_id?: string | null; mission_id?: string | null; organization_id?: string | null; created_by?: string; updated_by?: string; completed_at?: string | null; created_at?: string; updated_at?: string; version?: number };
        Relationships: [];
      };
      work_item_comment: {
        Row: { id: string; item_id: string; author_id: string; body: string; created_at: string };
        Insert: { id?: string; item_id: string; author_id: string; body: string; created_at?: string };
        Update: { id?: string; item_id?: string; author_id?: string; body?: string; created_at?: string };
        Relationships: [];
      };
      work_item_event: {
        Row: { id: number; item_id: string; actor_id: string | null; kind: string; from_value: string | null; to_value: string | null; note: string; occurred_at: string };
        Insert: { item_id: string; actor_id?: string | null; kind: string; from_value?: string | null; to_value?: string | null; note?: string; occurred_at?: string };
        Update: { item_id?: string; actor_id?: string | null; kind?: string; from_value?: string | null; to_value?: string | null; note?: string; occurred_at?: string };
        Relationships: [];
      };
      work_item_file: {
        Row: { item_id: string; file_id: string; linked_by: string; linked_at: string };
        Insert: { item_id: string; file_id: string; linked_by: string; linked_at?: string };
        Update: { item_id?: string; file_id?: string; linked_by?: string; linked_at?: string };
        Relationships: [];
      };
    };
    Views: {
      public_project: {
        Row: { id: string | null; slug: string | null; name: string | null; name_en: string | null; summary: string | null; summary_en: string | null; description_md: string | null; description_md_en: string | null; category: string | null; status: Database["public"]["Enums"]["project_status"] | null; starts_on: string | null; ends_on: string | null; updated_at: string | null; cover_file_id: string | null; created_at: string | null };
        Relationships: [];
      };
      public_publication: {
        Row: { id: string | null; type: Database["public"]["Enums"]["content_type"] | null; locale: string | null; slug: string | null; title: string | null; summary: string | null; body_md: string | null; event_at: string | null; event_place: string | null; cover_alt: string | null; cover_credit: string | null; published_at: string | null; cover_file_id: string | null; gallery_file_ids: string[] | null };
        Relationships: [];
      };
    };
    Functions: {
      can_manage_mission: {
        Args: { p_mission: string };
        Returns: boolean;
      };
      can_view_file: {
        Args: { p_file: string };
        Returns: boolean;
      };
      can_view_work_item: {
        Args: { p_item: string };
        Returns: boolean;
      };
      claim_mail_outbox: {
        Args: { p_limit?: number };
        Returns: Database["public"]["Tables"]["mail_outbox"]["Row"][];
      };
      compute_indicators: {
        Args: { p_start: string; p_end: string };
        Returns: Json;
      };
      consume_submission_budget: {
        Args: { p_bucket: string; p_window: unknown; p_limit: number };
        Returns: boolean;
      };
      current_profile_status: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["account_status"];
      };
      drive_integration_status: {
        Args: Record<string, never>;
        Returns: { status: Database["public"]["Enums"]["drive_connection_status"]; provider_account_email: string; provider_account_name: string; scope: string; root_folder_id: string; root_folder_name: string; connected_by: string; connected_at: string; last_checked_at: string; last_check_result: Json; last_error: string; has_refresh_token: boolean }[];
      };
      enqueue_mail: {
        Args: { p_template: string; p_locale: string; p_email: string; p_profile: string; p_target_type: string; p_target_id: string; p_payload: Json };
        Returns: undefined;
      };
      enqueue_mail_to_profile: {
        Args: { p_template: string; p_profile: string; p_target_type: string; p_target_id: string; p_payload: Json };
        Returns: undefined;
      };
      find_profile_by_email: {
        Args: { p_email: string };
        Returns: { id: string; full_name: string; email: string; status: Database["public"]["Enums"]["account_status"] }[];
      };
      has_global_role: {
        Args: { roles: Database["public"]["Enums"]["global_role"][] };
        Returns: boolean;
      };
      indicator_formulas_version: {
        Args: Record<string, never>;
        Returns: number;
      };
      is_active_user: {
        Args: Record<string, never>;
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
        Args: Record<string, never>;
        Returns: boolean;
      };
      log_activity: {
        Args: { p_project: string; p_mission: string; p_kind: string; p_from?: string; p_to?: string; p_payload?: Json };
        Returns: undefined;
      };
      log_audit: {
        Args: { p_action: string; p_target_type: string; p_target_id: string; p_result?: string; p_diff?: Json };
        Returns: undefined;
      };
      log_crm: {
        Args: { p_org: string; p_challenge: string; p_kind: string; p_from?: string; p_to?: string; p_payload?: Json };
        Returns: undefined;
      };
      log_work_item: {
        Args: { p_item: string; p_kind: string; p_from?: string; p_to?: string; p_note?: string };
        Returns: undefined;
      };
      mail_outbox_summary: {
        Args: Record<string, never>;
        Returns: { status: Database["public"]["Enums"]["mail_status"]; total: number; last_at: string }[];
      };
      mission_project: {
        Args: { p_mission: string };
        Returns: string;
      };
      preview_content: {
        Args: { p_token: string };
        Returns: { id: string; type: Database["public"]["Enums"]["content_type"]; locale: string; slug: string; title: string; summary: string; body_md: string; event_at: string; event_place: string; status: Database["public"]["Enums"]["content_status"] }[];
      };
      project_role_of: {
        Args: { p_project: string };
        Returns: Database["public"]["Enums"]["project_role"];
      };
      public_file_info: {
        Args: { p_file: string };
        Returns: { external_id: string; mime_type: string; name: string; size_bytes: number; content_hash: string }[];
      };
      public_gallery: {
        Args: { p_publication: string };
        Returns: { file_id: string; alt_text: string; alt_text_en: string; credit: string; caption: string; sort_order: number }[];
      };
      public_project_gallery: {
        Args: { p_slug: string };
        Returns: { file_id: string; alt_text: string; alt_text_en: string; credit: string; kind: Database["public"]["Enums"]["file_link_kind"]; sort_order: number }[];
      };
      public_site_image: {
        Args: { p_key: string };
        Returns: { file_id: string; alt_text: string; alt_text_en: string; credit: string }[];
      };
      publish_content: {
        Args: { p_item: string; p_revision?: string };
        Returns: string;
      };
      settle_mail_outbox: {
        Args: { p_id: string; p_ok: boolean; p_detail?: string; p_retry?: boolean };
        Returns: undefined;
      };
      shares_project_with: {
        Args: { p_other: string };
        Returns: boolean;
      };
      snapshot_indicators: {
        Args: { p_start: string; p_end: string };
        Returns: string;
      };
      submit_research_challenge: {
        Args: { p_organization_name: string; p_contact_name: string; p_contact_email: string; p_contact_phone: string; p_title: string; p_description: string; p_capability_ids: string[]; p_confidentiality: boolean; p_locale: string; p_submitter_hash: string };
        Returns: string;
      };
      unpublish_content: {
        Args: { p_item: string; p_reason?: string };
        Returns: undefined;
      };
      valid_decision_options: {
        Args: { p: string[] };
        Returns: boolean;
      };
    };
    Enums: {
      account_status: "pending" | "active" | "disabled";
      approval_decision: "pending" | "approved" | "changes_requested";
      challenge_status: "received" | "screening" | "forwarded" | "proposal" | "accepted" | "declined" | "closed";
      classification: "public" | "internal" | "restricted" | "administrative";
      consent_status: "not_required" | "pending" | "granted" | "refused";
      content_status: "draft" | "review" | "changes_requested" | "approved" | "scheduled" | "published" | "unpublished" | "archived";
      content_type: "news" | "event" | "project_update" | "experience" | "partner_case" | "lab_case";
      drive_connection_status: "connected" | "revoked" | "disconnected";
      file_link_kind: "attachment" | "cover" | "gallery" | "official_document";
      file_provider: "google_drive" | "external_link";
      file_status: "registered" | "verified" | "archived" | "revoked";
      global_role: "admin" | "coordination" | "advisor" | "member" | "external" | "viewer";
      mail_status: "queued" | "sent" | "failed";
      membership_status: "active" | "removed";
      mission_priority: "low" | "medium" | "high";
      mission_status: "planned" | "in_progress" | "in_validation" | "done" | "paused" | "cancelled";
      organization_kind: "company" | "public_body" | "academic" | "association" | "other";
      partnership_stage: "mapped" | "contacted" | "meeting" | "proposal" | "negotiation" | "confirmed" | "lost" | "paused";
      project_role: "leader" | "member" | "viewer" | "external";
      project_status: "draft" | "planned" | "active" | "paused" | "completed" | "archived" | "cancelled";
      relationship_activity_kind: "note" | "call" | "email" | "meeting" | "visit" | "proposal";
      theme_preference: "light" | "dark" | "system";
      waiting_party: "coordination" | "admin" | "student" | "professor" | "company" | "supplier" | "secretariat" | "transport" | "ufsc" | "other";
      work_item_kind: "action" | "approval" | "decision" | "follow_up";
      work_item_status: "inbox" | "planned" | "in_progress" | "waiting" | "awaiting_approval" | "done" | "blocked" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
