export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      invitations: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string | null
          general_contractor_id: string | null
          id: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          general_contractor_id?: string | null
          id?: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          general_contractor_id?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          role?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          id: string
          last_sign_in: string | null
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          id: string
          last_sign_in?: string | null
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          id?: string
          last_sign_in?: string | null
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_subcontractors: {
        Row: {
          assigned_at: string
          contract_amount: number | null
          project_id: string
          subcontractor_id: string
        }
        Insert: {
          assigned_at?: string
          contract_amount?: number | null
          project_id: string
          subcontractor_id: string
        }
        Update: {
          assigned_at?: string
          contract_amount?: number | null
          project_id?: string
          subcontractor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subcontractors_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          start_date: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          start_date?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      qualification_documents: {
        Row: {
          document_type: string
          document_url: string
          expiry_date: string | null
          id: string
          subcontractor_id: string | null
          uploaded_at: string
        }
        Insert: {
          document_type: string
          document_url: string
          expiry_date?: string | null
          id?: string
          subcontractor_id?: string | null
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          document_url?: string
          expiry_date?: string | null
          id?: string
          subcontractor_id?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualification_documents_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          aggregate_limit: number | null
          company_logo: string | null
          company_name: string | null
          email: string
          has_paid: boolean
          id: string
          invited_at: string
          invited_by: string
          last_submission_date: string | null
          name: string | null
          qualification_status: string
          single_project_limit: number | null
          submission_status: string
          trade: string | null
          user_id: string | null
        }
        Insert: {
          aggregate_limit?: number | null
          company_logo?: string | null
          company_name?: string | null
          email: string
          has_paid?: boolean
          id?: string
          invited_at?: string
          invited_by: string
          last_submission_date?: string | null
          name?: string | null
          qualification_status?: string
          single_project_limit?: number | null
          submission_status?: string
          trade?: string | null
          user_id?: string | null
        }
        Update: {
          aggregate_limit?: number | null
          company_logo?: string | null
          company_name?: string | null
          email?: string
          has_paid?: boolean
          id?: string
          invited_at?: string
          invited_by?: string
          last_submission_date?: string | null
          name?: string | null
          qualification_status?: string
          single_project_limit?: number | null
          submission_status?: string
          trade?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: { sql_query: string }
        Returns: undefined
      }
      has_permission: {
        Args: { user_id: string; permission_name: string }
        Returns: boolean
      }
      verify_invitation_code: {
        Args: { code_param: string }
        Returns: {
          valid: boolean
          email: string
          general_contractor_id: string
          general_contractor_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
