// Pages accessibles sans connexion (Google exige des pages légales publiques)
const PUBLIC_PATHS = ['/login', '/privacy', '/terms']

// Middleware global : redirige vers /login tant que l'utilisateur n'est pas connecté
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  // Après le retour de Google, on retire ?code=... de l'adresse
  if (to.query.code) return navigateTo({ path: to.path, query: {} }, { replace: true })

  const path = to.path.replace(/\/$/, '') || '/'
  if (!auth.user && !PUBLIC_PATHS.includes(path)) return navigateTo('/login')
  if (auth.user && path === '/login') return navigateTo('/')
})
