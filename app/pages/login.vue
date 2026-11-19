<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const auth = useAuthStore()
const { error } = storeToRefs(auth)
</script>

<template>
  <main class="login">
    <UiLogo class="logo" :size="144" />
    <h1 class="brand">Momentum</h1>
    <p class="lead">Pesée, repas et course à pied au même endroit, pour tenir la distance.</p>
    <button class="btn btn-primary btn-block" type="button" @click="auth.signInWithGoogle()">
      Continuer avec Google
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="muted small" style="text-align: center">
      <NuxtLink to="/privacy">Confidentialité</NuxtLink> ·
      <NuxtLink to="/terms">Conditions d'utilisation</NuxtLink>
    </p>
  </main>
</template>

<style scoped>
.login { min-height: 100dvh; display: grid; align-content: center; gap: 1.2rem; max-width: 420px; margin: 0 auto; padding: 1.5rem; }
.logo { justify-self: center; border-radius: 32px; box-shadow: 0 14px 34px rgb(23 69 54 / 0.35); }
.brand { text-align: center; font-size: 1.35rem; font-weight: 800; font-stretch: 110%; letter-spacing: -0.01em; margin: 0; }
.lead { font-size: 1.05rem; text-align: center; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
