<script setup lang="ts">
const auth = useAuthStore()
const { error } = storeToRefs(auth)
</script>

<template>
  <main class="login">
    <h1>Momentum</h1>
    <p class="muted">Suivi du poids, de la course et de la nutrition.</p>
    <button class="btn btn-primary" @click="auth.signInWithGoogle()">
      Continuer avec Google
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="muted small">
      <NuxtLink to="/privacy">Confidentialité</NuxtLink> ·
      <NuxtLink to="/terms">Conditions d'utilisation</NuxtLink>
    </p>
  </main>
</template>
