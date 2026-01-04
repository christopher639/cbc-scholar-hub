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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          academic_year: string
          created_at: string
          end_date: string
          id: string
          is_current: boolean | null
          start_date: string
          term: Database["public"]["Enums"]["term"]
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean | null
          start_date: string
          term: Database["public"]["Enums"]["term"]
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean | null
          start_date?: string
          term?: Database["public"]["Enums"]["term"]
          updated_at?: string
        }
        Relationships: []
      }
      academic_years: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      admission_number_settings: {
        Row: {
          created_at: string | null
          current_number: number
          id: string
          padding: number
          prefix: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_number?: number
          id?: string
          padding?: number
          prefix?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_number?: number
          id?: string
          padding?: number
          prefix?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alumni: {
        Row: {
          created_at: string | null
          final_grade_id: string | null
          final_stream_id: string | null
          graduation_date: string
          graduation_year: string
          id: string
          learner_id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          final_grade_id?: string | null
          final_stream_id?: string | null
          graduation_date?: string
          graduation_year: string
          id?: string
          learner_id: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          final_grade_id?: string | null
          final_stream_id?: string | null
          graduation_date?: string
          graduation_year?: string
          id?: string
          learner_id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alumni_final_grade_id_fkey"
            columns: ["final_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_final_stream_id_fkey"
            columns: ["final_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: true
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      appearance_settings: {
        Row: {
          app_theme: string | null
          card_style: string | null
          created_at: string
          hero_gradient: string | null
          id: string
          page_background: string | null
          primary_color: string
          sidebar_style: string | null
          updated_at: string
        }
        Insert: {
          app_theme?: string | null
          card_style?: string | null
          created_at?: string
          hero_gradient?: string | null
          id?: string
          page_background?: string | null
          primary_color?: string
          sidebar_style?: string | null
          updated_at?: string
        }
        Update: {
          app_theme?: string | null
          card_style?: string | null
          created_at?: string
          hero_gradient?: string | null
          id?: string
          page_background?: string | null
          primary_color?: string
          sidebar_style?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      application_settings: {
        Row: {
          applications_open: boolean
          created_at: string
          fee_amount: number
          fee_enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          applications_open?: boolean
          created_at?: string
          fee_amount?: number
          fee_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          applications_open?: boolean
          created_at?: string
          fee_amount?: number
          fee_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          allergies: string | null
          application_number: string
          applying_for_grade_id: string | null
          applying_for_grade_name: string
          birth_certificate_number: string | null
          blood_type: string | null
          boarding_status: string
          created_at: string
          date_of_birth: string
          emergency_contact: string | null
          emergency_phone: string | null
          fee_amount: number | null
          fee_paid: boolean
          first_name: string
          gender: string
          id: string
          last_name: string
          medical_info: string | null
          parent_address: string | null
          parent_email: string
          parent_first_name: string
          parent_last_name: string
          parent_occupation: string | null
          parent_phone: string
          payment_reference: string | null
          previous_grade: string | null
          previous_school: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          application_number: string
          applying_for_grade_id?: string | null
          applying_for_grade_name: string
          birth_certificate_number?: string | null
          blood_type?: string | null
          boarding_status?: string
          created_at?: string
          date_of_birth: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          fee_amount?: number | null
          fee_paid?: boolean
          first_name: string
          gender: string
          id?: string
          last_name: string
          medical_info?: string | null
          parent_address?: string | null
          parent_email: string
          parent_first_name: string
          parent_last_name: string
          parent_occupation?: string | null
          parent_phone: string
          payment_reference?: string | null
          previous_grade?: string | null
          previous_school?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          application_number?: string
          applying_for_grade_id?: string | null
          applying_for_grade_name?: string
          birth_certificate_number?: string | null
          blood_type?: string | null
          boarding_status?: string
          created_at?: string
          date_of_birth?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          fee_amount?: number | null
          fee_paid?: boolean
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          medical_info?: string | null
          parent_address?: string | null
          parent_email?: string
          parent_first_name?: string
          parent_last_name?: string
          parent_occupation?: string | null
          parent_phone?: string
          payment_reference?: string | null
          previous_grade?: string | null
          previous_school?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applying_for_grade_id_fkey"
            columns: ["applying_for_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          id: string
          learner_id: string
          marks_obtained: number | null
          status: string
          submission_text: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          learner_id: string
          marks_obtained?: number | null
          status?: string
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          learner_id?: string
          marks_obtained?: number | null
          status?: string
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          academic_year: string
          created_at: string
          description: string | null
          due_date: string
          file_url: string | null
          grade_id: string
          id: string
          learning_area_id: string
          stream_id: string | null
          teacher_id: string
          term: Database["public"]["Enums"]["term"]
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          description?: string | null
          due_date: string
          file_url?: string | null
          grade_id: string
          id?: string
          learning_area_id: string
          stream_id?: string | null
          teacher_id: string
          term: Database["public"]["Enums"]["term"]
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          description?: string | null
          due_date?: string
          file_url?: string | null
          grade_id?: string
          id?: string
          learning_area_id?: string
          stream_id?: string | null
          teacher_id?: string
          term?: Database["public"]["Enums"]["term"]
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_learning_area_id_fkey"
            columns: ["learning_area_id"]
            isOneToOne: false
            referencedRelation: "learning_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          learner_id: string
          notes: string | null
          recorded_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          learner_id: string
          notes?: string | null
          recorded_by?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          learner_id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          blog_id: string
          created_at: string
          id: string
          visitor_id: string
        }
        Insert: {
          blog_id: string
          created_at?: string
          id?: string
          visitor_id: string
        }
        Update: {
          blog_id?: string
          created_at?: string
          id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_published: boolean | null
          likes_count: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          likes_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          likes_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bulk_messages: {
        Row: {
          created_at: string
          failed_count: number | null
          grade_id: string | null
          id: string
          message: string
          message_type: string
          recipient_type: string
          sender_id: string
          sent_at: string | null
          sent_count: number | null
          status: string | null
          stream_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          failed_count?: number | null
          grade_id?: string | null
          id?: string
          message: string
          message_type: string
          recipient_type: string
          sender_id: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          stream_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          failed_count?: number | null
          grade_id?: string | null
          id?: string
          message?: string
          message_type?: string
          recipient_type?: string
          sender_id?: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          stream_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_messages_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_settings: {
        Row: {
          created_at: string | null
          discount_type: string
          id: string
          is_enabled: boolean | null
          percentage: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_type: string
          id?: string
          is_enabled?: boolean | null
          percentage: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_type?: string
          id?: string
          is_enabled?: boolean | null
          percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      exam_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          max_marks: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_marks?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          max_marks?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          learner_id: string | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string
          reason: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          learner_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by: string
          reason?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          learner_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_audit_log_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_balances: {
        Row: {
          academic_year: string
          amount_paid: number
          balance: number
          created_at: string
          grade_id: string
          id: string
          learner_id: string
          term: Database["public"]["Enums"]["term"]
          total_fees: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          amount_paid?: number
          balance?: number
          created_at?: string
          grade_id: string
          id?: string
          learner_id: string
          term: Database["public"]["Enums"]["term"]
          total_fees?: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          amount_paid?: number
          balance?: number
          created_at?: string
          grade_id?: string
          id?: string
          learner_id?: string
          term?: Database["public"]["Enums"]["term"]
          total_fees?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_balances_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_balances_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fee_payments: {
        Row: {
          amount_paid: number
          created_at: string
          fee_structure_id: string
          id: string
          learner_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          receipt_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          fee_structure_id: string
          id?: string
          learner_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          fee_structure_id?: string
          id?: string
          learner_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_reminder_settings: {
        Row: {
          created_at: string
          grade_id: string | null
          id: string
          include_current_term: boolean
          include_previous_balance: boolean
          interval_days: number
          is_enabled: boolean
          last_run_at: string | null
          next_run_at: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade_id?: string | null
          id?: string
          include_current_term?: boolean
          include_previous_balance?: boolean
          interval_days?: number
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade_id?: string | null
          id?: string
          include_current_term?: boolean
          include_previous_balance?: boolean
          interval_days?: number
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_reminder_settings_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          display_order: number | null
          fee_structure_id: string
          id: string
          is_optional: boolean
          item_name: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          fee_structure_id: string
          id?: string
          is_optional?: boolean
          item_name: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          fee_structure_id?: string
          id?: string
          is_optional?: boolean
          item_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structure_items_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          grade_id: string
          id: string
          term: Database["public"]["Enums"]["term"]
          updated_at: string
        }
        Insert: {
          academic_year: string
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          grade_id: string
          id?: string
          term: Database["public"]["Enums"]["term"]
          updated_at?: string
        }
        Update: {
          academic_year?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          grade_id?: string
          id?: string
          term?: Database["public"]["Enums"]["term"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_transactions: {
        Row: {
          amount_paid: number
          created_at: string | null
          id: string
          invoice_id: string
          learner_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_issued: boolean | null
          receipt_number: string | null
          recorded_by: string
          reference_number: string | null
          transaction_number: string
          updated_at: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          id?: string
          invoice_id: string
          learner_id: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          receipt_issued?: boolean | null
          receipt_number?: string | null
          recorded_by: string
          reference_number?: string | null
          transaction_number: string
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          learner_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_issued?: boolean | null
          receipt_number?: string | null
          recorded_by?: string
          reference_number?: string | null
          transaction_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_transactions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_exam_weights: {
        Row: {
          created_at: string
          exam_type_id: string
          formula_id: string
          id: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          exam_type_id: string
          formula_id: string
          id?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          exam_type_id?: string
          formula_id?: string
          id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "formula_exam_weights_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formula_exam_weights_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "performance_formulas"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade_learning_areas: {
        Row: {
          academic_year: string
          created_at: string
          grade_id: string
          id: string
          is_mandatory: boolean | null
          learning_area_id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          grade_id: string
          id?: string
          is_mandatory?: boolean | null
          learning_area_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          grade_id?: string
          id?: string
          is_mandatory?: boolean | null
          learning_area_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_learning_areas_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_learning_areas_learning_area_id_fkey"
            columns: ["learning_area_id"]
            isOneToOne: false
            referencedRelation: "learning_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          description: string | null
          grade_level: Database["public"]["Enums"]["grade_level"]
          id: string
          is_last_grade: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade_level: Database["public"]["Enums"]["grade_level"]
          id?: string
          is_last_grade?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grade_level?: Database["public"]["Enums"]["grade_level"]
          id?: string
          is_last_grade?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      grading_scales: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          grade_name: string
          id: string
          max_percentage: number
          min_percentage: number
          points: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          grade_name: string
          id?: string
          max_percentage: number
          min_percentage: number
          points?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          grade_name?: string
          id?: string
          max_percentage?: number
          min_percentage?: number
          points?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_backgrounds: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      houses: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          invoice_id: string
          is_optional: boolean
          item_name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          invoice_id: string
          is_optional?: boolean
          item_name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          invoice_id?: string
          is_optional?: boolean
          item_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_learning_areas: {
        Row: {
          academic_year: string
          created_at: string
          grade_id: string
          id: string
          is_optional: boolean | null
          learner_id: string
          learning_area_id: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          grade_id: string
          id?: string
          is_optional?: boolean | null
          learner_id: string
          learning_area_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          grade_id?: string
          id?: string
          is_optional?: boolean | null
          learner_id?: string
          learning_area_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_learning_areas_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_learning_areas_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_learning_areas_learning_area_id_fkey"
            columns: ["learning_area_id"]
            isOneToOne: false
            referencedRelation: "learning_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_accessed: string
          learner_id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed?: string
          learner_id: string
          session_token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed?: string
          learner_id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      learners: {
        Row: {
          admission_number: string
          allergies: string | null
          birth_certificate_number: string | null
          blood_type: string | null
          boarding_status: Database["public"]["Enums"]["boarding_status"]
          created_at: string
          current_grade_id: string | null
          current_stream_id: string | null
          date_of_birth: string
          emergency_contact: string | null
          emergency_phone: string | null
          enrollment_date: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          house_id: string | null
          id: string
          is_staff_child: boolean | null
          last_name: string
          medical_info: string | null
          parent_id: string | null
          photo_url: string | null
          previous_grade: string | null
          previous_school: string | null
          reason_for_transfer: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admission_number?: string
          allergies?: string | null
          birth_certificate_number?: string | null
          blood_type?: string | null
          boarding_status?: Database["public"]["Enums"]["boarding_status"]
          created_at?: string
          current_grade_id?: string | null
          current_stream_id?: string | null
          date_of_birth: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          enrollment_date?: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          house_id?: string | null
          id?: string
          is_staff_child?: boolean | null
          last_name: string
          medical_info?: string | null
          parent_id?: string | null
          photo_url?: string | null
          previous_grade?: string | null
          previous_school?: string | null
          reason_for_transfer?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admission_number?: string
          allergies?: string | null
          birth_certificate_number?: string | null
          blood_type?: string | null
          boarding_status?: Database["public"]["Enums"]["boarding_status"]
          created_at?: string
          current_grade_id?: string | null
          current_stream_id?: string | null
          date_of_birth?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          enrollment_date?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          house_id?: string | null
          id?: string
          is_staff_child?: boolean | null
          last_name?: string
          medical_info?: string | null
          parent_id?: string | null
          photo_url?: string | null
          previous_grade?: string | null
          previous_school?: string | null
          reason_for_transfer?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learners_current_grade_id_fkey"
            columns: ["current_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_current_stream_id_fkey"
            columns: ["current_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learners_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_areas: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_areas_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          learner_id: string
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          learner_id: string
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          learner_id?: string
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_transactions: {
        Row: {
          account_reference: string
          amount: number
          checkout_request_id: string | null
          created_at: string
          id: string
          invoice_id: string | null
          learner_id: string | null
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          payer_name: string | null
          phone_number: string
          result_code: number | null
          result_desc: string | null
          status: string
          transaction_date: string | null
          transaction_id: string | null
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          account_reference: string
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          learner_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          payer_name?: string | null
          phone_number: string
          result_code?: number | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          account_reference?: string
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          learner_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          payer_name?: string | null
          phone_number?: string
          result_code?: number | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_transactions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      non_teaching_staff: {
        Row: {
          address: string | null
          created_at: string | null
          department: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          employee_number: string | null
          first_name: string
          hired_date: string | null
          id: string
          id_number: string | null
          job_title: string
          last_name: string
          phone: string | null
          photo_url: string | null
          salary: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_number?: string | null
          first_name: string
          hired_date?: string | null
          id?: string
          id_number?: string | null
          job_title: string
          last_name: string
          phone?: string | null
          photo_url?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_number?: string | null
          first_name?: string
          hired_date?: string | null
          id?: string
          id_number?: string | null
          job_title?: string
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          created_at: string
          id: string
          page_path: string
          user_agent: string | null
          visit_date: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_path?: string
          user_agent?: string | null
          visit_date?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          user_agent?: string | null
          visit_date?: string
          visitor_id?: string
        }
        Relationships: []
      }
      parent_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_accessed: string
          learner_id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed?: string
          learner_id: string
          session_token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed?: string
          learner_id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          occupation: string | null
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          occupation?: string | null
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          occupation?: string | null
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      performance_formulas: {
        Row: {
          created_at: string
          description: string | null
          formula_type: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          formula_type?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          formula_type?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_records: {
        Row: {
          academic_period_id: string | null
          academic_year: string | null
          created_at: string
          exam_type: string | null
          grade_id: string
          grade_letter: string | null
          id: string
          learner_id: string
          learning_area_id: string
          marks: number
          remarks: string | null
          stream_id: string | null
          teacher_id: string | null
          term: Database["public"]["Enums"]["term"] | null
          updated_at: string
        }
        Insert: {
          academic_period_id?: string | null
          academic_year?: string | null
          created_at?: string
          exam_type?: string | null
          grade_id: string
          grade_letter?: string | null
          id?: string
          learner_id: string
          learning_area_id: string
          marks: number
          remarks?: string | null
          stream_id?: string | null
          teacher_id?: string | null
          term?: Database["public"]["Enums"]["term"] | null
          updated_at?: string
        }
        Update: {
          academic_period_id?: string | null
          academic_year?: string | null
          created_at?: string
          exam_type?: string | null
          grade_id?: string
          grade_letter?: string | null
          id?: string
          learner_id?: string
          learning_area_id?: string
          marks?: number
          remarks?: string | null
          stream_id?: string | null
          teacher_id?: string | null
          term?: Database["public"]["Enums"]["term"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_records_academic_period_id_fkey"
            columns: ["academic_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_learning_area_id_fkey"
            columns: ["learning_area_id"]
            isOneToOne: false
            referencedRelation: "learning_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_releases: {
        Row: {
          academic_year: string
          created_at: string
          exam_type: string
          grade_id: string | null
          id: string
          released_at: string
          released_by: string
          stream_id: string | null
          term: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          exam_type: string
          grade_id?: string | null
          id?: string
          released_at?: string
          released_by: string
          stream_id?: string | null
          term: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          exam_type?: string
          grade_id?: string | null
          id?: string
          released_at?: string
          released_by?: string
          stream_id?: string | null
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_releases_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_releases_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activation_status: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_activated: boolean | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          activation_status?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_activated?: boolean | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          activation_status?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_activated?: boolean | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotion_history: {
        Row: {
          academic_year: string
          created_at: string
          from_grade_id: string | null
          from_stream_id: string | null
          id: string
          learner_id: string
          notes: string | null
          promotion_date: string
          to_grade_id: string
          to_stream_id: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string
          from_grade_id?: string | null
          from_stream_id?: string | null
          id?: string
          learner_id: string
          notes?: string | null
          promotion_date?: string
          to_grade_id: string
          to_stream_id?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string
          from_grade_id?: string | null
          from_stream_id?: string | null
          id?: string
          learner_id?: string
          notes?: string | null
          promotion_date?: string
          to_grade_id?: string
          to_stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_history_from_grade_id_fkey"
            columns: ["from_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_from_stream_id_fkey"
            columns: ["from_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_to_grade_id_fkey"
            columns: ["to_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_to_stream_id_fkey"
            columns: ["to_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      school_info: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          core_values: string | null
          created_at: string
          director_email: string | null
          director_message: string | null
          director_name: string | null
          director_phone: string | null
          director_photo_url: string | null
          director_qualification: string | null
          email: string | null
          hero_background_url: string | null
          id: string
          logo_url: string | null
          mission: string | null
          motto: string | null
          mpesa_account_name: string | null
          mpesa_paybill: string | null
          payment_instructions: string | null
          phone: string | null
          school_name: string
          two_factor_enabled: boolean | null
          two_factor_method: string | null
          updated_at: string
          vision: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          core_values?: string | null
          created_at?: string
          director_email?: string | null
          director_message?: string | null
          director_name?: string | null
          director_phone?: string | null
          director_photo_url?: string | null
          director_qualification?: string | null
          email?: string | null
          hero_background_url?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          motto?: string | null
          mpesa_account_name?: string | null
          mpesa_paybill?: string | null
          payment_instructions?: string | null
          phone?: string | null
          school_name: string
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string
          vision?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          core_values?: string | null
          created_at?: string
          director_email?: string | null
          director_message?: string | null
          director_name?: string | null
          director_phone?: string | null
          director_photo_url?: string | null
          director_qualification?: string | null
          email?: string | null
          hero_background_url?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          motto?: string | null
          mpesa_account_name?: string | null
          mpesa_paybill?: string | null
          payment_instructions?: string | null
          phone?: string | null
          school_name?: string
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string
          vision?: string | null
        }
        Relationships: []
      }
      streams: {
        Row: {
          capacity: number | null
          class_teacher_id: string | null
          created_at: string
          grade_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          grade_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          grade_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "streams_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invoices: {
        Row: {
          academic_year: string
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          discount_amount: number | null
          discount_reason: string | null
          due_date: string
          fee_structure_id: string
          generated_by: string | null
          grade_id: string
          id: string
          invoice_number: string
          issue_date: string
          learner_id: string
          notes: string | null
          status: string
          stream_id: string | null
          term: Database["public"]["Enums"]["term"]
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          amount_paid?: number
          balance_due?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          due_date: string
          fee_structure_id: string
          generated_by?: string | null
          grade_id: string
          id?: string
          invoice_number: string
          issue_date?: string
          learner_id: string
          notes?: string | null
          status?: string
          stream_id?: string | null
          term: Database["public"]["Enums"]["term"]
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          amount_paid?: number
          balance_due?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_reason?: string | null
          due_date?: string
          fee_structure_id?: string
          generated_by?: string | null
          grade_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          learner_id?: string
          notes?: string | null
          status?: string
          stream_id?: string | null
          term?: Database["public"]["Enums"]["term"]
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_invoices_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoices_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoices_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoices_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed: string | null
          session_token: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          session_token: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          session_token?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          employee_number: string | null
          first_name: string
          hired_date: string | null
          id: string
          id_number: string | null
          last_name: string
          phone: string | null
          photo_url: string | null
          salary: number | null
          specialization: string | null
          status: string | null
          tsc_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          employee_number?: string | null
          first_name: string
          hired_date?: string | null
          id?: string
          id_number?: string | null
          last_name: string
          phone?: string | null
          photo_url?: string | null
          salary?: number | null
          specialization?: string | null
          status?: string | null
          tsc_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          employee_number?: string | null
          first_name?: string
          hired_date?: string | null
          id?: string
          id_number?: string | null
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          salary?: number | null
          specialization?: string | null
          status?: string | null
          tsc_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          academic_year: string
          created_at: string
          day_of_week: number
          end_time: string
          entry_type: string
          grade_id: string
          id: string
          learning_area_id: string | null
          room: string | null
          start_time: string
          stream_id: string
          subject_name: string | null
          teacher_id: string
          term: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          day_of_week: number
          end_time: string
          entry_type?: string
          grade_id: string
          id?: string
          learning_area_id?: string | null
          room?: string | null
          start_time: string
          stream_id: string
          subject_name?: string | null
          teacher_id: string
          term: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          entry_type?: string
          grade_id?: string
          id?: string
          learning_area_id?: string | null
          room?: string | null
          start_time?: string
          stream_id?: string
          subject_name?: string | null
          teacher_id?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_learning_area_id_fkey"
            columns: ["learning_area_id"]
            isOneToOne: false
            referencedRelation: "learning_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_records: {
        Row: {
          created_at: string | null
          destination_school: string
          id: string
          learner_id: string
          reason: string | null
          transfer_date: string
        }
        Insert: {
          created_at?: string | null
          destination_school: string
          id?: string
          learner_id: string
          reason?: string | null
          transfer_date?: string
        }
        Update: {
          created_at?: string | null
          destination_school?: string
          id?: string
          learner_id?: string
          reason?: string | null
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_records_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: true
            referencedRelation: "learners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      assign_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      bulk_generate_term_invoices: {
        Args: {
          p_academic_year: string
          p_grade_id?: string
          p_term: Database["public"]["Enums"]["term"]
        }
        Returns: {
          error_message: string
          invoice_id: string
          learner_id: string
          success: boolean
        }[]
      }
      check_grade_has_learners: { Args: { grade_id: string }; Returns: boolean }
      check_stream_has_learners: {
        Args: { stream_id: string }
        Returns: boolean
      }
      check_timetable_stream_conflict: {
        Args: {
          p_academic_year: string
          p_day_of_week: number
          p_end_time: string
          p_exclude_id?: string
          p_start_time: string
          p_stream_id: string
          p_term: string
        }
        Returns: boolean
      }
      check_timetable_teacher_conflict: {
        Args: {
          p_academic_year: string
          p_day_of_week: number
          p_end_time: string
          p_exclude_id?: string
          p_start_time: string
          p_teacher_id: string
          p_term: string
        }
        Returns: boolean
      }
      clone_timetable: {
        Args: {
          p_grade_id?: string
          p_source_academic_year: string
          p_source_term: string
          p_target_academic_year: string
          p_target_term: string
        }
        Returns: number
      }
      count_admin_users: { Args: never; Returns: number }
      generate_admission_number: { Args: never; Returns: string }
      generate_application_number: { Args: never; Returns: string }
      generate_employee_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_learner_invoice:
        | {
            Args: {
              p_academic_year: string
              p_grade_id: string
              p_learner_id: string
              p_stream_id: string
              p_term: Database["public"]["Enums"]["term"]
            }
            Returns: string
          }
        | {
            Args: {
              p_academic_year: string
              p_grade_id: string
              p_learner_id: string
              p_stream_id: string
              p_term: string
            }
            Returns: string
          }
      generate_transaction_number: { Args: never; Returns: string }
      get_active_learner_count: { Args: never; Returns: number }
      get_active_learners_for_teacher_session: {
        Args: {
          p_grade_id: string
          p_session_token: string
          p_stream_id: string
        }
        Returns: {
          admission_number: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_unique_visitor_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_admins: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_message: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_overdue_invoices: { Args: never; Returns: undefined }
      recalculate_invoice_discounts: {
        Args: never
        Returns: {
          discount_amount: number
          discount_reason: string
          invoice_id: string
          learner_name: string
          original_amount: number
        }[]
      }
      validate_learner_credentials: {
        Args: { _admission: string; _birth: string }
        Returns: {
          admission_number: string
          birth_certificate_number: string
          current_grade_id: string
          current_stream_id: string
          date_of_birth: string
          first_name: string
          id: string
          last_name: string
          parent_id: string
          photo_url: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "teacher"
        | "parent"
        | "student"
        | "learner"
        | "finance"
        | "visitor"
      boarding_status: "day_scholar" | "boarder"
      gender: "male" | "female" | "other"
      grade_level:
        | "grade_1"
        | "grade_2"
        | "grade_3"
        | "grade_4"
        | "grade_5"
        | "grade_6"
        | "grade_7"
        | "grade_8"
        | "grade_9"
        | "grade_10"
        | "grade_11"
        | "grade_12"
      payment_status: "pending" | "partial" | "paid" | "overdue"
      term: "term_1" | "term_2" | "term_3"
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
      app_role: [
        "admin",
        "teacher",
        "parent",
        "student",
        "learner",
        "finance",
        "visitor",
      ],
      boarding_status: ["day_scholar", "boarder"],
      gender: ["male", "female", "other"],
      grade_level: [
        "grade_1",
        "grade_2",
        "grade_3",
        "grade_4",
        "grade_5",
        "grade_6",
        "grade_7",
        "grade_8",
        "grade_9",
        "grade_10",
        "grade_11",
        "grade_12",
      ],
      payment_status: ["pending", "partial", "paid", "overdue"],
      term: ["term_1", "term_2", "term_3"],
    },
  },
} as const
