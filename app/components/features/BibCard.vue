<script setup lang="ts">
const weight = useWeightStore()
const { goal, currentKg, lostKg, remainingKg, progressPct, bmi, weeklyTrendKg, etaWeeks, entries } =
  storeToRefs(weight)

const trendLabel = computed(() => {
  if (!weeklyTrendKg.value) return 'Ajoute quelques pesées pour voir ta tendance'
  const sign = weeklyTrendKg.value > 0 ? '+' : '−'
  return `${sign}${fmtNum(Math.abs(weeklyTrendKg.value), 2)} kg par semaine`
})

const dayCount = computed(() => {
  const first = entries.value[0]
  if (!first) return 1
  return Math.floor((Date.now() - new Date(first.measured_at).getTime()) / 86_400_000) + 1
})
</script>

<template>
  <section v-if="goal" class="stack" aria-label="Poids actuel">
    <div class="bib">
      <span class="pin pin-tl" /><span class="pin pin-tr" /><span class="pin pin-bl" /><span class="pin pin-br" />
      <div class="bib-top">
        <span class="bib-brand">Momentum</span>
        <span class="bib-day">Jour {{ dayCount }}</span>
      </div>
      <p class="bib-number num">
        {{ fmtNum(currentKg) }}<span class="bib-unit">kg</span>
      </p>
      <div class="lane" role="progressbar" :aria-valuenow="Math.round(progressPct)" aria-valuemin="0" aria-valuemax="100">
        <div class="lane-fill" :style="{ width: `${progressPct}%` }" />
      </div>
      <div class="lane-labels num">
        <span>{{ fmtNum(goal.start_weight_kg, 0) }} kg</span>
        <span>{{ Math.round(progressPct) }} %</span>
        <span>{{ fmtNum(goal.target_weight_kg, 0) }} kg</span>
      </div>
    </div>

    <dl class="stats num">
      <div>
        <dt>Perdu</dt>
        <dd>{{ fmtNum(Math.max(lostKg, 0)) }} kg</dd>
      </div>
      <div>
        <dt>Restant</dt>
        <dd>{{ fmtNum(remainingKg) }} kg</dd>
      </div>
      <div>
        <dt>IMC</dt>
        <dd>{{ fmtNum(bmi) }}</dd>
      </div>
    </dl>
    <p class="muted small">
      {{ trendLabel }}<template v-if="etaWeeks"> · objectif dans environ {{ etaWeeks }} semaines à ce rythme</template>
    </p>
  </section>
</template>

<style scoped>
.bib {
  position: relative;
  background: var(--bib);
  color: var(--bib-ink);
  border: 2px solid var(--bib-ink);
  border-radius: 8px;
  padding: 1rem 1.3rem 0.9rem;
  transform: rotate(-0.5deg);
  box-shadow: 5px 5px 0 var(--cobalt);
}
.pin {
  position: absolute; width: 11px; height: 11px; border-radius: 50%;
  background: var(--fog); border: 1.5px solid var(--bib-ink);
}
.pin-tl { top: 8px; left: 8px; }
.pin-tr { top: 8px; right: 8px; }
.pin-bl { bottom: 8px; left: 8px; }
.pin-br { bottom: 8px; right: 8px; }
.bib-top { display: flex; justify-content: space-between; align-items: baseline; margin: 0.2rem 0.6rem 0; }
.bib-brand { font-weight: 800; font-stretch: 125%; font-size: 0.9rem; color: var(--bib-accent); }
.bib-day { font-weight: 600; font-size: 0.85rem; color: #3d5a4f; }
.bib-number {
  font-size: clamp(4.6rem, 24vw, 6.4rem);
  font-weight: 900; font-stretch: 125%; line-height: 0.95;
  letter-spacing: -0.02em; margin: 0.3rem 0 0.7rem; text-align: center;
}
.bib-unit { font-size: 0.28em; font-weight: 700; margin-left: 0.2em; letter-spacing: 0; color: #3d5a4f; }
.lane { height: 14px; border: 2px solid var(--bib-ink); border-radius: 999px; background: #d9d3c1; overflow: hidden; }
.lane-fill { height: 100%; background: var(--cobalt); border-right: 2px solid var(--bib-ink); transition: width 0.5s ease; }
.lane-labels { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-top: 0.3rem; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin: 0.4rem 0 0; }
.stats dt { color: var(--ink-2); font-size: 0.85rem; }
.stats dd { margin: 0; font-weight: 800; font-stretch: 110%; font-size: 1.25rem; }
</style>
