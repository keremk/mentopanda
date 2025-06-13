export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      characters: {
        Row: {
          ai_description: string | null
          ai_model: string | null
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          name: string
          project_id: number
          updated_at: string | null
          voice: string | null
        }
        Insert: {
          ai_description?: string | null
          ai_model?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          name: string
          project_id: number
          updated_at?: string | null
          voice?: string | null
        }
        Update: {
          ai_description?: string | null
          ai_model?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          name?: string
          project_id?: number
          updated_at?: string | null
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string | null
          id: number
          training_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          training_id: number
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: number
          training_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          assessment_created: boolean
          assessment_text: string | null
          completed_at: string | null
          id: number
          module_id: number | null
          practice_no: number
          recording_url: string | null
          started_at: string | null
          transcript_json: Json | null
          transcript_text: string | null
          user_id: string
        }
        Insert: {
          assessment_created?: boolean
          assessment_text?: string | null
          completed_at?: string | null
          id?: number
          module_id?: number | null
          practice_no?: number
          recording_url?: string | null
          started_at?: string | null
          transcript_json?: Json | null
          transcript_text?: string | null
          user_id?: string
        }
        Update: {
          assessment_created?: boolean
          assessment_text?: string | null
          completed_at?: string | null
          id?: number
          module_id?: number | null
          practice_no?: number
          recording_url?: string | null
          started_at?: string | null
          transcript_json?: Json | null
          transcript_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "history_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          id: number
          invitee_email: string
          inviter_display_name: string
          inviter_email: string
          inviter_id: string
          is_trial: boolean
          project_id: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          invitee_email: string
          inviter_display_name: string
          inviter_email: string
          inviter_id: string
          is_trial?: boolean
          project_id?: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          invitee_email?: string
          inviter_display_name?: string
          inviter_email?: string
          inviter_id?: string
          is_trial?: boolean
          project_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          created_for: string | null
          expire_by: number
          id: number
          validated: boolean
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          created_for?: string | null
          expire_by?: number
          id?: number
          validated?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          created_for?: string | null
          expire_by?: number
          id?: number
          validated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          ai_model: string | null
          assessment_prompt: string | null
          audio_url: string | null
          created_at: string | null
          id: number
          instructions: string | null
          moderator_prompt: string | null
          ordinal: number
          scenario_prompt: string | null
          title: string
          training_id: number
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          ai_model?: string | null
          assessment_prompt?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: number
          instructions?: string | null
          moderator_prompt?: string | null
          ordinal?: number
          scenario_prompt?: string | null
          title: string
          training_id: number
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          ai_model?: string | null
          assessment_prompt?: string | null
          audio_url?: string | null
          created_at?: string | null
          id?: number
          instructions?: string | null
          moderator_prompt?: string | null
          ordinal?: number
          scenario_prompt?: string | null
          title?: string
          training_id?: number
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      modules_characters: {
        Row: {
          character_id: number
          created_at: string | null
          module_id: number
          ordinal: number
          prompt: string | null
          updated_at: string | null
        }
        Insert: {
          character_id: number
          created_at?: string | null
          module_id: number
          ordinal?: number
          prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number
          created_at?: string | null
          module_id?: number
          ordinal?: number
          prompt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_characters_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          current_project_id: number | null
          id: string
          pricing_plan: Database["public"]["Enums"]["pricing_plan"]
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_project_id?: number | null
          id: string
          pricing_plan?: Database["public"]["Enums"]["pricing_plan"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_project_id?: number | null
          id?: string
          pricing_plan?: Database["public"]["Enums"]["pricing_plan"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number
          is_public: boolean
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_public?: boolean
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_public?: boolean
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_profiles: {
        Row: {
          created_at: string | null
          profile_id: string
          project_id: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          profile_id: string
          project_id: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          profile_id?: string
          project_id?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      trainings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          image_url: string | null
          preview_url: string | null
          project_id: number
          tagline: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          preview_url?: string | null
          project_id: number
          tagline?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          preview_url?: string | null
          project_id?: number
          tagline?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      usage: {
        Row: {
          assessment: Json
          conversation: Json
          created_at: string
          id: number
          images: Json
          period_start: string
          prompt_helper: Json
          purchased_credits: number
          subscription_credits: number
          transcription: Json
          updated_at: string
          used_purchased_credits: number
          used_subscription_credits: number
          user_id: string
        }
        Insert: {
          assessment?: Json
          conversation?: Json
          created_at?: string
          id?: number
          images?: Json
          period_start: string
          prompt_helper?: Json
          purchased_credits?: number
          subscription_credits?: number
          transcription?: Json
          updated_at?: string
          used_purchased_credits?: number
          used_subscription_credits?: number
          user_id: string
        }
        Update: {
          assessment?: Json
          conversation?: Json
          created_at?: string
          id?: number
          images?: Json
          period_start?: string
          prompt_helper?: Json
          purchased_credits?: number
          subscription_credits?: number
          transcription?: Json
          updated_at?: string
          used_purchased_credits?: number
          used_subscription_credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          comment: string | null
          date_requested: string
          email: string
          id: number
        }
        Insert: {
          comment?: string | null
          date_requested?: string
          email: string
          id?: number
        }
        Update: {
          comment?: string | null
          date_requested?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { invitation_id: number; user_id: string; p_project_id?: number }
        Returns: boolean
      }
      akeys: {
        Args: { "": unknown }
        Returns: string[]
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
          project_id: number
        }
        Returns: boolean
      }
      avals: {
        Args: { "": unknown }
        Returns: string[]
      }
      create_project: {
        Args: { project_name: string }
        Returns: number
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      deep_copy_project: {
        Args: {
          source_project_id: number
          target_project_id: number
          target_user_id: string
        }
        Returns: undefined
      }
      each: {
        Args: { hs: unknown }
        Returns: Record<string, unknown>[]
      }
      get_character_project_id: {
        Args: { p_character_id: number }
        Returns: number
      }
      get_current_period_start: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_invite_code_by_code: {
        Args: { code_to_find: string }
        Returns: Json
      }
      get_or_create_current_usage: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_project_member_info: {
        Args: { p_project_id: number; p_user_id: string }
        Returns: Json
      }
      get_project_members: {
        Args: { p_project_id: number }
        Returns: Json
      }
      get_user_emails_by_ids: {
        Args: { user_ids: string[] }
        Returns: {
          id: string
          email: string
        }[]
      }
      get_user_id_by_email: {
        Args: { email: string }
        Returns: {
          id: string
        }[]
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: Json
      }
      ghstore_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ghstore_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ghstore_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ghstore_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      ghstore_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore: {
        Args: { "": string[] } | { "": Record<string, unknown> }
        Returns: unknown
      }
      hstore_hash: {
        Args: { "": unknown }
        Returns: number
      }
      hstore_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_send: {
        Args: { "": unknown }
        Returns: string
      }
      hstore_subscript_handler: {
        Args: { "": unknown }
        Returns: unknown
      }
      hstore_to_array: {
        Args: { "": unknown }
        Returns: string[]
      }
      hstore_to_json: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_json_loose: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_jsonb_loose: {
        Args: { "": unknown }
        Returns: Json
      }
      hstore_to_matrix: {
        Args: { "": unknown }
        Returns: string[]
      }
      hstore_version_diag: {
        Args: { "": unknown }
        Returns: number
      }
      is_member_of_project: {
        Args: { project_id: number }
        Returns: boolean
      }
      is_project_owner: {
        Args: { project_id: number }
        Returns: boolean
      }
      replace_module_character: {
        Args: {
          p_module_id: number
          p_old_character_id: number
          p_new_character_id: number
        }
        Returns: undefined
      }
      skeys: {
        Args: { "": unknown }
        Returns: string[]
      }
      svals: {
        Args: { "": unknown }
        Returns: string[]
      }
      validate_invite_code: {
        Args: { code_to_validate: string }
        Returns: Json
      }
    }
    Enums: {
      app_permission:
        | "training.manage"
        | "enrollment.manage"
        | "project.manage"
        | "project.member.manage"
        | "training.history"
        | "basic.access"
        | "trials.manage"
      pricing_plan: "free" | "pro" | "team" | "enterprise"
      user_role: "admin" | "manager" | "member" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_permission: [
        "training.manage",
        "enrollment.manage",
        "project.manage",
        "project.member.manage",
        "training.history",
        "basic.access",
        "trials.manage",
      ],
      pricing_plan: ["free", "pro", "team", "enterprise"],
      user_role: ["admin", "manager", "member", "super_admin"],
    },
  },
} as const

