// SPA statique (ssr: false) servie par GitHub Pages sous /momentum/
const BASE = '/momentum/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/main.css'],
  typescript: { strict: true },
  app: {
    baseURL: BASE,
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Momentum',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#2447F5' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'description', content: 'Suivi du poids, de la course et de la nutrition' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap',
        },
        { rel: 'manifest', href: `${BASE}manifest.webmanifest` },
        { rel: 'icon', type: 'image/png', href: `${BASE}icons/icon-192.png` },
        { rel: 'apple-touch-icon', href: `${BASE}icons/icon-192.png` },
      ],
    },
  },
  nitro: {
    preset: 'github_pages',
    // Pages légales générées en vrais fichiers HTML (réponse HTTP 200 sur GitHub Pages)
    prerender: { routes: ['/login', '/privacy', '/terms'] },
  },
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
