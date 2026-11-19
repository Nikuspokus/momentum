// Plan de renforcement musculaire à faible impact : 3 séances par semaine sur 8 semaines.
// Les images viennent de free-exercise-db (domaine public) ; noms et consignes sont traduits ici.
export type StepKind = 'warmup' | 'work' | 'cooldown'

export type Exercise = {
  name: string
  cue: string
  hold?: boolean // exercice tenu dans le temps (gainage, étirement) plutôt que répété
}

export type StrengthStep = {
  exerciseId: string
  kind: StepKind
  sets: number
  reps: number | null
  holdSec: number | null
  restSec: number
}

export type StrengthSession = {
  id: string // « semaine-séance », ex. 2-3
  week: number
  session: number
  template: 'A' | 'B' | 'C'
  title: string
  focus: string
  steps: StrengthStep[]
  estMin: number
}

export const EXERCISES: Record<string, Exercise> = {
  Standing_Hip_Circles: {
    name: 'Cercles de hanches',
    cue: 'Debout, mains sur les hanches, dessine de grands cercles avec le bassin. Change de sens à mi-temps.',
    hold: true,
  },
  Bodyweight_Squat: {
    name: 'Squat au poids du corps',
    cue: "Pieds écartés comme les épaules. Assieds-toi vers l'arrière, comme sur une chaise, dos droit, genoux dans l'axe des pieds.",
  },
  'Step-up_with_Knee_Raise': {
    name: 'Montée sur marche',
    cue: 'Monte sur une marche solide, lève le genou opposé, redescends sans à-coup. Les répétitions sont comptées par jambe.',
  },
  Butt_Lift_Bridge: {
    name: 'Pont fessier',
    cue: 'Allongé sur le dos, genoux pliés. Pousse dans les talons pour monter le bassin, serre les fessiers, redescends doucement.',
  },
  Plank: {
    name: 'Planche (gainage)',
    cue: "Appuyé sur les avant-bras, corps aligné de la tête aux talons. Pose les genoux au sol si c'est trop dur. Respire.",
    hold: true,
  },
  'Incline_Push-Up': {
    name: 'Pompes inclinées',
    cue: "Mains sur une table solide ou un mur, corps droit. Plie les coudes pour approcher la poitrine, puis repousse. Plus l'appui est haut, plus c'est facile.",
  },
  'One-Arm_Dumbbell_Row': {
    name: 'Tirage à un bras',
    cue: "Une main sur une chaise, dos plat. Avec un haltère ou un bidon d'eau, tire le coude vers la hanche. Répétitions par bras.",
  },
  Dumbbell_Shoulder_Press: {
    name: 'Développé épaules',
    cue: "Assis, dos bien droit, un haltère ou une bouteille d'eau dans chaque main. Pousse vers le haut sans cambrer le dos.",
  },
  Superman: {
    name: 'Superman',
    cue: 'Allongé sur le ventre, lève bras et jambes sans forcer, tiens une seconde, relâche. Garde la nuque dans le prolongement du dos.',
  },
  Dead_Bug: {
    name: 'Dead bug',
    cue: 'Sur le dos, bras tendus vers le plafond, genoux à 90°. Descends un bras et la jambe opposée, reviens, alterne. Le bas du dos reste collé au sol.',
  },
  Hamstring_Stretch: {
    name: 'Étirement arrière de cuisse',
    cue: 'Une jambe tendue devant toi, penche-toi doucement vers elle, dos long. Pas de douleur, juste une tension. Change de jambe à mi-temps.',
    hold: true,
  },
  Kneeling_Hip_Flexor: {
    name: 'Étirement avant de hanche',
    cue: "Un genou au sol, l'autre pied devant. Avance doucement le bassin. Change de côté à mi-temps.",
    hold: true,
  },
  Standing_Gastrocnemius_Calf_Stretch: {
    name: 'Étirement des mollets',
    cue: 'Mains contre un mur, une jambe tendue derrière, talon au sol. Change de jambe à mi-temps.',
    hold: true,
  },
  Triceps_Stretch: {
    name: 'Étirement des triceps',
    cue: "Main dans le dos, l'autre main pousse doucement le coude vers le haut. Change de bras à mi-temps.",
    hold: true,
  },
  Shoulder_Stretch: {
    name: "Étirement d'épaule",
    cue: 'Un bras tendu devant toi, ramène-le vers la poitrine avec l\'autre bras. Change à mi-temps.',
    hold: true,
  },
  Dynamic_Chest_Stretch: {
    name: 'Étirement des pectoraux',
    cue: 'Bras ouverts à hauteur des épaules, ouvre la poitrine vers l\'arrière, sans cambrer.',
    hold: true,
  },
  Cat_Stretch: {
    name: 'Dos rond, dos creux',
    cue: 'À quatre pattes, arrondis le dos en expirant, puis creuse doucement en inspirant. Mouvement lent.',
    hold: true,
  },
  Childs_Pose: {
    name: "Posture de l'enfant",
    cue: 'À genoux, assieds-toi sur les talons, bras tendus devant toi, front vers le sol. Respire profondément.',
    hold: true,
  },
}

type WeekParams = { sets: number; reps: number; plank: number; rest: number }

// Progression : un peu plus de séries, de répétitions et de gainage chaque semaine
const WEEKS: WeekParams[] = [
  { sets: 2, reps: 8, plank: 20, rest: 60 },
  { sets: 2, reps: 10, plank: 20, rest: 60 },
  { sets: 3, reps: 8, plank: 25, rest: 60 },
  { sets: 3, reps: 10, plank: 30, rest: 50 },
  { sets: 3, reps: 12, plank: 30, rest: 50 },
  { sets: 3, reps: 12, plank: 35, rest: 45 },
  { sets: 3, reps: 14, plank: 40, rest: 45 },
  { sets: 3, reps: 15, plank: 45, rest: 45 },
]

const warm = (id: string, sec = 30): StrengthStep => ({
  exerciseId: id, kind: 'warmup', sets: 1, reps: null, holdSec: sec, restSec: 0,
})
const cool = (id: string): StrengthStep => ({
  exerciseId: id, kind: 'cooldown', sets: 1, reps: null, holdSec: 40, restSec: 0,
})
const reps = (id: string, w: WeekParams, n = w.reps): StrengthStep => ({
  exerciseId: id, kind: 'work', sets: w.sets, reps: n, holdSec: null, restSec: w.rest,
})
const hold = (id: string, w: WeekParams): StrengthStep => ({
  exerciseId: id, kind: 'work', sets: w.sets, reps: null, holdSec: w.plank, restSec: w.rest,
})

const TEMPLATES = {
  A: {
    title: 'Bas du corps',
    focus: 'Cuisses, fessiers et gainage',
    steps: (w: WeekParams): StrengthStep[] => [
      warm('Standing_Hip_Circles'),
      reps('Bodyweight_Squat', w),
      reps('Step-up_with_Knee_Raise', w, Math.max(6, w.reps - 2)),
      reps('Butt_Lift_Bridge', w),
      hold('Plank', w),
      cool('Hamstring_Stretch'),
      cool('Kneeling_Hip_Flexor'),
      cool('Standing_Gastrocnemius_Calf_Stretch'),
    ],
  },
  B: {
    title: 'Haut du corps et dos',
    focus: 'Poitrine, dos, épaules',
    steps: (w: WeekParams): StrengthStep[] => [
      warm('Standing_Hip_Circles'),
      reps('Incline_Push-Up', w, Math.max(6, w.reps - 2)),
      reps('One-Arm_Dumbbell_Row', w),
      reps('Dumbbell_Shoulder_Press', w),
      reps('Superman', w),
      reps('Dead_Bug', w),
      cool('Dynamic_Chest_Stretch'),
      cool('Triceps_Stretch'),
      cool('Cat_Stretch'),
    ],
  },
  C: {
    title: 'Corps entier',
    focus: 'Circuit complet, tout en douceur',
    steps: (w: WeekParams): StrengthStep[] => [
      warm('Standing_Hip_Circles'),
      reps('Bodyweight_Squat', w),
      reps('Incline_Push-Up', w, Math.max(6, w.reps - 2)),
      reps('One-Arm_Dumbbell_Row', w),
      reps('Dead_Bug', w),
      hold('Plank', w),
      cool('Childs_Pose'),
      cool('Hamstring_Stretch'),
      cool('Shoulder_Stretch'),
    ],
  },
} as const

function estimateMinutes(steps: StrengthStep[]): number {
  let sec = 0
  for (const s of steps) {
    const work = s.holdSec ?? (s.reps ?? 0) * 3 // environ 3 s par répétition
    sec += s.sets * (work + 10) + Math.max(0, s.sets - 1) * s.restSec
  }
  return Math.max(10, Math.round(sec / 60))
}

export const STRENGTH_PLAN: StrengthSession[] = WEEKS.flatMap((w, wi) =>
  (['A', 'B', 'C'] as const).map((key, si) => {
    const steps = TEMPLATES[key].steps(w)
    return {
      id: `${wi + 1}-${si + 1}`,
      week: wi + 1,
      session: si + 1,
      template: key,
      title: TEMPLATES[key].title,
      focus: TEMPLATES[key].focus,
      steps,
      estMin: estimateMinutes(steps),
    }
  }),
)

export const STRENGTH_WEEKS = WEEKS.length

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
export const exerciseImageUrl = (path: string) => `${IMAGE_BASE}${path}`
export const exerciseFrames = (id: string) => [`${id}/0.jpg`, `${id}/1.jpg`]

export function stepSummary(step: StrengthStep): string {
  const per = step.reps !== null ? `${step.reps} répétitions` : `${step.holdSec} s`
  return step.sets > 1 ? `${step.sets} séries de ${per}` : per
}
