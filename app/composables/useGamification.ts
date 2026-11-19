// XP, niveaux, séries et badges, calculés à partir des données existantes (rien à stocker)
export function useGamification() {
  const weight = useWeightStore()
  const meals = useMealsStore()
  const workouts = useWorkoutsStore()
  const strength = useStrengthStore()

  const activeDays = computed(() => {
    const days = new Set<string>()
    weight.entries.forEach((e) => days.add(localDayKey(e.measured_at)))
    meals.entries.forEach((m) => days.add(localDayKey(m.eaten_at)))
    workouts.entries.forEach((w) => days.add(localDayKey(w.started_at)))
    strength.entries.forEach((s) => days.add(localDayKey(s.started_at)))
    return days
  })

  // Série : jours consécutifs avec au moins une action, en comptant aujourd'hui s'il y en a une,
  // sinon à partir d'hier (la série n'est pas perdue tant que la journée n'est pas finie)
  const streak = computed(() => {
    const cursor = new Date()
    if (!activeDays.value.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    let count = 0
    while (activeDays.value.has(localDayKey(cursor))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  })

  const mealDays = computed(() => new Set(meals.entries.map((m) => localDayKey(m.eaten_at))).size)

  const xp = computed(
    () =>
      weight.entries.length * 10 +
      mealDays.value * 5 +
      workouts.entries.length * 50 +
      strength.entries.length * 40 +
      Math.round(workouts.totalDistanceKm * 10),
  )

  const STEP = 40 // niveau n atteint à STEP × (n-1)² points d'XP
  const level = computed(() => Math.floor(Math.sqrt(xp.value / STEP)) + 1)
  const levelProgressPct = computed(() => {
    const from = STEP * (level.value - 1) ** 2
    const to = STEP * level.value ** 2
    return ((xp.value - from) / (to - from)) * 100
  })
  const xpToNext = computed(() => STEP * level.value ** 2 - xp.value)

  const badges = computed(() => {
    const lost = weight.lostKg
    const runs = workouts.entries.length
    const best = streak.value
    return [
      { id: 'first-weigh', label: 'Première pesée', hint: 'Enregistre une pesée', earned: weight.entries.length >= 1 },
      { id: 'first-run', label: 'Première séance', hint: 'Termine une séance de course', earned: runs >= 1 },
      { id: 'first-meal', label: 'Premier repas noté', hint: 'Ajoute un repas', earned: meals.entries.length >= 1 },
      { id: 'streak-3', label: '3 jours d\'affilée', hint: 'Une action par jour pendant 3 jours', earned: best >= 3 },
      { id: 'streak-7', label: 'Semaine complète', hint: '7 jours d\'affilée', earned: best >= 7 },
      { id: 'streak-30', label: 'Mois de régularité', hint: '30 jours d\'affilée', earned: best >= 30 },
      { id: 'lost-1', label: '1 kg perdu', hint: 'Perds 1 kg', earned: lost >= 1 },
      { id: 'lost-5', label: '5 kg perdus', hint: 'Perds 5 kg', earned: lost >= 5 },
      { id: 'lost-10', label: '10 kg perdus', hint: 'Perds 10 kg', earned: lost >= 10 },
      { id: 'first-strength', label: 'Premier renfo', hint: 'Termine une séance de renforcement', earned: strength.entries.length >= 1 },
      { id: 'strength-10', label: '10 séances de renfo', hint: 'Termine 10 séances de renforcement', earned: strength.entries.length >= 10 },
      { id: 'runs-10', label: '10 séances', hint: 'Termine 10 séances', earned: runs >= 10 },
      { id: 'km-25', label: '25 km parcourus', hint: 'Cumule 25 km', earned: workouts.totalDistanceKm >= 25 },
      { id: 'goal', label: 'Objectif atteint', hint: 'Atteins ton poids cible', earned: !!weight.goal && weight.remainingKg === 0 && weight.entries.length > 0 },
    ]
  })

  return { streak, xp, level, levelProgressPct, xpToNext, badges }
}
