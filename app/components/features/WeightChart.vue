<script setup lang="ts">
const weight = useWeightStore()
const { entries, goal } = storeToRefs(weight)

const W = 340
const H = 190
const PAD = { top: 14, right: 12, bottom: 22, left: 36 }

const points = computed(() => {
  if (!entries.value.length) return []
  const times = entries.value.map((e) => new Date(e.measured_at).getTime())
  const t0 = Math.min(...times)
  const t1 = Math.max(...times)
  const target = goal.value?.target_weight_kg ?? 0
  const ws = entries.value.map((e) => e.weight_kg)
  const yMin = Math.floor(Math.min(...ws, target) - 1)
  const yMax = Math.ceil(Math.max(...ws) + 1)
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  return entries.value.map((e, i) => {
    const t = times[i]!
    const x = t1 === t0 ? PAD.left + innerW / 2 : PAD.left + ((t - t0) / (t1 - t0)) * innerW
    const y = PAD.top + (1 - (e.weight_kg - yMin) / (yMax - yMin)) * innerH
    return { id: e.id, x, y, kg: e.weight_kg, yMin, yMax }
  })
})

const scale = computed(() => {
  const p = points.value[0]
  return p ? { yMin: p.yMin, yMax: p.yMax } : { yMin: 0, yMax: 1 }
})

const path = computed(() => points.value.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))

const targetY = computed(() => {
  if (!goal.value) return null
  const { yMin, yMax } = scale.value
  const innerH = H - PAD.top - PAD.bottom
  const y = PAD.top + (1 - (goal.value.target_weight_kg - yMin) / (yMax - yMin)) * innerH
  return y
})
</script>

<template>
  <section class="card">
    <h2>Évolution</h2>
    <p v-if="points.length < 2" class="muted">
      Ajoute au moins deux pesées pour voir la courbe.
    </p>
    <svg v-else :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Courbe de poids" class="chart">
      <line
        v-if="targetY !== null"
        :x1="PAD.left" :x2="W - PAD.right" :y1="targetY" :y2="targetY"
        class="target-line"
      />
      <text v-if="targetY !== null && goal" :x="PAD.left + 2" :y="targetY - 4" class="axis-label">
        objectif {{ goal.target_weight_kg }}
      </text>
      <text :x="PAD.left - 6" :y="PAD.top + 4" class="axis-label" text-anchor="end">{{ scale.yMax }}</text>
      <text :x="PAD.left - 6" :y="H - PAD.bottom" class="axis-label" text-anchor="end">{{ scale.yMin }}</text>
      <path :d="path" class="line" />
      <circle v-for="p in points" :key="p.id" :cx="p.x" :cy="p.y" r="3" class="dot" />
    </svg>
  </section>
</template>
