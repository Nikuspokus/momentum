import type { DailyStepsRow } from '~/types/database'

export const useStepsStore = defineStore('steps', () => {
  const supabase = useSupabase()
  const entries = ref<DailyStepsRow[]>([])
  const loaded = ref(false)
  const error = ref<string | null>(null)

  async function load(force = false) {
    if (loaded.value && !force) return
    const since = new Date(Date.now() - 14 * 86_400_000)
    const { data, error: err } = await supabase
      .from('daily_steps').select('*').gte('day', localDayKey(since)).order('day', { ascending: false })
    if (err) { error.value = err.message; return }
    entries.value = data
    loaded.value = true
  }

  // Pas d'un jour : le plus grand entre la saisie et l'estimation tirée des courses suivies ce jour-là
  function stepsFor(dayKey: string): number {
    const manual = entries.value.find((e) => e.day === dayKey)?.steps ?? 0
    const heightCm = useWeightStore().goal?.height_cm ?? 175
    const meters = useWorkoutsStore().entries
      .filter((w) => localDayKey(w.started_at) === dayKey)
      .reduce((sum, w) => sum + w.distance_m, 0)
    return Math.max(manual, metersToSteps(meters, heightCm))
  }

  const today = computed(() => stepsFor(localDayKey(new Date())))
  const week = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86_400_000)
      return { key: localDayKey(d), label: d.toLocaleDateString('fr-FR', { weekday: 'narrow' }), steps: stepsFor(localDayKey(d)) }
    }),
  )

  async function setToday(steps: number) {
    error.value = null
    const userId = useAuthStore().user?.id
    if (!userId) return false
    const day = localDayKey(new Date())
    const { error: err } = await supabase
      .from('daily_steps').upsert({ user_id: userId, day, steps, updated_at: new Date().toISOString() })
    if (err) { error.value = err.message; return false }
    entries.value = [{ user_id: userId, day, steps, updated_at: new Date().toISOString() }, ...entries.value.filter((e) => e.day !== day)]
    return true
  }

  return { entries, loaded, error, today, week, load, setToday }
})
