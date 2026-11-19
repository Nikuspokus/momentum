import type { ReminderPrefs } from '~/types/database'

export type ReminderForm = Pick<ReminderPrefs, 'weigh_hour' | 'workout_hour' | 'workout_days' | 'meals_hour'>

const b64ToBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export const useRemindersStore = defineStore('reminders', () => {
  const supabase = useSupabase()
  const config = useRuntimeConfig()
  const base = `${config.public.supabaseUrl}/functions/v1/momentum-reminders`

  const prefs = ref<ReminderForm>({ weigh_hour: 7, workout_hour: 18, workout_days: [1, 3, 5], meals_hour: null })
  const enabled = ref(false)
  const subscribed = ref(false)
  const loaded = ref(false)
  const busy = ref(false)
  const error = ref<string | null>(null)

  const supported = computed(
    () => import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
  )

  async function registration() {
    const url = `${useRuntimeConfig().app.baseURL}sw.js`
    return navigator.serviceWorker.register(url, { scope: useRuntimeConfig().app.baseURL })
  }

  async function load() {
    if (loaded.value) return
    const { data } = await supabase.from('reminder_prefs').select('*').maybeSingle()
    if (data) {
      enabled.value = data.enabled
      prefs.value = {
        weigh_hour: data.weigh_hour,
        workout_hour: data.workout_hour,
        workout_days: data.workout_days,
        meals_hour: data.meals_hour,
      }
    }
    if (supported.value) {
      const reg = await navigator.serviceWorker.getRegistration(useRuntimeConfig().app.baseURL)
      subscribed.value = !!(await reg?.pushManager.getSubscription())
    }
    loaded.value = true
  }

  async function saveRow(on: boolean) {
    const userId = useAuthStore().user?.id
    if (!userId) throw new Error('Non connecté')
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
    const { error: err } = await supabase.from('reminder_prefs').upsert({
      user_id: userId, enabled: on, ...prefs.value, tz, updated_at: new Date().toISOString(),
    })
    if (err) throw new Error(err.message)
    enabled.value = on
  }

  async function subscribe() {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') throw new Error('Notifications refusées dans le navigateur : autorise-les dans les réglages du site.')
    const reg = await registration()
    await navigator.serviceWorker.ready
    const res = await fetch(`${base}?action=public-key`, { headers: { apikey: String(config.public.supabaseKey) } })
    const { publicKey } = await res.json()
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }))
    const j = sub.toJSON()
    const userId = useAuthStore().user?.id
    const { error: err } = await supabase.from('momentum_push_subscriptions').upsert(
      { user_id: userId, endpoint: sub.endpoint, p256dh: j.keys!.p256dh!, auth: j.keys!.auth! },
      { onConflict: 'endpoint' },
    )
    if (err) throw new Error(err.message)
    subscribed.value = true
  }

  async function enable() {
    busy.value = true
    error.value = null
    try {
      await subscribe()
      await saveRow(true)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }

  async function disable() {
    busy.value = true
    error.value = null
    try {
      const reg = await navigator.serviceWorker.getRegistration(useRuntimeConfig().app.baseURL)
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await supabase.from('momentum_push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      subscribed.value = false
      await saveRow(false)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }

  async function savePrefs() {
    busy.value = true
    error.value = null
    try {
      await saveRow(enabled.value)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }

  async function sendTest() {
    error.value = null
    const { data } = await supabase.auth.getSession()
    const res = await fetch(`${base}?action=test`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session?.access_token}`, apikey: String(config.public.supabaseKey) },
    })
    const out = await res.json()
    if (!res.ok) error.value = out.error ?? 'Échec du test'
    else if (!out.sent) error.value = 'Aucun appareil abonné : réactive les rappels.'
    return !error.value
  }

  return { prefs, enabled, subscribed, loaded, busy, error, supported, load, enable, disable, savePrefs, sendTest }
})
