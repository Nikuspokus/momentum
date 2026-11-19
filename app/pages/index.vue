<script setup lang="ts">
await useAppData()

const weight = useWeightStore()
const { entries, loading, error } = storeToRefs(weight)

const { user } = storeToRefs(useAuthStore())
const firstName = computed(() => {
  const m = (user.value?.user_metadata ?? {}) as Record<string, string | undefined>
  return (m.given_name ?? m.full_name ?? m.name ?? '').split(' ')[0] ?? ''
})

const recent = computed(() => [...entries.value].reverse().slice(0, 8))
</script>

<template>
  <div class="page">
    <header class="hello">
      <div>
        <p class="muted small">Bonjour</p>
        <h1>{{ firstName || 'toi' }}</h1>
      </div>
      <NuxtLink to="/profil" aria-label="Mon profil"><UiAvatar :size="48" /></NuxtLink>
    </header>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Chargement…</p>
    <template v-else>
      <FeaturesStepsCard />
      <FeaturesTodayChecklist />
      <FeaturesBibCard />
      <FeaturesXpCard />
      <section class="panel"><FeaturesWeightChart /></section>

      <section class="panel">
        <h2>Dernières pesées</h2>
        <p v-if="!recent.length" class="muted">Aucune pesée pour l'instant. Ajoute la première ci-dessus.</p>
        <ul class="list">
          <li v-for="e in recent" :key="e.id">
            <span class="grow">{{ formatDay(e.measured_at) }}</span>
            <strong class="num">{{ fmtNum(e.weight_kg) }} kg</strong>
            <button class="btn btn-quiet" type="button" :aria-label="`Supprimer la pesée du ${formatDay(e.measured_at)}`" @click="weight.remove(e.id)">
              <UiIcon name="close" :size="18" />
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 1.6rem; }
.hello { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.hello h1::after { display: none; }
</style>
