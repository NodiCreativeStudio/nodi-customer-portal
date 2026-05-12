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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_course_completion: {
        Row: {
          certificate_generated_at: string | null
          certificate_path: string | null
          client_id: string
          completed_at: string
          course_id: string
          id: string
        }
        Insert: {
          certificate_generated_at?: string | null
          certificate_path?: string | null
          client_id: string
          completed_at?: string
          course_id: string
          id?: string
        }
        Update: {
          certificate_generated_at?: string | null
          certificate_path?: string | null
          client_id?: string
          completed_at?: string
          course_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_course_completion_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "academy_course_completion_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courses: {
        Row: {
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          order_index: number
          prerequisites: string | null
          status: Database["public"]["Enums"]["academy_status"]
          title: string
          total_duration_minutes: number
          updated_at: string
          verticale: Database["public"]["Enums"]["academy_verticale"]
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          order_index?: number
          prerequisites?: string | null
          status?: Database["public"]["Enums"]["academy_status"]
          title: string
          total_duration_minutes?: number
          updated_at?: string
          verticale: Database["public"]["Enums"]["academy_verticale"]
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          order_index?: number
          prerequisites?: string | null
          status?: Database["public"]["Enums"]["academy_status"]
          title?: string
          total_duration_minutes?: number
          updated_at?: string
          verticale?: Database["public"]["Enums"]["academy_verticale"]
        }
        Relationships: []
      }
      academy_lesson_access: {
        Row: {
          client_id: string
          completed_at: string | null
          download_count: number
          id: string
          last_accessed_at: string
          lesson_id: string
          video_progress_percent: number
          viewed_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          download_count?: number
          id?: string
          last_accessed_at?: string
          lesson_id: string
          video_progress_percent?: number
          viewed_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          download_count?: number
          id?: string
          last_accessed_at?: string
          lesson_id?: string
          video_progress_percent?: number
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lesson_access_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          content_type: Database["public"]["Enums"]["academy_content_type"]
          content_url: string
          course_id: string
          created_at: string
          created_by: string | null
          description: string
          duration_minutes: number
          id: string
          is_downloadable: boolean
          lesson_number: number
          published_at: string | null
          status: Database["public"]["Enums"]["academy_lesson_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["academy_content_type"]
          content_url: string
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number
          id?: string
          is_downloadable?: boolean
          lesson_number: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["academy_lesson_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["academy_content_type"]
          content_url?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number
          id?: string
          is_downloadable?: boolean
          lesson_number?: number
          published_at?: string | null
          status?: Database["public"]["Enums"]["academy_lesson_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          client_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          label: string | null
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          label?: string | null
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          label?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      agency_config: {
        Row: {
          agency_name: string | null
          agency_tagline: string | null
          business_hours: string | null
          calendly_link: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_response_time: string | null
          contact_role: string | null
          google_calendar_link: string | null
          id: boolean
          send_monthly_report: boolean
          send_onboarding_reminder: boolean
          send_welcome_email: boolean
          sender_email: string | null
          support_email: string | null
          support_phone: string | null
          updated_at: string
          updated_by: string | null
          whatsapp_link: string | null
        }
        Insert: {
          agency_name?: string | null
          agency_tagline?: string | null
          business_hours?: string | null
          calendly_link?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_response_time?: string | null
          contact_role?: string | null
          google_calendar_link?: string | null
          id?: boolean
          send_monthly_report?: boolean
          send_onboarding_reminder?: boolean
          send_welcome_email?: boolean
          sender_email?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          agency_name?: string | null
          agency_tagline?: string | null
          business_hours?: string | null
          calendly_link?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_response_time?: string | null
          contact_role?: string | null
          google_calendar_link?: string | null
          id?: boolean
          send_monthly_report?: boolean
          send_onboarding_reminder?: boolean
          send_welcome_email?: boolean
          sender_email?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp_link?: string | null
        }
        Relationships: []
      }
      agency_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_tech_stack: {
        Row: {
          activated_at: string
          client_id: string
          created_at: string
          deactivated_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["client_tech_status"]
          subscription_id: string
          tech_stack_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          client_id: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["client_tech_status"]
          subscription_id: string
          tech_stack_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          client_id?: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["client_tech_status"]
          subscription_id?: string
          tech_stack_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tech_stack_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tech_stack_tech_stack_id_fkey"
            columns: ["tech_stack_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tech_stack_tech_stack_id_fkey"
            columns: ["tech_stack_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_tool_breakdown"
            referencedColumns: ["tech_stack_id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          contract_date: string | null
          created_at: string
          employee_count: string | null
          id: string
          industry: Database["public"]["Enums"]["client_industry"] | null
          monthly_fee: number
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_date?: string | null
          created_at?: string
          employee_count?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          monthly_fee?: number
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_date?: string | null
          created_at?: string
          employee_count?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          monthly_fee?: number
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      credentials: {
        Row: {
          access_url: string | null
          category: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          password: string | null
          platform: string | null
          service_name: string
          updated_at: string
          username: string | null
        }
        Insert: {
          access_url?: string | null
          category?: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          password?: string | null
          platform?: string | null
          service_name: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          access_url?: string | null
          category?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          password?: string | null
          platform?: string | null
          service_name?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credentials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "credentials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_costs_summary"
            referencedColumns: ["client_id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          client_id: string
          created_at: string
          description: string | null
          external_url: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          client_id: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          client_id?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          client_id: string
          created_at: string
          folder_name: string
          id: string
          parent_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          folder_name: string
          id?: string
          parent_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          folder_name?: string
          id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "folders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_costs_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_moduli: {
        Row: {
          additional_requirements: string | null
          address: string | null
          agreed_terms: boolean
          anagrafica: Json
          best_time: string | null
          budget_range: string | null
          company_name: string | null
          completato_il: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          employees_range: string | null
          founding_year: number | null
          goals: string[]
          id: string
          industry: Database["public"]["Enums"]["client_industry"] | null
          pagina_1_dati: Json
          pagina_2_dati: Json
          pagina_3_dati: Json
          preferred_contact: string | null
          ragione_sociale: string | null
          status: Database["public"]["Enums"]["onboarding_status"]
          submitted_at: string | null
          timeline: string | null
          updated_at: string
          user_id: string
          vat_id: string | null
          vertical_data: Json
          verticale: string | null
          website: string | null
        }
        Insert: {
          additional_requirements?: string | null
          address?: string | null
          agreed_terms?: boolean
          anagrafica?: Json
          best_time?: string | null
          budget_range?: string | null
          company_name?: string | null
          completato_il?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          employees_range?: string | null
          founding_year?: number | null
          goals?: string[]
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          pagina_1_dati?: Json
          pagina_2_dati?: Json
          pagina_3_dati?: Json
          preferred_contact?: string | null
          ragione_sociale?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          submitted_at?: string | null
          timeline?: string | null
          updated_at?: string
          user_id: string
          vat_id?: string | null
          vertical_data?: Json
          verticale?: string | null
          website?: string | null
        }
        Update: {
          additional_requirements?: string | null
          address?: string | null
          agreed_terms?: boolean
          anagrafica?: Json
          best_time?: string | null
          budget_range?: string | null
          company_name?: string | null
          completato_il?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          employees_range?: string | null
          founding_year?: number | null
          goals?: string[]
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          pagina_1_dati?: Json
          pagina_2_dati?: Json
          pagina_3_dati?: Json
          preferred_contact?: string | null
          ragione_sociale?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          submitted_at?: string | null
          timeline?: string | null
          updated_at?: string
          user_id?: string
          vat_id?: string | null
          vertical_data?: Json
          verticale?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_holder_name: string | null
          client_id: string
          created_at: string
          iban_country: string | null
          iban_last_4: string | null
          id: string
          is_default: boolean
          mandate_accepted_at: string
          mandate_id: string | null
          mandate_status: Database["public"]["Enums"]["mandate_status"]
          stripe_payment_method_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          account_holder_name?: string | null
          client_id: string
          created_at?: string
          iban_country?: string | null
          iban_last_4?: string | null
          id?: string
          is_default?: boolean
          mandate_accepted_at?: string
          mandate_id?: string | null
          mandate_status?: Database["public"]["Enums"]["mandate_status"]
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          account_holder_name?: string | null
          client_id?: string
          created_at?: string
          iban_country?: string | null
          iban_last_4?: string | null
          id?: string
          is_default?: boolean
          mandate_accepted_at?: string
          mandate_id?: string | null
          mandate_status?: Database["public"]["Enums"]["mandate_status"]
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          currency: string
          failure_code: string | null
          failure_reason: string | null
          id: string
          next_retry_date: string | null
          paid_at: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          retry_count: number
          status: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id: string | null
          stripe_payment_id: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          next_retry_date?: string | null
          paid_at?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          retry_count?: number
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id?: string | null
          stripe_payment_id?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          next_retry_date?: string | null
          paid_at?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          retry_count?: number
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_invoice_id?: string | null
          stripe_payment_id?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_costs_summary"
            referencedColumns: ["client_id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          project_name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_costs_summary"
            referencedColumns: ["client_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          failure_count: number
          iban_last_4: string | null
          id: string
          last_payment_date: string | null
          last_payment_status: string | null
          monthly_fee: number
          next_billing_date: string | null
          onboarding_fee: number
          onboarding_paid: boolean
          onboarding_paid_at: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          failure_count?: number
          iban_last_4?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_status?: string | null
          monthly_fee?: number
          next_billing_date?: string | null
          onboarding_fee?: number
          onboarding_paid?: boolean
          onboarding_paid_at?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          failure_count?: number
          iban_last_4?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_status?: string | null
          monthly_fee?: number
          next_billing_date?: string | null
          onboarding_fee?: number
          onboarding_paid?: boolean
          onboarding_paid_at?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_stack: {
        Row: {
          auto_renew: boolean
          category: Database["public"]["Enums"]["tech_category"] | null
          client_id: string
          connected_account: string | null
          cost_annual: number | null
          cost_monthly: number | null
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          last_sync_at: string | null
          renewal_date: string | null
          service_name: string
          status: Database["public"]["Enums"]["tech_status"]
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          category?: Database["public"]["Enums"]["tech_category"] | null
          client_id: string
          connected_account?: string | null
          cost_annual?: number | null
          cost_monthly?: number | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          last_sync_at?: string | null
          renewal_date?: string | null
          service_name: string
          status?: Database["public"]["Enums"]["tech_status"]
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          category?: Database["public"]["Enums"]["tech_category"] | null
          client_id?: string
          connected_account?: string | null
          cost_annual?: number | null
          cost_monthly?: number | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          last_sync_at?: string | null
          renewal_date?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["tech_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_stack_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tech_stack_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_stack_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_costs_summary"
            referencedColumns: ["client_id"]
          },
        ]
      }
      tech_stack_catalog: {
        Row: {
          created_at: string
          created_by: string | null
          description_do: string
          description_what: string
          description_why: string
          icon_url: string | null
          id: string
          name: string
          updated_at: string
          website_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description_do: string
          description_what: string
          description_why: string
          icon_url?: string | null
          id?: string
          name: string
          updated_at?: string
          website_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description_do?: string
          description_what?: string
          description_why?: string
          icon_url?: string | null
          id?: string
          name?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      tech_stack_subscriptions: {
        Row: {
          cost_monthly: number | null
          cost_yearly: number | null
          created_at: string
          currency: string
          id: string
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          tech_stack_id: string
          updated_at: string
        }
        Insert: {
          cost_monthly?: number | null
          cost_yearly?: number | null
          created_at?: string
          currency?: string
          id?: string
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          tech_stack_id: string
          updated_at?: string
        }
        Update: {
          cost_monthly?: number | null
          cost_yearly?: number | null
          created_at?: string
          currency?: string
          id?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          tech_stack_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_stack_subscriptions_tech_stack_id_fkey"
            columns: ["tech_stack_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_stack_subscriptions_tech_stack_id_fkey"
            columns: ["tech_stack_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_tool_breakdown"
            referencedColumns: ["tech_stack_id"]
          },
        ]
      }
      uploads: {
        Row: {
          client_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          folder: string
          folder_id: string | null
          id: string
          storage_path: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          folder?: string
          folder_id?: string | null
          id?: string
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string
          folder_id?: string | null
          id?: string
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "academy_course_progress"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tech_stack_costs_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "uploads_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
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
      webhooks_log: {
        Row: {
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
          stripe_event_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          stripe_event_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          stripe_event_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      academy_course_progress: {
        Row: {
          client_id: string | null
          completed_lessons: number | null
          completion_date: string | null
          course_id: string | null
          course_title: string | null
          is_course_completed: boolean | null
          total_lessons: number | null
          verticale: Database["public"]["Enums"]["academy_verticale"] | null
        }
        Relationships: []
      }
      tech_stack_costs_summary: {
        Row: {
          client_id: string | null
          client_name: string | null
          last_updated: string | null
          tools_count: number | null
          total_cost_monthly: number | null
          total_cost_yearly: number | null
        }
        Relationships: []
      }
      tech_stack_tool_breakdown: {
        Row: {
          active_clients_count: number | null
          clients_using_count: number | null
          tech_stack_id: string | null
          tool_name: string | null
          tool_website: string | null
          total_cost_monthly: number | null
          total_cost_yearly: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_company: { Args: never; Returns: string }
      current_user_verticale: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_my_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
    }
    Enums: {
      academy_content_type: "pdf" | "video"
      academy_lesson_status: "draft" | "scheduled" | "published" | "archived"
      academy_status: "draft" | "published" | "archived"
      academy_verticale: "retail" | "wellness" | "repair" | "shared"
      app_role: "admin" | "client"
      client_industry: "retail" | "wellness" | "repair"
      client_status: "active" | "inactive"
      client_tech_status: "active" | "inactive"
      document_category:
        | "report"
        | "invoice"
        | "contract"
        | "deliverable"
        | "onboarding"
        | "other"
      mandate_status: "accepted" | "rejected" | "cancelled"
      onboarding_status: "draft" | "submitted"
      payment_status: "succeeded" | "failed" | "pending" | "cancelled"
      payment_type: "onboarding" | "monthly_subscription"
      project_status: "planning" | "in_progress" | "completed"
      subscription_status: "active" | "cancelled" | "past_due" | "incomplete"
      subscription_type: "free" | "basic" | "pro" | "enterprise"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "in_progress" | "done"
      tech_category:
        | "whatsapp"
        | "email"
        | "web"
        | "loyalty"
        | "calendar"
        | "analytics"
        | "sms"
      tech_status: "active" | "inactive" | "trial" | "error"
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
      academy_content_type: ["pdf", "video"],
      academy_lesson_status: ["draft", "scheduled", "published", "archived"],
      academy_status: ["draft", "published", "archived"],
      academy_verticale: ["retail", "wellness", "repair", "shared"],
      app_role: ["admin", "client"],
      client_industry: ["retail", "wellness", "repair"],
      client_status: ["active", "inactive"],
      client_tech_status: ["active", "inactive"],
      document_category: [
        "report",
        "invoice",
        "contract",
        "deliverable",
        "onboarding",
        "other",
      ],
      mandate_status: ["accepted", "rejected", "cancelled"],
      onboarding_status: ["draft", "submitted"],
      payment_status: ["succeeded", "failed", "pending", "cancelled"],
      payment_type: ["onboarding", "monthly_subscription"],
      project_status: ["planning", "in_progress", "completed"],
      subscription_status: ["active", "cancelled", "past_due", "incomplete"],
      subscription_type: ["free", "basic", "pro", "enterprise"],
      task_priority: ["low", "medium", "high"],
      task_status: ["todo", "in_progress", "done"],
      tech_category: [
        "whatsapp",
        "email",
        "web",
        "loyalty",
        "calendar",
        "analytics",
        "sms",
      ],
      tech_status: ["active", "inactive", "trial", "error"],
    },
  },
} as const
