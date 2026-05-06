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
      clients: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          contract_date: string | null
          created_at: string
          id: string
          industry: Database["public"]["Enums"]["client_industry"] | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_date?: string | null
          created_at?: string
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          contract_date?: string | null
          created_at?: string
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
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
      onboarding_moduli: {
        Row: {
          additional_requirements: string | null
          address: string | null
          agreed_terms: boolean
          best_time: string | null
          budget_range: string | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          employees_range: string | null
          founding_year: number | null
          goals: string[]
          id: string
          industry: Database["public"]["Enums"]["client_industry"] | null
          preferred_contact: string | null
          status: Database["public"]["Enums"]["onboarding_status"]
          submitted_at: string | null
          timeline: string | null
          updated_at: string
          user_id: string
          vat_id: string | null
          vertical_data: Json
          website: string | null
        }
        Insert: {
          additional_requirements?: string | null
          address?: string | null
          agreed_terms?: boolean
          best_time?: string | null
          budget_range?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          employees_range?: string | null
          founding_year?: number | null
          goals?: string[]
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          preferred_contact?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          submitted_at?: string | null
          timeline?: string | null
          updated_at?: string
          user_id: string
          vat_id?: string | null
          vertical_data?: Json
          website?: string | null
        }
        Update: {
          additional_requirements?: string | null
          address?: string | null
          agreed_terms?: boolean
          best_time?: string | null
          budget_range?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          employees_range?: string | null
          founding_year?: number | null
          goals?: string[]
          id?: string
          industry?: Database["public"]["Enums"]["client_industry"] | null
          preferred_contact?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          submitted_at?: string | null
          timeline?: string | null
          updated_at?: string
          user_id?: string
          vat_id?: string | null
          vertical_data?: Json
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
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
          category: Database["public"]["Enums"]["tech_category"] | null
          client_id: string
          cost_monthly: number | null
          created_at: string
          id: string
          renewal_date: string | null
          service_name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["tech_category"] | null
          client_id: string
          cost_monthly?: number | null
          created_at?: string
          id?: string
          renewal_date?: string | null
          service_name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["tech_category"] | null
          client_id?: string
          cost_monthly?: number | null
          created_at?: string
          id?: string
          renewal_date?: string | null
          service_name?: string
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
    }
    Enums: {
      app_role: "admin" | "client"
      client_industry: "retail" | "wellness" | "repair"
      client_status: "active" | "inactive"
      onboarding_status: "draft" | "submitted"
      project_status: "planning" | "in_progress" | "completed"
      task_status: "todo" | "in_progress" | "done"
      tech_category:
        | "whatsapp"
        | "email"
        | "web"
        | "loyalty"
        | "calendar"
        | "analytics"
        | "sms"
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
      onboarding_status: ["draft", "submitted"],
      project_status: ["planning", "in_progress", "completed"],
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
    },
  },
} as const
