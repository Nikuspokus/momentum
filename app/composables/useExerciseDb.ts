// Base d'exercices free-exercise-db (domaine public), chargée à la demande (environ 1 Mo)
export type DbExercise = {
  id: string
  name: string
  level: string
  equipment: string | null
  category: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  images: string[]
}

const URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

let cache: Promise<DbExercise[]> | null = null

export const MUSCLES_FR: Record<string, string> = {
  abdominals: 'abdominaux', abductors: 'abducteurs', adductors: 'adducteurs', biceps: 'biceps',
  calves: 'mollets', chest: 'pectoraux', forearms: 'avant-bras', glutes: 'fessiers',
  hamstrings: 'ischio-jambiers', lats: 'grands dorsaux', 'lower back': 'bas du dos',
  'middle back': 'milieu du dos', neck: 'nuque', quadriceps: 'quadriceps', shoulders: 'épaules',
  traps: 'trapèzes', triceps: 'triceps',
}

export const EQUIPMENT_FR: Record<string, string> = {
  'body only': 'poids du corps', dumbbell: 'haltères', bands: 'élastiques', barbell: 'barre',
  cable: 'poulie', 'e-z curl bar': 'barre EZ', 'exercise ball': 'swiss ball', 'foam roll': 'rouleau',
  kettlebells: 'kettlebell', machine: 'machine', 'medicine ball': 'médecine-ball', other: 'autre',
}

export const LEVEL_FR: Record<string, string> = {
  beginner: 'débutant', intermediate: 'intermédiaire', expert: 'avancé',
}

export const muscleFr = (m: string) => MUSCLES_FR[m] ?? m
export const equipmentFr = (e: string | null) => (e ? (EQUIPMENT_FR[e] ?? e) : 'aucun matériel')

export function useExerciseDb() {
  function loadExercises(): Promise<DbExercise[]> {
    cache ??= fetch(URL)
      .then((r) => {
        if (!r.ok) throw new Error('Base d’exercices indisponible')
        return r.json() as Promise<DbExercise[]>
      })
      .catch((e) => {
        cache = null // permet de réessayer
        throw e
      })
    return cache
  }
  return { loadExercises }
}
