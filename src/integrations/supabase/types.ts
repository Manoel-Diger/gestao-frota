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
      Abastecimentos: {
        Row: {
          created_at: string
          custo_total: number | null
          data: string | null
          id: number
          litros: number | null
          quilometragem: number | null
          veiculo_placa: string | null
        }
        Insert: {
          created_at?: string
          custo_total?: number | null
          data?: string | null
          id?: number
          litros?: number | null
          quilometragem?: number | null
          veiculo_placa?: string | null
        }
        Update: {
          created_at?: string
          custo_total?: number | null
          data?: string | null
          id?: number
          litros?: number | null
          quilometragem?: number | null
          veiculo_placa?: string | null
        }
        Relationships: []
      }
      Manutencoes: {
        Row: {
          created_at: string
          custo: number | null
          data: string | null
          descricao: string | null
          id: number
          tipo_manutencao: string | null
          veiculo_placa: string | null
        }
        Insert: {
          created_at?: string
          custo?: number | null
          data?: string | null
          descricao?: string | null
          id?: number
          tipo_manutencao?: string | null
          veiculo_placa?: string | null
        }
        Update: {
          created_at?: string
          custo?: number | null
          data?: string | null
          descricao?: string | null
          id?: number
          tipo_manutencao?: string | null
          veiculo_placa?: string | null
        }
        Relationships: []
      }
      Motoristas: {
        Row: {
          categoria_cnh: string | null
          created_at: string
          email: string | null
          id: number
          nome: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          categoria_cnh?: string | null
          created_at?: string
          email?: string | null
          id?: number
          nome?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          categoria_cnh?: string | null
          created_at?: string
          email?: string | null
          id?: number
          nome?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      Veiculos: {
        Row: {
          ano: number | null
          combustivel_atual: number | null
          created_at: string
          id: number
          localizacao: string | null
          marca: string | null
          modelo: string | null
          placa: string | null
          proxima_manutencao: string | null
          quilometragem: number | null
          status: string | null
          tipo_combustivel: string | null
        }
        Insert: {
          ano?: number | null
          combustivel_atual?: number | null
          created_at?: string
          id?: number
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          placa?: string | null
          proxima_manutencao?: string | null
          quilometragem?: number | null
          status?: string | null
          tipo_combustivel?: string | null
        }
        Update: {
          ano?: number | null
          combustivel_atual?: number | null
          created_at?: string
          id?: number
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          placa?: string | null
          proxima_manutencao?: string | null
          quilometragem?: number | null
          status?: string | null
          tipo_combustivel?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
