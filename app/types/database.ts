// Sous-ensemble des types générés par Supabase (tables utilisées par l'app)
export type Database = {
  public: {
    Tables: {
      goals: {
        Row: {
          created_at: string
          height_cm: number
          start_weight_kg: number
          target_weight_kg: number
          user_id: string
        }
        Insert: {
          created_at?: string
          height_cm?: number
          start_weight_kg?: number
          target_weight_kg?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          height_cm?: number
          start_weight_kg?: number
          target_weight_kg?: number
          user_id?: string
        }
        Relationships: []
      }
      weigh_ins: {
        Row: {
          body_fat_pct: number | null
          created_at: string
          id: string
          measured_at: string
          muscle_mass_kg: number | null
          source: string
          user_id: string
          water_pct: number | null
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          muscle_mass_kg?: number | null
          source?: string
          user_id?: string
          water_pct?: number | null
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          muscle_mass_kg?: number | null
          source?: string
          user_id?: string
          water_pct?: number | null
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type WeighIn = Database['public']['Tables']['weigh_ins']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
