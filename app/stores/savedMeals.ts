import type { SavedMeal } from '~/types/database'

export const useSavedMealsStore = defineStore('savedMeals', () => {
  const supabase = useSupabase()
  const entries = ref<SavedMeal[]>([])
  const loaded = ref(false)
  const error = ref<string | null>(null)

  async function load(force = false) {
    if (loaded.value && !force) return
    const { data, error: err } = await supabase.from('saved_meals').select('*').order('created_at', { ascending: false })
    if (err) { error.value = err.message; return }
    entries.value = data
    loaded.value = true
  }

  const has = (label: string) => entries.value.some((m) => m.label === label)

  async function save(m: { label: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }) {
    error.value = null
    if (has(m.label)) return true
    const { data, error: err } = await supabase.from('saved_meals').insert(m).select().single()
    if (err) { error.value = err.message; return false }
    entries.value = [data, ...entries.value]
    return true
  }

  async function remove(label: string) {
    const target = entries.value.find((m) => m.label === label)
    if (!target) return
    const { error: err } = await supabase.from('saved_meals').delete().eq('id', target.id)
    if (err) { error.value = err.message; return }
    entries.value = entries.value.filter((m) => m.id !== target.id)
  }

  return { entries, loaded, error, has, load, save, remove }
})
