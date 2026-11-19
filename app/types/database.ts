// Types des tables Supabase utilisées par l'app (écrits à la main d'après le schéma)
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type RoutePoint = [number, number] // [latitude, longitude]

export type GoalRow = {
  user_id: string
  height_cm: number
  start_weight_kg: number
  target_weight_kg: number
  age: number
  sex: string
  activity_factor: number
  weekly_loss_kg: number
  created_at: string
}

export type WeighInRow = {
  id: string
  user_id: string
  measured_at: string
  weight_kg: number
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  water_pct: number | null
  source: string
  created_at: string
}

export type WorkoutRow = {
  id: string
  user_id: string
  started_at: string
  plan_week: number | null
  plan_session: number | null
  duration_s: number
  distance_m: number
  route: Json | null
  kind: string
  notes: string | null
  created_at: string
}

export type MealRow = {
  id: string
  user_id: string
  eaten_at: string
  meal_type: string
  label: string
  barcode: string | null
  grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  source: string
  created_at: string
}

export type StrengthRow = {
  id: string
  user_id: string
  plan_week: number | null
  plan_session: number | null
  template: string
  duration_s: number
  exercises_done: number
  started_at: string
  created_at: string
}

export type FoodPrefsRow = {
  user_id: string
  have: string[]
  avoid: string[]
  updated_at: string
}

export type ReminderPrefsRow = {
  user_id: string
  enabled: boolean
  weigh_hour: number | null
  workout_hour: number | null
  workout_days: number[]
  meals_hour: number | null
  tz: string
  last_sent: Record<string, string>
  updated_at: string
}

export type DailyStepsRow = {
  user_id: string
  day: string
  steps: number
  updated_at: string
}

type Table<R extends Record<string, unknown>, Required extends keyof R> = {
  Row: R
  Insert: Pick<R, Required> & Partial<Omit<R, Required>>
  Update: Partial<R>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      goals: Table<GoalRow, never>
      weigh_ins: Table<WeighInRow, 'weight_kg'>
      workouts: Table<WorkoutRow, 'duration_s'>
      meals: Table<MealRow, 'label' | 'kcal'>
      food_prefs: Table<FoodPrefsRow, never>
      reminder_prefs: Table<ReminderPrefsRow, never>
      daily_steps: Table<DailyStepsRow, 'day' | 'steps'>
      strength_sessions: Table<StrengthRow, 'template'>
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Goal = GoalRow
export type WeighIn = WeighInRow
export type Workout = Omit<WorkoutRow, 'route'> & { route: RoutePoint[] | null }
export type Meal = MealRow
export type WorkoutInsert = Omit<Database['public']['Tables']['workouts']['Insert'], 'route'> & {
  route?: RoutePoint[] | null
}
export type MealInsert = Database['public']['Tables']['meals']['Insert']
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Strength = StrengthRow
export type StrengthInsert = Database['public']['Tables']['strength_sessions']['Insert']
export type FoodPrefs = FoodPrefsRow
export type ReminderPrefs = ReminderPrefsRow
