export const useActivityStore = defineStore('activity', () => {
  const supabase = useSupabase()
  const slots = ref(new Map<number, number>()) // début de créneau (ms) -> pas
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    const since = new Date(Date.now() - 15 * 86_400_000).toISOString()
    const { data, error } = await supabase.from('activity_slots').select('slot_start,steps').gte('slot_start', since)
    if (error) return
    slots.value = new Map(data.map((r) => [new Date(r.slot_start).getTime(), r.steps]))
    loaded.value = true
  }

  function merge(rows: Map<number, number>) {
    const next = new Map(slots.value)
    for (const [k, v] of rows) next.set(k, v)
    slots.value = next
  }

  const hasData = computed(() => slots.value.size > 0)
  return { slots, loaded, hasData, load, merge }
})
