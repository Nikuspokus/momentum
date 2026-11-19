import type { Goal, WeighIn } from '~/types/database'

const DAY_MS = 86_400_000

export const useWeightStore = defineStore('weight', () => {
  const supabase = useSupabase()

  const entries = ref<WeighIn[]>([]) // de la plus ancienne à la plus récente
  const goal = ref<Goal | null>(null)
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const latest = computed(() => entries.value.at(-1) ?? null)
  const currentKg = computed(() => latest.value?.weight_kg ?? goal.value?.start_weight_kg ?? 0)
  const lostKg = computed(() => (goal.value ? goal.value.start_weight_kg - currentKg.value : 0))
  const remainingKg = computed(() =>
    goal.value ? Math.max(currentKg.value - goal.value.target_weight_kg, 0) : 0,
  )
  const progressPct = computed(() => {
    if (!goal.value) return 0
    const total = goal.value.start_weight_kg - goal.value.target_weight_kg
    return total > 0 ? Math.min(Math.max((lostKg.value / total) * 100, 0), 100) : 0
  })
  const bmi = computed(() => {
    const h = goal.value ? goal.value.height_cm / 100 : 0
    return h > 0 && currentKg.value ? currentKg.value / (h * h) : 0
  })
  const weighedToday = computed(() => {
    const today = localDayKey(new Date())
    return entries.value.some((e) => localDayKey(e.measured_at) === today)
  })

  // Tendance en kg/semaine sur les 28 derniers jours
  const weeklyTrendKg = computed(() => {
    if (entries.value.length < 2) return 0
    const last = entries.value[entries.value.length - 1]!
    const since = new Date(last.measured_at).getTime() - 28 * DAY_MS
    const windowed = entries.value.filter((e) => new Date(e.measured_at).getTime() >= since)
    if (windowed.length < 2) return 0
    const first = windowed[0]!
    const days = (new Date(last.measured_at).getTime() - new Date(first.measured_at).getTime()) / DAY_MS
    return days >= 1 ? ((last.weight_kg - first.weight_kg) / days) * 7 : 0
  })
  const etaWeeks = computed(() =>
    weeklyTrendKg.value < -0.05 ? Math.ceil(remainingKg.value / -weeklyTrendKg.value) : null,
  )

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      const [goalRes, entriesRes] = await Promise.all([
        supabase.from('goals').select('*').maybeSingle(),
        supabase.from('weigh_ins').select('*').order('measured_at', { ascending: true }),
      ])
      if (goalRes.error) throw goalRes.error
      if (entriesRes.error) throw entriesRes.error
      entries.value = entriesRes.data
      if (goalRes.data) {
        goal.value = goalRes.data
      } else {
        const created = await supabase.from('goals').insert({}).select().single()
        if (created.error) throw created.error
        goal.value = created.data
      }
      loaded.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de chargement'
    } finally {
      loading.value = false
    }
  }

  async function add(weightKg: number, measuredAt = new Date()) {
    error.value = null
    const { data, error: err } = await supabase
      .from('weigh_ins')
      .insert({ weight_kg: weightKg, measured_at: measuredAt.toISOString(), source: 'manual' })
      .select()
      .single()
    if (err) {
      error.value = err.message
      return false
    }
    entries.value = [...entries.value, data].sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    return true
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('weigh_ins').delete().eq('id', id)
    if (err) {
      error.value = err.message
      return
    }
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  async function saveGoal(patch: Partial<Omit<Goal, 'user_id' | 'created_at'>>) {
    const userId = useAuthStore().user?.id
    if (!userId) return false
    error.value = null
    const { data, error: err } = await supabase
      .from('goals')
      .update(patch)
      .eq('user_id', userId)
      .select()
      .single()
    if (err) {
      error.value = err.message
      return false
    }
    goal.value = data
    return true
  }

  return {
    entries, goal, loaded, loading, error,
    latest, currentKg, lostKg, remainingKg, progressPct, bmi, weighedToday, weeklyTrendKg, etaWeeks,
    load, add, remove, saveGoal,
  }
})
