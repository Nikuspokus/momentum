<script setup lang="ts">
await useAppData()

const weight = useWeightStore()
const { entries, loading, error } = storeToRefs(weight)

const recent = computed(() => [...entries.value].reverse().slice(0, 8))
</script>

<template>
  <div class="page">
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">Chargement…</p>
    <template v-else>
      <FeaturesBibCard />
      <FeaturesTodayChecklist />
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
</style>
