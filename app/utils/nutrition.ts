import type { Goal } from '~/types/database'

export type NutritionTarget = {
  bmr: number // métabolisme de base (kcal/jour)
  tdee: number // dépense totale estimée (kcal/jour)
  kcal: number // objectif calorique quotidien
  protein: number
  carbs: number
  fat: number
}

// Équation de Mifflin-St Jeor : estimation reconnue du métabolisme de base.
// Résultat indicatif, à valider avec un médecin ou un diététicien.
export function computeNutrition(goal: Goal, weightKg: number): NutritionTarget {
  const sexTerm = goal.sex === 'F' ? -161 : 5
  const bmr = 10 * weightKg + 6.25 * goal.height_cm - 5 * goal.age + sexTerm
  const tdee = bmr * goal.activity_factor
  const deficit = (goal.weekly_loss_kg * 7700) / 7 // ~7700 kcal par kg de masse grasse
  const floor = goal.sex === 'F' ? 1400 : 1600 // plancher de sécurité
  const kcal = Math.round(Math.max(tdee - deficit, floor))
  const protein = Math.round(goal.target_weight_kg * 1.6)
  const fat = Math.round((kcal * 0.28) / 9)
  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 0)
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, carbs, fat }
}
