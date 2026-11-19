<script setup lang="ts">
const auth = useAuthStore()
const weight = useWeightStore()
const { user } = storeToRefs(auth)
const { entries, loading, error } = storeToRefs(weight)

await useAsyncData('weight', async () => {
  await weight.load()
  return true
})

const recent = computed(() => [...entries.value].reverse().slice(0, 10))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <h1>Momentum</h1>
      <button class="btn btn-ghost" @click="auth.signOut()">
        Déconnexion
      </button>
    </header>
    <p class="muted small">{{ user?.email }}</p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Chargement…</p>

    <template v-else>
      <FeaturesProgressSummary />
      <FeaturesWeightForm />
      <FeaturesWeightChart />

      <section class="card">
        <h2>Dernières pesées</h2>
        <p v-if="!recent.length" class="muted">Aucune pesée pour l'instant.</p>
        <ul class="history">
          <li v-for="e in recent" :key="e.id">
            <span>{{ formatDate(e.measured_at) }}</span>
            <strong>{{ e.weight_kg.toFixed(1) }} kg</strong>
            <button class="btn btn-ghost small" @click="weight.remove(e.id)">
              Supprimer
            </button>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>
