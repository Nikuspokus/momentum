import type { CapacitorConfig } from '@capacitor/cli'

// Enveloppe Android : embarque le build web (nuxt generate) dans un APK installable
const config: CapacitorConfig = {
  appId: 'dev.nikuspokus.momentum',
  appName: 'Momentum',
  webDir: '.output/public',
  android: { allowMixedContent: false },
}

export default config
