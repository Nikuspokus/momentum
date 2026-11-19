<script setup lang="ts">
const weight = useWeightStore()
const { goal, currentKg, lostKg, remainingKg, progressPct, bmi, weeklyTrendKg, etaWeeks } =
  storeToRefs(weight)

const trendLabel = computed(() => {
  if (weeklyTrendKg.value === 0) return 'Pas encore assez de données'
  const sign = weeklyTrendKg.value > 0 ? '+' : ''
  return `${sign}${weeklyTrendKg.value.toFixed(2)} kg / semaine`
})
</script>

<template>
  <section v-if="goal" class="card">
    <div class="hero">
      <span class="hero-value">{{ currentKg.toFixed(1) }}</span>
      <span class="hero-unit">kg</span>
    </div>

    <div class="bar" role="progressbar" :aria-valuenow="Math.round(progressPct)" aria-valuemin="0" aria-valuemax="100">
      <div class="bar-fill" :style="{ width: `${progressPct}%` }" />
    </div>
    <p class="muted small">
      {{ goal.start_weight_kg }} kg → {{ goal.target_weight_kg }} kg · {{ Math.round(progressPct) }} %
    </p>

    <dl class="stats">
      <div>
        <dt>Perdu</dt>
        <dd>{{ lostKg.toFixed(1) }} kg</dd>
      </div>
      <div>
        <dt>Restant</dt>
        <dd>{{ remainingKg.toFixed(1) }} kg</dd>
      </div>
      <div>
        <dt>IMC</dt>
        <dd>{{ bmi.toFixed(1) }}</dd>
      </div>
      <div>
        <dt>Tendance</dt>
        <dd class="small">{{ trendLabel }}</dd>
      </div>
    </dl>
    <p v-if="etaWeeks" class="muted small">
      À ce rythme : environ {{ etaWeeks }} semaines pour atteindre l'objectif.
    </p>
  </section>
</template>
