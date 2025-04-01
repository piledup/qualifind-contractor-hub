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
      has_permission: {
        Args: {
          user_id: string
          permission_name: string
        }
        Returns: boolean
      }
      verify_invitation_code: {
        Args: {
          code_param: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
