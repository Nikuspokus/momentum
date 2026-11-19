<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const auth = useAuthStore()
const { error } = storeToRefs(auth)
</script>

<template>
  <main class="login">
    <div class="bib">
      <span class="pin pin-tl" /><span class="pin pin-tr" /><span class="pin pin-bl" /><span class="pin pin-br" />
      <p class="brand">Momentum</p>
      <p class="num tag">N° 92</p>
    </div>
    <h1 class="sr-only">Momentum</h1>
    <p class="lead">Pesée, repas et course à pied au même endroit, pour tenir la distance.</p>
    <button class="btn btn-primary btn-block" type="button" @click="auth.signInWithGoogle()">
      Continuer avec Google
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="muted small">
      <NuxtLink to="/privacy">Confidentialité</NuxtLink> ·
      <NuxtLink to="/terms">Conditions d'utilisation</NuxtLink>
    </p>
  </main>
</template>

<style scoped>
.login { min-height: 100dvh; display: grid; align-content: center; gap: 1.2rem; max-width: 420px; margin: 0 auto; padding: 1.5rem; }
.bib {
  position: relative; background: var(--paper); border: 2px solid var(--ink); border-radius: 8px;
  padding: 2rem 1.2rem 1.4rem; transform: rotate(-1.5deg); box-shadow: 5px 5px 0 var(--ink); text-align: center;
}
.brand { font-size: 2.6rem; font-weight: 900; font-stretch: 125%; color: var(--cobalt); line-height: 1; letter-spacing: -0.02em; }
.tag { font-size: 1.1rem; font-weight: 800; margin-top: 0.5rem; }
.pin { position: absolute; width: 11px; height: 11px; border-radius: 50%; background: var(--fog); border: 1.5px solid var(--ink); }
.pin-tl { top: 8px; left: 8px; } .pin-tr { top: 8px; right: 8px; }
.pin-bl { bottom: 8px; left: 8px; } .pin-br { bottom: 8px; right: 8px; }
.lead { font-size: 1.1rem; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
