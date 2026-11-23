<script setup lang="ts">
// Poids : volontairement en second plan, sous la progression de pas
const weight = useWeightStore()
const { goal, currentKg, lostKg, remainingKg, progressPct, bmi, weeklyTrendKg, etaWeeks } = storeToRefs(weight)

const trendLabel = computed(() => {
  if (!weeklyTrendKg.value) return 'Ajoute quelques pesées pour voir ta tendance'
  const sign = weeklyTrendKg.value > 0 ? '+' : '−'
  return `${sign}${fmtNum(Math.abs(weeklyTrendKg.value), 2)} kg par semaine`
})
</script>

<template>
  <section v-if="goal" class="panel stack" aria-label="Poids actuel">
    <div class="head">
      <p class="now num"><span class="label">Poids</span> <strong>{{ fmtNum(currentKg) }}</strong> kg</p>
      <p class="muted small num">objectif {{ fmtNum(goal.target_weight_kg, 0) }} kg</p>
    </div>
    <div class="lane" role="progressbar" :aria-valuenow="Math.round(progressPct)" aria-valuemin="0" aria-valuemax="100">
      <div class="lane-fill" :style="{ width: `${progressPct}%` }" />
    </div>
    <dl class="stats num">
      <div><dt>Perdu</dt><dd>{{ fmtNum(Math.max(lostKg, 0)) }} kg</dd></div>
      <div><dt>Restant</dt><dd>{{ fmtNum(remainingKg) }} kg</dd></div>
      <div><dt>IMC</dt><dd>{{ fmtNum(bmi) }}</dd></div>
    </dl>
    <p class="muted small">
      {{ trendLabel }}<template v-if="etaWeeks"> · objectif dans environ {{ etaWeeks }} semaines à ce rythme</template>
    </p>
  </section>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
.now { margin: 0; font-size: 1.1rem; }
.now .label { color: var(--ink-2); font-size: 0.9rem; margin-right: 0.3rem; }
.now strong { font-size: 1.6rem; font-weight: 800; }
.lane { height: 8px; border-radius: 999px; background: var(--line); overflow: hidden; }
.lane-fill { height: 100%; background: var(--cobalt); border-radius: 999px; transition: width 0.5s ease; }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin: 0; }
.stats dt { color: var(--ink-2); font-size: 0.85rem; }
.stats dd { margin: 0; font-weight: 700; font-size: 1.05rem; }
</style>
