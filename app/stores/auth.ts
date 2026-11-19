import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabase()

  const user = ref<User | null>(null)
  const ready = ref(false)
  const error = ref<string | null>(null)

  async function init() {
    if (ready.value) return
    // getSession attend la fin de l'initialisation, y compris l'échange du code OAuth dans l'URL
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
    ready.value = true
  }

  async function signInWithGoogle() {
    error.value = null
    const redirectTo = `${window.location.origin}${useRuntimeConfig().app.baseURL}`
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (err) error.value = err.message
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, ready, error, init, signInWithGoogle, signOut }
})
