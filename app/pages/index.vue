<script setup lang="ts">
await useAppData()

const weight = useWeightStore()
const { entries, loading, error } = storeToRefs(weight)

const { user } = storeToRefs(useAuthStore())
const firstName = computed(() => {
  const m = (user.value?.user_metadata ?? {}) as Record<string, string | undefined>
  return (m.given_name ?? m.full_name ?? m.name ?? '').split(' ')[0] ?? ''
})

const goalDays = computed(() => daysUntil(OBJECTIVE.date))
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
      <NuxtLink to="/objectif" class="goal">
        <span class="goal-n num">{{ goalDays > 0 ? `J-${goalDays}` : 'Objectif' }}</span>
        <span class="goal-t"><strong>Objectif 10 km</strong><span class="small">{{ OBJECTIVE.name }}, {{ OBJECTIVE.city }} · plan, scénarios de poids</span></span>
        <UiIcon name="chevron-right" :size="20" />
      </NuxtLink>
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
.goal {
  display: flex; align-items: center; gap: 0.9rem; padding: 0.8rem 1rem; border-radius: var(--radius); text-decoration: none; color: #10140a;
  background-color: #c8f31d; background-image: radial-gradient(circle, rgb(16 20 10 / 0.16) 1px, transparent 1.4px); background-size: 14px 14px;
}
.goal-n { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; min-width: 4.2rem; }
.goal-t { display: grid; flex: 1; min-width: 0; }
</style>
