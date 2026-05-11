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
            referencedRelation: "clients"
            referencedColumns: ["id"]
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
            referencedRelation: "clients"
            referencedColumns: ["id"]
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
            referencedRelation: "clients"
            referencedColumns: ["id"]
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
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "clients"
            referencedColumns: ["id"]
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
            referencedRelation: "clients"
            referencedColumns: ["id"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_company: { Args: never; Returns: string }
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
      app_role: "admin" | "client"
      client_industry: "retail" | "wellness" | "repair"
      client_status: "active" | "inactive"
      document_category:
        | "report"
        | "invoice"
        | "contract"
        | "deliverable"
        | "onboarding"
        | "other"
      onboarding_status: "draft" | "submitted"
      project_status: "planning" | "in_progress" | "completed"
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
      app_role: ["admin", "client"],
      client_industry: ["retail", "wellness", "repair"],
      client_status: ["active", "inactive"],
      document_category: [
        "report",
        "invoice",
        "contract",
        "deliverable",
        "onboarding",
        "other",
      ],
      onboarding_status: ["draft", "submitted"],
      project_status: ["planning", "in_progress", "completed"],
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
