import type { Meal, MealInsert } from '~/types/database'

const HISTORY_DAYS = 45

export const useMealsStore = defineStore('meals', () => {
  const supabase = useSupabase()

  const entries = ref<Meal[]>([]) // du plus récent au plus ancien
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const todayEntries = computed(() => {
    const today = localDayKey(new Date())
    return entries.value.filter((m) => localDayKey(m.eaten_at) === today)
  })
  const totals = computed(() =>
    todayEntries.value.reduce(
      (acc, m) => ({
        kcal: acc.kcal + Number(m.kcal),
        protein: acc.protein + Number(m.protein_g),
        carbs: acc.carbs + Number(m.carbs_g),
        fat: acc.fat + Number(m.fat_g),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    ),
  )

  async function load(force = false) {
    if (loaded.value && !force) return
    const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString()
    const { data, error: err } = await supabase
      .from('meals')
      .select('*')
      .gte('eaten_at', since)
      .order('eaten_at', { ascending: false })
    if (err) {
      error.value = err.message
      return
    }
    entries.value = data
    loaded.value = true
  }

  async function add(input: MealInsert) {
    error.value = null
    const { data, error: err } = await supabase.from('meals').insert(input).select().single()
    if (err) {
      error.value = err.message
      return false
    }
    entries.value = [data, ...entries.value].sort((a, b) => b.eaten_at.localeCompare(a.eaten_at))
    return true
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('meals').delete().eq('id', id)
    if (err) {
      error.value = err.message
      return
    }
    entries.value = entries.value.filter((m) => m.id !== id)
  }

  return { entries, loaded, error, todayEntries, totals, load, add, remove }
})
