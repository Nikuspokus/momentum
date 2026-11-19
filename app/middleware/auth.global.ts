// Middleware global : redirige vers /login tant que l'utilisateur n'est pas connecté
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (!auth.user && to.path !== '/login') return navigateTo('/login')
  if (auth.user && to.path === '/login') return navigateTo('/')
})
