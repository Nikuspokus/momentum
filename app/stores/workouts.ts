import type { Json, RoutePoint, Workout, WorkoutInsert } from '~/types/database'

export const useWorkoutsStore = defineStore('workouts', () => {
  const supabase = useSupabase()

  const entries = ref<Workout[]>([]) // du plus récent au plus ancien
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const doneIds = computed(
    () =>
      new Set(
        entries.value
          .filter((w) => w.plan_week && w.plan_session)
          .map((w) => `${w.plan_week}-${w.plan_session}`),
      ),
  )
  const nextSession = computed(() => PLAN.find((s) => !doneIds.value.has(s.id)) ?? null)
  const totalDistanceKm = computed(() => entries.value.reduce((sum, w) => sum + w.distance_m, 0) / 1000)
  const doneToday = computed(() => {
    const today = localDayKey(new Date())
    return entries.value.some((w) => localDayKey(w.started_at) === today)
  })

  async function load(force = false) {
    if (loaded.value && !force) return
    const { data, error: err } = await supabase
      .from('workouts')
      .select('*')
      .order('started_at', { ascending: false })
    if (err) {
      error.value = err.message
      return
    }
    entries.value = data.map((w) => ({ ...w, route: (w.route as RoutePoint[] | null) ?? null }))
    loaded.value = true
  }

  async function add(input: WorkoutInsert) {
    error.value = null
    const { data, error: err } = await supabase
      .from('workouts')
      .insert({ ...input, route: (input.route ?? null) as Json | null })
      .select()
      .single()
    if (err) {
      error.value = err.message
      return false
    }
    const saved: Workout = { ...data, route: (data.route as RoutePoint[] | null) ?? null }
    entries.value = [saved, ...entries.value].sort((a, b) => b.started_at.localeCompare(a.started_at))
    return true
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('workouts').delete().eq('id', id)
    if (err) {
      error.value = err.message
      return
    }
    entries.value = entries.value.filter((w) => w.id !== id)
  }

  return { entries, loaded, error, doneIds, nextSession, totalDistanceKm, doneToday, load, add, remove }
})
