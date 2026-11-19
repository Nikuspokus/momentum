// Écoute le retour de connexion Google (lien profond) et la reprise de l'app au premier plan
export default defineNuxtPlugin(async () => {
  if (!isNative()) return
  const { App } = await import('@capacitor/app')
  const auth = useAuthStore()

  await App.addListener('appUrlOpen', ({ url }) => {
    if (url.startsWith(NATIVE_REDIRECT)) auth.completeNativeLogin(url)
  })

  // À chaque retour dans l'app, on resynchronise les pas depuis Health Connect
  await App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && auth.user) useStepsStore().syncFromHealth()
  })
})
