import type { Strength, StrengthInsert } from '~/types/database'

export const useStrengthStore = defineStore('strength', () => {
  const supabase = useSupabase()

  const entries = ref<Strength[]>([]) // du plus récent au plus ancien
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const doneIds = computed(
    () =>
      new Set(
        entries.value.filter((s) => s.plan_week && s.plan_session).map((s) => `${s.plan_week}-${s.plan_session}`),
      ),
  )
  const nextSession = computed(() => STRENGTH_PLAN.find((s) => !doneIds.value.has(s.id)) ?? null)

  const doneToday = computed(() => {
    const today = new Date().toDateString()
    return entries.value.some((s) => new Date(s.started_at).toDateString() === today)
  })

  async function load(force = false) {
    if (loaded.value && !force) return
    const { data, error: err } = await supabase
      .from('strength_sessions')
      .select('*')
      .order('started_at', { ascending: false })
    if (err) {
      error.value = err.message
      return
    }
    entries.value = data
    loaded.value = true
  }

  async function add(input: StrengthInsert) {
    error.value = null
    const { data, error: err } = await supabase.from('strength_sessions').insert(input).select().single()
    if (err) {
      error.value = err.message
      return false
    }
    entries.value = [data, ...entries.value].sort((a, b) => b.started_at.localeCompare(a.started_at))
    return true
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('strength_sessions').delete().eq('id', id)
    if (err) {
      error.value = err.message
      return
    }
    entries.value = entries.value.filter((s) => s.id !== id)
  }

  return { entries, loaded, error, doneIds, nextSession, doneToday, load, add, remove }
})
