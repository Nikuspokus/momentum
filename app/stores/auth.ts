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
    if (isNative()) {
      // Google refuse la connexion dans une WebView : on ouvre le navigateur du téléphone (Chrome Custom Tab)
      const { Browser } = await import('@capacitor/browser')
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
      })
      if (err || !data.url) error.value = err?.message ?? 'Connexion impossible'
      else await Browser.open({ url: data.url })
      return
    }
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

  // Retour du navigateur : dev.nikuspokus.momentum://auth?code=... → on échange le code contre une session
  async function completeNativeLogin(url: string) {
    const code = new URL(url).searchParams.get('code')
    const { Browser } = await import('@capacitor/browser')
    await Browser.close().catch(() => {})
    if (!code) return
    const { error: err } = await supabase.auth.exchangeCodeForSession(code)
    if (err) error.value = err.message
    else await navigateTo('/', { replace: true })
  }

  return { user, ready, error, init, signInWithGoogle, signOut, completeNativeLogin }
})
