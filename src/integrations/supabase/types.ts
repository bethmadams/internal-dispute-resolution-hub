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
      case_access: {
        Row: {
          case_role: string
          created_at: string
          dispute_id: string
          expires_at: string | null
          granted_by: string | null
          id: string
          invite_email: string | null
          invite_name: string | null
          states: string[]
          user_id: string | null
        }
        Insert: {
          case_role?: string
          created_at?: string
          dispute_id: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          invite_email?: string | null
          invite_name?: string | null
          states?: string[]
          user_id?: string | null
        }
        Update: {
          case_role?: string
          created_at?: string
          dispute_id?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          invite_email?: string | null
          invite_name?: string | null
          states?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_access_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_audit: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          dispute_id: string
          id: string
          record_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          dispute_id: string
          id?: string
          record_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          dispute_id?: string
          id?: string
          record_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_audit_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_checklist_forms: {
        Row: {
          answers: Json
          dispute_id: string
          id: string
          stage: Database["public"]["Enums"]["dispute_stage"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          answers?: Json
          dispute_id: string
          id?: string
          stage: Database["public"]["Enums"]["dispute_stage"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          answers?: Json
          dispute_id?: string
          id?: string
          stage?: Database["public"]["Enums"]["dispute_stage"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_checklist_forms_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_communications: {
        Row: {
          body: string
          created_at: string
          dispute_id: string
          id: string
          kind: string
          recipients: string
          recorded_by: string | null
          sent_at: string | null
          subject: string
        }
        Insert: {
          body?: string
          created_at?: string
          dispute_id: string
          id?: string
          kind: string
          recipients: string
          recorded_by?: string | null
          sent_at?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
          kind?: string
          recipients?: string
          recorded_by?: string | null
          sent_at?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_communications_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_panelists: {
        Row: {
          approved: boolean
          challenge: string
          challenge_outcome: string
          created_at: string
          dispute_id: string
          email: string
          full_name: string
          id: string
          is_chair: boolean
          licensed_states: string[]
          status: string
          team_licensed_states: string[]
        }
        Insert: {
          approved?: boolean
          challenge?: string
          challenge_outcome?: string
          created_at?: string
          dispute_id: string
          email?: string
          full_name: string
          id?: string
          is_chair?: boolean
          licensed_states?: string[]
          status?: string
          team_licensed_states?: string[]
        }
        Update: {
          approved?: boolean
          challenge?: string
          challenge_outcome?: string
          created_at?: string
          dispute_id?: string
          email?: string
          full_name?: string
          id?: string
          is_chair?: boolean
          licensed_states?: string[]
          status?: string
          team_licensed_states?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "case_panelists_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          dispute_id: string
          due_at: string | null
          evidence_note: string
          id: string
          phase: string
          template_key: string | null
          title: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          dispute_id: string
          due_at?: string | null
          evidence_note?: string
          id?: string
          phase: string
          template_key?: string | null
          title: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          dispute_id?: string
          due_at?: string | null
          evidence_note?: string
          id?: string
          phase?: string
          template_key?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tasks_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      case_workflow: {
        Row: {
          appeal_decided_at: string | null
          appeal_due_at: string | null
          appeal_new_information: string
          appeal_outcome: string
          appeal_unavailable_reason: string
          binding_agreements_checked: boolean
          broker_ack_at: string | null
          ce_certificate_note: string
          ce_completed_at: string | null
          ce_due_at: string | null
          complaint_notified_at: string | null
          decision_at: string | null
          decision_draft: string
          director_ack_at: string | null
          dispute_id: string
          enterprise_recorded: boolean
          followup_note: string
          hearing_notice_at: string | null
          hubspot_recorded: boolean
          mediation_attempts: string
          mediation_broker: string
          mediation_complete: boolean
          mediation_outcome: string
          meeting_duration_minutes: number
          meeting_location: string
          paperwork_received_at: string | null
          payout_at: string | null
          regional_review_complete: boolean
          released_at: string | null
          released_decision: string
          repayment_amount: number | null
          repayment_due_at: string | null
          repayment_received_at: string | null
          updated_at: string
          voluntary_confirmed: boolean
        }
        Insert: {
          appeal_decided_at?: string | null
          appeal_due_at?: string | null
          appeal_new_information?: string
          appeal_outcome?: string
          appeal_unavailable_reason?: string
          binding_agreements_checked?: boolean
          broker_ack_at?: string | null
          ce_certificate_note?: string
          ce_completed_at?: string | null
          ce_due_at?: string | null
          complaint_notified_at?: string | null
          decision_at?: string | null
          decision_draft?: string
          director_ack_at?: string | null
          dispute_id: string
          enterprise_recorded?: boolean
          followup_note?: string
          hearing_notice_at?: string | null
          hubspot_recorded?: boolean
          mediation_attempts?: string
          mediation_broker?: string
          mediation_complete?: boolean
          mediation_outcome?: string
          meeting_duration_minutes?: number
          meeting_location?: string
          paperwork_received_at?: string | null
          payout_at?: string | null
          regional_review_complete?: boolean
          released_at?: string | null
          released_decision?: string
          repayment_amount?: number | null
          repayment_due_at?: string | null
          repayment_received_at?: string | null
          updated_at?: string
          voluntary_confirmed?: boolean
        }
        Update: {
          appeal_decided_at?: string | null
          appeal_due_at?: string | null
          appeal_new_information?: string
          appeal_outcome?: string
          appeal_unavailable_reason?: string
          binding_agreements_checked?: boolean
          broker_ack_at?: string | null
          ce_certificate_note?: string
          ce_completed_at?: string | null
          ce_due_at?: string | null
          complaint_notified_at?: string | null
          decision_at?: string | null
          decision_draft?: string
          director_ack_at?: string | null
          dispute_id?: string
          enterprise_recorded?: boolean
          followup_note?: string
          hearing_notice_at?: string | null
          hubspot_recorded?: boolean
          mediation_attempts?: string
          mediation_broker?: string
          mediation_complete?: boolean
          mediation_outcome?: string
          meeting_duration_minutes?: number
          meeting_location?: string
          paperwork_received_at?: string | null
          payout_at?: string | null
          regional_review_complete?: boolean
          released_at?: string | null
          released_decision?: string
          repayment_amount?: number | null
          repayment_due_at?: string | null
          repayment_received_at?: string | null
          updated_at?: string
          voluntary_confirmed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "case_workflow_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: true
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_appeals: {
        Row: {
          appellant_email: string
          appellant_name: string
          appellant_role: string
          created_at: string
          dispute_id: string | null
          hearing_date: string | null
          id: string
          mb_dmb_email: string | null
          mb_dmb_name: string | null
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
          mb_dmb_email?: string | null
          mb_dmb_name?: string | null
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
          mb_dmb_email?: string | null
          mb_dmb_name?: string | null
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
          in_hearing_packet: boolean
          kind: string
          response_id: string | null
          review_note: string
          review_status: string
          submitted_as: string
          submitted_by_name: string
          visibility: string
        }
        Insert: {
          appeal_id?: string | null
          created_at?: string
          dispute_id?: string | null
          file_name: string
          file_path: string
          id?: string
          in_hearing_packet?: boolean
          kind?: string
          response_id?: string | null
          review_note?: string
          review_status?: string
          submitted_as?: string
          submitted_by_name?: string
          visibility?: string
        }
        Update: {
          appeal_id?: string | null
          created_at?: string
          dispute_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          in_hearing_packet?: boolean
          kind?: string
          response_id?: string | null
          review_note?: string
          review_status?: string
          submitted_as?: string
          submitted_by_name?: string
          visibility?: string
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
          mb_dmb_email: string | null
          mb_dmb_name: string | null
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
          mb_dmb_email?: string | null
          mb_dmb_name?: string | null
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
          mb_dmb_email?: string | null
          mb_dmb_name?: string | null
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
          archived_at: string | null
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
          mb_dmb_email: string | null
          mb_dmb_name: string | null
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
          archived_at?: string | null
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
          mb_dmb_email?: string | null
          mb_dmb_name?: string | null
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
          archived_at?: string | null
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
          mb_dmb_email?: string | null
          mb_dmb_name?: string | null
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
      hub_deliveries: {
        Row: {
          created_at: string
          error: string | null
          hub_status: number | null
          id: string
          notification_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          hub_status?: number | null
          id?: string
          notification_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          hub_status?: number | null
          id?: string
          notification_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
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
          body: string | null
          case_number: string | null
          created_at: string
          dispute_id: string | null
          id: string
          kind: string
          state: string | null
          title: string
        }
        Insert: {
          body?: string | null
          case_number?: string | null
          created_at?: string
          dispute_id?: string | null
          id?: string
          kind: string
          state?: string | null
          title: string
        }
        Update: {
          body?: string | null
          case_number?: string | null
          created_at?: string
          dispute_id?: string | null
          id?: string
          kind?: string
          state?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_reminders: {
        Row: {
          body: string
          created_at: string
          created_by: string
          created_by_email: string
          dispute_id: string
          done: boolean
          due_at: string
          id: string
          lead_minutes: number
          notified_at: string | null
          remind_at: string
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          created_by_email?: string
          dispute_id: string
          done?: boolean
          due_at: string
          id?: string
          lead_minutes?: number
          notified_at?: string | null
          remind_at: string
          updated_at?: string
          user_email?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          created_by_email?: string
          dispute_id?: string
          done?: boolean
          due_at?: string
          id?: string
          lead_minutes?: number
          notified_at?: string | null
          remind_at?: string
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_reminders_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      reminder_hub_deliveries: {
        Row: {
          claimed_at: string | null
          created_at: string
          error: string | null
          reminder_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          error?: string | null
          reminder_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          error?: string | null
          reminder_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_hub_deliveries_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: true
            referencedRelation: "personal_reminders"
            referencedColumns: ["id"]
          },
        ]
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
      stage_email_queue: {
        Row: {
          created_at: string
          dispute_id: string
          error: string | null
          gmail_id: string | null
          id: string
          sent_at: string | null
          stage: Database["public"]["Enums"]["dispute_stage"]
          status: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          error?: string | null
          gmail_id?: string | null
          id?: string
          sent_at?: string | null
          stage: Database["public"]["Enums"]["dispute_stage"]
          status?: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          error?: string | null
          gmail_id?: string | null
          id?: string
          sent_at?: string | null
          stage?: Database["public"]["Enums"]["dispute_stage"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_email_queue_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_copy_queue: {
        Row: {
          copied_at: string | null
          created_at: string
          form_type: string
          id: string
          payload: Json
        }
        Insert: {
          copied_at?: string | null
          created_at?: string
          form_type: string
          id: string
          payload: Json
        }
        Update: {
          copied_at?: string | null
          created_at?: string
          form_type?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      submission_corrections: {
        Row: {
          actor_id: string
          after_data: Json
          before_data: Json
          created_at: string
          dispute_id: string | null
          form_type: string
          id: string
          submission_id: string
        }
        Insert: {
          actor_id: string
          after_data: Json
          before_data: Json
          created_at?: string
          dispute_id?: string | null
          form_type: string
          id?: string
          submission_id: string
        }
        Update: {
          actor_id?: string
          after_data?: Json
          before_data?: Json
          created_at?: string
          dispute_id?: string | null
          form_type?: string
          id?: string
          submission_id?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      territory_assignments: {
        Row: {
          created_at: string
          investigator_email: string | null
          investigator_name: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          investigator_email?: string | null
          investigator_name: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          investigator_email?: string | null
          investigator_name?: string
          state?: string
          updated_at?: string
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
      can_view_dispute: {
        Args: { _dispute_id: string; _user_id: string }
        Returns: boolean
      }
      case_released_decision: {
        Args: { _dispute_id: string }
        Returns: {
          decision: string
          released_at: string
        }[]
      }
      claim_due_reminder: { Args: { _id: string }; Returns: boolean }
      edit_submitted_form: {
        Args: {
          _expected_updated_at: string
          _id: string
          _kind: string
          _values: Json
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      person_last_name: { Args: { _name: string }; Returns: string }
      record_stage_email_sent: {
        Args: { _gmail_id: string; _queue_id: string; _sent_at: string }
        Returns: undefined
      }
      reminder_eligible_users: {
        Args: { _dispute_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      reminder_user_eligible: {
        Args: { _dispute_id: string; _user_id: string }
        Returns: boolean
      }
      save_personal_reminder: {
        Args: { _action: string; _data: Json }
        Returns: string
      }
      save_stage_checklist: {
        Args: {
          _answers: Json
          _case_id: string
          _stage: Database["public"]["Enums"]["dispute_stage"]
          _version: number
        }
        Returns: number
      }
      transition_case_stage: {
        Args: {
          _case_id: string
          _expected_stage: Database["public"]["Enums"]["dispute_stage"]
          _response_sent_at?: string
          _stage: Database["public"]["Enums"]["dispute_stage"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "investigator"
        | "viewer"
        | "complainant"
        | "respondent"
        | "panel_member"
        | "panel_chair"
        | "broker"
        | "director"
      dispute_priority: "Low" | "Medium" | "High" | "Urgent"
      dispute_stage:
        | "New Submission"
        | "In Progress"
        | "Awaiting Response"
        | "Hearing Scheduled"
        | "Appeal Filed"
        | "Closed"
        | "Eligibility Review"
        | "Evidence Review"
        | "Panel Selection"
        | "Decision Review"
        | "Appeal Window"
        | "Compliance Follow-up"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "investigator",
        "viewer",
        "complainant",
        "respondent",
        "panel_member",
        "panel_chair",
        "broker",
        "director",
      ],
      dispute_priority: ["Low", "Medium", "High", "Urgent"],
      dispute_stage: [
        "New Submission",
        "In Progress",
        "Awaiting Response",
        "Hearing Scheduled",
        "Appeal Filed",
        "Closed",
        "Eligibility Review",
        "Evidence Review",
        "Panel Selection",
        "Decision Review",
        "Appeal Window",
        "Compliance Follow-up",
      ],
    },
  },
} as const
