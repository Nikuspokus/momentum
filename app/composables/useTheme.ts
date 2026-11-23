export type ThemePref = 'auto' | 'light' | 'dark'

const COLORS = { light: '#F6F6F2', dark: '#08090B' } as const

// Préférence de thème : « auto » suit le réglage du téléphone, sinon clair ou sombre forcé.
export function useTheme() {
  const pref = useState<ThemePref>('theme-pref', () => 'auto')

  function resolved(): 'light' | 'dark' {
    if (pref.value !== 'auto') return pref.value
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function apply() {
    const mode = resolved()
    document.documentElement.dataset.theme = mode
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[mode])
  }

  function setPref(next: ThemePref) {
    pref.value = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* stockage indisponible : le choix vaut pour cette session */
    }
    apply()
  }

  function init() {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark' || saved === 'auto') pref.value = saved
    } catch {
      /* ignore */
    }
    apply()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (pref.value === 'auto') apply()
    })
  }

  return { pref, setPref, init }
}
