<script setup lang="ts">
const weight = useWeightStore()
const { entries, goal } = storeToRefs(weight)

const W = 340
const H = 190
const PAD = { top: 14, right: 12, bottom: 22, left: 36 }

const scale = computed(() => {
  const ws = entries.value.map((e) => e.weight_kg)
  const target = goal.value?.target_weight_kg ?? Math.min(...ws)
  return { yMin: Math.floor(Math.min(...ws, target) - 1), yMax: Math.ceil(Math.max(...ws) + 1) }
})

const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom
const yOf = (kg: number) => PAD.top + (1 - (kg - scale.value.yMin) / (scale.value.yMax - scale.value.yMin)) * innerH

const points = computed(() => {
  if (!entries.value.length) return []
  const times = entries.value.map((e) => new Date(e.measured_at).getTime())
  const t0 = Math.min(...times)
  const t1 = Math.max(...times)
  return entries.value.map((e, i) => ({
    id: e.id,
    x: t1 === t0 ? PAD.left + innerW / 2 : PAD.left + ((times[i]! - t0) / (t1 - t0)) * innerW,
    y: yOf(e.weight_kg),
  }))
})

const path = computed(() =>
  points.value.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
)
const targetY = computed(() => (goal.value ? yOf(goal.value.target_weight_kg) : null))
</script>

<template>
  <section>
    <h2>Évolution</h2>
    <p v-if="points.length < 2" class="muted">Ajoute au moins deux pesées pour voir ta courbe.</p>
    <svg v-else :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Courbe de poids" class="chart">
      <line
        v-if="targetY !== null" :x1="PAD.left" :x2="W - PAD.right" :y1="targetY" :y2="targetY"
        class="target-line"
      />
      <text v-if="targetY !== null && goal" :x="PAD.left + 2" :y="targetY - 4" class="axis-label">
        objectif {{ goal.target_weight_kg }} kg
      </text>
      <text :x="PAD.left - 6" :y="PAD.top + 4" class="axis-label" text-anchor="end">{{ scale.yMax }}</text>
      <text :x="PAD.left - 6" :y="H - PAD.bottom" class="axis-label" text-anchor="end">{{ scale.yMin }}</text>
      <path :d="path" class="line" />
      <circle v-for="p in points" :key="p.id" :cx="p.x" :cy="p.y" r="3.5" class="dot" />
    </svg>
  </section>
</template>

<style scoped>
.chart { width: 100%; height: auto; }
.line { fill: none; stroke: var(--cobalt); stroke-width: 2.5; stroke-linejoin: round; }
.dot { fill: var(--paper); stroke: var(--cobalt); stroke-width: 2; }
.target-line { stroke: var(--ink); stroke-width: 1.5; stroke-dasharray: 5 4; }
.axis-label { fill: var(--ink-2); font-size: 10px; font-weight: 600; }
</style>
