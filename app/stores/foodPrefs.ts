export const useFoodPrefsStore = defineStore('foodPrefs', () => {
  const supabase = useSupabase()

  const have = ref<string[]>([])
  const avoid = ref<string[]>([])
  const loaded = ref(false)
  const error = ref<string | null>(null)

  async function load(force = false) {
    if (loaded.value && !force) return
    const { data, error: err } = await supabase.from('food_prefs').select('*').maybeSingle()
    if (err) {
      error.value = err.message
      return
    }
    have.value = data?.have ?? []
    avoid.value = data?.avoid ?? []
    loaded.value = true
  }

  async function save(nextHave: string[], nextAvoid: string[]) {
    error.value = null
    const userId = useAuthStore().user?.id
    if (!userId) return false
    const { error: err } = await supabase
      .from('food_prefs')
      .upsert({ user_id: userId, have: nextHave, avoid: nextAvoid, updated_at: new Date().toISOString() })
    if (err) {
      error.value = err.message
      return false
    }
    have.value = nextHave
    avoid.value = nextAvoid
    return true
  }

  return { have, avoid, loaded, error, load, save }
})
