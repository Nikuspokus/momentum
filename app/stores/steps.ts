import type { DailyStepsRow } from '~/types/database'

export const useStepsStore = defineStore('steps', () => {
  const supabase = useSupabase()
  const entries = ref<DailyStepsRow[]>([])
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const healthError = ref<string | null>(null)
  const syncing = ref(false)
  const lastSync = ref<Date | null>(null)
  const diag = ref<string | null>(null)

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

  // Lit les pas dans Health Connect (APK Android uniquement) et les enregistre par jour
  async function syncFromHealth(days = 7) {
    if (!isNative() || syncing.value) return false
    const userId = useAuthStore().user?.id
    if (!userId) return false
    syncing.value = true
    healthError.value = null
    try {
      const { Health } = await import('@capgo/capacitor-health')
      const avail = await Health.isAvailable()
      if (!avail.available) {
        healthError.value = avail.reason ?? 'Health Connect est indisponible sur cet appareil.'
        return false
      }
      const status = await Health.requestAuthorization({ read: ['steps'] })
      if (!status.readAuthorized.includes('steps')) {
        healthError.value = "Accès aux pas refusé : autorise-le dans Health Connect > Autorisations de l'app."
        return false
      }
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - (days - 1))
      const { samples } = await Health.queryAggregated({
        dataType: 'steps', startDate: start.toISOString(), endDate: new Date().toISOString(), bucket: 'day', aggregation: 'sum',
      })
      const rows = samples
        .map((x) => ({ user_id: userId, day: localDayKey(new Date(x.startDate)), steps: Math.round(x.value), updated_at: new Date().toISOString() }))
        .filter((r) => r.steps >= 0 && r.steps <= 100000)
      if (rows.length) {
        const { error: err } = await supabase.from('daily_steps').upsert(rows)
        if (err) { healthError.value = err.message; return false }
        const keys = new Set(rows.map((r) => r.day))
        entries.value = [...rows, ...entries.value.filter((e) => !keys.has(e.day))]
      }
      // Diagnostic : ce que Health Connect renvoie réellement pour aujourd'hui
      const todayKey = localDayKey(new Date())
      const todayTotal = rows.find((r) => r.day === todayKey)?.steps ?? 0
      const midnight = new Date()
      midnight.setHours(0, 0, 0, 0)
      const raw = await Health.readSamples({
        dataType: 'steps', startDate: midnight.toISOString(), endDate: new Date().toISOString(), limit: 500,
      })
      const sources = [...new Set(raw.samples.map((x) => x.sourceName ?? x.sourceId ?? 'inconnue'))]
      diag.value = sources.length
        ? `Health Connect : ${todayTotal} pas aujourd'hui · sources : ${sources.join(', ')}`
        : "Health Connect ne contient aucun pas aujourd'hui : aucune app n'y enregistre tes pas. Ouvre Health Connect > Données et accès > Pas pour choisir la source."
      lastSync.value = new Date()
      return true
    } catch (e) {
      healthError.value = (e as Error).message
      return false
    } finally {
      syncing.value = false
    }
  }

  return { entries, loaded, error, healthError, diag, syncing, lastSync, today, week, load, setToday, syncFromHealth }
})
