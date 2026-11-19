// SPA statique (ssr: false) servie par GitHub Pages sous /momentum/
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/main.css'],
  typescript: { strict: true },
  app: {
    baseURL: '/momentum/',
    head: {
      title: 'Momentum',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f172a' },
      ],
    },
  },
  nitro: { preset: 'github_pages' },
  runtimeConfig: {
    public: {
      // L'URL et la clé « publishable » sont publiques par conception :
      // la sécurité repose sur les règles RLS de Postgres, pas sur le secret de la clé.
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? 'https://msihabrxrtgalveydkpg.supabase.co',
      supabaseKey:
        process.env.NUXT_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_SHFfhK4UXWs4iBxG_MHn8A_Qz9nRRcy',
    },
  },
})
