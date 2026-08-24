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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      dispute_appeals: {
        Row: {
          appellant_email: string
          appellant_name: string
          appellant_role: string
          created_at: string
          dispute_id: string | null
          hearing_date: string | null
          id: string
          new_evidence: string
          state: string | null
          submitted_on: string
          updated_at: string
        }
        Insert: {
          appellant_email: string
          appellant_name: string
          appellant_role: string
          created_at?: string
          dispute_id?: string | null
          hearing_date?: string | null
          id?: string
          new_evidence: string
          state?: string | null
          submitted_on?: string
          updated_at?: string
        }
        Update: {
          appellant_email?: string
          appellant_name?: string
          appellant_role?: string
          created_at?: string
          dispute_id?: string | null
          hearing_date?: string | null
          id?: string
          new_evidence?: string
          state?: string | null
          submitted_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_appeals_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_attachments: {
        Row: {
          appeal_id: string | null
          created_at: string
          dispute_id: string | null
          file_name: string
          file_path: string
          id: string
          kind: string
          response_id: string | null
        }
        Insert: {
          appeal_id?: string | null
          created_at?: string
          dispute_id?: string | null
          file_name: string
          file_path: string
          id?: string
          kind?: string
          response_id?: string | null
        }
        Update: {
          appeal_id?: string | null
          created_at?: string
          dispute_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          kind?: string
          response_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_attachments_appeal_id_fkey"
            columns: ["appeal_id"]
            isOneToOne: false
            referencedRelation: "dispute_appeals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_attachments_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_attachments_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "dispute_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          dispute_id: string
          id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          dispute_id: string
          id?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_notes_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_responses: {
        Row: {
          additional_comments: string | null
          created_at: string
          dispute_id: string | null
          id: string
          responder_email: string | null
          responder_name: string
          responding_to_name: string | null
          state: string | null
          submitted_on: string
          summary: string
          updated_at: string
        }
        Insert: {
          additional_comments?: string | null
          created_at?: string
          dispute_id?: string | null
          id?: string
          responder_email?: string | null
          responder_name: string
          responding_to_name?: string | null
          state?: string | null
          submitted_on?: string
          summary: string
          updated_at?: string
        }
        Update: {
          additional_comments?: string | null
          created_at?: string
          dispute_id?: string | null
          id?: string
          responder_email?: string | null
          responder_name?: string
          responding_to_name?: string | null
          state?: string | null
          submitted_on?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_responses_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          additional_comments: string | null
          assigned_to: string | null
          case_number: string
          closing_date: string | null
          complainant_email: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          ethics_articles: string | null
          filed_at: string
          filed_by: string | null
          hearing_date: string | null
          id: string
          involves_money: boolean | null
          monetary_amount: number | null
          priority: Database["public"]["Enums"]["dispute_priority"]
          property_address: string | null
          reasons: string[]
          resolution: string | null
          respondent: string | null
          respondent_active: boolean | null
          respondent_email: string | null
          respondent_phone: string | null
          seeking: string | null
          source: string
          stage: Database["public"]["Enums"]["dispute_stage"]
          state: string | null
          steps_taken: string | null
          title: string
          updated_at: string
        }
        Insert: {
          additional_comments?: string | null
          assigned_to?: string | null
          case_number: string
          closing_date?: string | null
          complainant_email?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          ethics_articles?: string | null
          filed_at?: string
          filed_by?: string | null
          hearing_date?: string | null
          id?: string
          involves_money?: boolean | null
          monetary_amount?: number | null
          priority?: Database["public"]["Enums"]["dispute_priority"]
          property_address?: string | null
          reasons?: string[]
          resolution?: string | null
          respondent?: string | null
          respondent_active?: boolean | null
          respondent_email?: string | null
          respondent_phone?: string | null
          seeking?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["dispute_stage"]
          state?: string | null
          steps_taken?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          additional_comments?: string | null
          assigned_to?: string | null
          case_number?: string
          closing_date?: string | null
          complainant_email?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          ethics_articles?: string | null
          filed_at?: string
          filed_by?: string | null
          hearing_date?: string | null
          id?: string
          involves_money?: boolean | null
          monetary_amount?: number | null
          priority?: Database["public"]["Enums"]["dispute_priority"]
          property_address?: string | null
          reasons?: string[]
          resolution?: string | null
          respondent?: string | null
          respondent_active?: boolean | null
          respondent_email?: string | null
          respondent_phone?: string | null
          seeking?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["dispute_stage"]
          state?: string | null
          steps_taken?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string | null
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
      app_role: "admin" | "investigator" | "viewer"
      dispute_priority: "Low" | "Medium" | "High" | "Urgent"
      dispute_stage:
        | "New Submission"
        | "In Progress"
        | "Hearing Scheduled"
        | "Appeal Filed"
        | "Closed"
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
      app_role: ["admin", "investigator", "viewer"],
      dispute_priority: ["Low", "Medium", "High", "Urgent"],
      dispute_stage: [
        "New Submission",
        "In Progress",
        "Hearing Scheduled",
        "Appeal Filed",
        "Closed",
      ],
    },
  },
} as const
