// SPA statique (ssr: false) servie par GitHub Pages sous /momentum/.
// Dans l'APK Android (NUXT_TARGET=android), les fichiers sont servis à la racine.
const BASE = process.env.NUXT_TARGET === 'android' ? '/' : '/momentum/'

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
      script: [
        {
          // Applique le thème avant le premier affichage (évite un flash clair en mode sombre)
          innerHTML:
            "try{var p=localStorage.getItem('theme')||'auto';var d=p==='dark'||(p==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}",
          tagPosition: 'head',
        },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#F6F6F2' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'description', content: 'Suivi du poids, de la course et de la nutrition' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap',
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
