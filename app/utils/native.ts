import { Capacitor } from '@capacitor/core'

// Vrai uniquement dans l'APK Android (Capacitor), faux dans le navigateur
export const isNative = (): boolean => import.meta.client && Capacitor.isNativePlatform()

// Adresse de retour après connexion Google dans l'APK : doit figurer dans les « Redirect URLs » de Supabase
export const NATIVE_REDIRECT = 'dev.nikuspokus.momentum://auth'
