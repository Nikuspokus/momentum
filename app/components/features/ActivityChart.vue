<script setup lang="ts">
// Graphique en barres : pas par créneau (30 min ou 1 h). Une seule série : pas de légende, le titre de la carte la nomme.
const props = defineProps<{ bars: Bar[] }>()

const W = 340, H = 190
const PAD = { l: 34, r: 6, t: 10, b: 24 }
const innerW = W - PAD.l - PAD.r
const innerH = H - PAD.t - PAD.b

const n = computed(() => props.bars.length)
const band = computed(() => innerW / n.value)
const barW = computed(() => Math.min(10, Math.max(3, band.value * 0.62)))

const niceMax = computed(() => {
  const m = Math.max(1, ...props.bars.map((b) => b.steps))
  return [100, 200, 250, 400, 500, 800, 1000, 1500, 2000, 3000, 4000, 6000].find((v) => v >= m) ?? Math.ceil(m / 1000) * 1000
})
const ticks = computed(() => [0, niceMax.value / 2, niceMax.value])
const y = (v: number) => PAD.t + innerH - (v / niceMax.value) * innerH
const xBand = (i: number) => PAD.l + i * band.value

// Barre à sommet arrondi (4 px max), ancrée sur la ligne de base
function barPath(i: number, steps: number): string {
  const w = barW.value
  const x = xBand(i) + (band.value - w) / 2
  const h = Math.max(0, y(0) - y(steps))
  const r = Math.min(4, w / 2, h)
  const top = y(0) - h
  return `M${x},${y(0)} V${top + r} a${r},${r} 0 0 1 ${r},${-r} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${y(0)} Z`
}

const hourEvery = computed(() => (n.value === 24 ? 3 : 6)) // une graduation toutes les 3 h
const xLabels = computed(() =>
  props.bars.map((b, i) => ({ i, h: new Date(b.startMs).getHours(), m: new Date(b.startMs).getMinutes() }))
    .filter((l) => l.m === 0 && l.h % 3 === 0)
    .map((l) => ({ x: xBand(l.i) + band.value / 2, text: `${l.h} h` })),
)

const active = ref<number | null>(null)
const readout = computed(() => {
  const b = active.value === null ? null : props.bars[active.value]
  return b ? `${b.label} · ${b.steps.toLocaleString('fr-FR')} pas` : 'Touche une barre pour voir le détail'
})
</script>

<template>
  <div class="chart">
    <p class="readout num" aria-live="polite">{{ readout }}</p>
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Pas par créneau sur la journée" @pointerleave="active = null">
      <g class="grid">
        <template v-for="t in ticks" :key="t">
          <line :x1="PAD.l" :x2="W - PAD.r" :y1="y(t)" :y2="y(t)" :class="{ base: t === 0 }" />
          <text :x="PAD.l - 6" :y="y(t) + 3.5" text-anchor="end">{{ Math.round(t).toLocaleString('fr-FR') }}</text>
        </template>
      </g>
      <g>
        <template v-for="(b, i) in bars" :key="b.startMs">
          <path v-if="b.steps > 0" :d="barPath(i, b.steps)" class="bar" :class="{ dim: active !== null && active !== i, on: active === i }" />
          <rect v-else-if="!b.future" :x="xBand(i) + (band - barW) / 2" :y="y(0) - 2" :width="barW" height="2" rx="1" class="stub" />
        </template>
      </g>
      <g class="xl">
        <text v-for="l in xLabels" :key="l.text" :x="l.x" :y="H - 6" text-anchor="middle">{{ l.text }}</text>
      </g>
      <!-- Zones de contact plus larges que les barres -->
      <rect
        v-for="(b, i) in bars" :key="`hit${b.startMs}`" :x="xBand(i)" :y="PAD.t" :width="band" :height="innerH + 4"
        fill="transparent" @pointerdown="active = i" @pointerenter="active = i"
      />
    </svg>

    <details class="table-view">
      <summary>Voir les valeurs en tableau</summary>
      <table>
        <thead><tr><th scope="col">Créneau</th><th scope="col">Pas</th></tr></thead>
        <tbody>
          <tr v-for="b in bars.filter((x) => x.steps > 0)" :key="b.startMs"><td>{{ b.label }}</td><td class="num">{{ b.steps.toLocaleString('fr-FR') }}</td></tr>
        </tbody>
      </table>
    </details>
  </div>
</template>

<style scoped>
.chart { display: grid; gap: 0.5rem; }
.readout { margin: 0; min-height: 1.4rem; font-weight: 600; font-size: 0.95rem; }
svg { width: 100%; height: auto; touch-action: pan-y; }
.grid line { stroke: var(--line); stroke-width: 1; }
.grid line.base { stroke: var(--ink-2); stroke-opacity: 0.45; }
.grid text, .xl text { fill: var(--ink-2); font-size: 10px; }
.bar { fill: var(--cobalt); transition: opacity 0.12s; }
.bar.dim { opacity: 0.4; }
.stub { fill: var(--line); }
.table-view summary { cursor: pointer; color: var(--cobalt); font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; }
.table-view table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.table-view th, .table-view td { text-align: left; padding: 0.3rem 0; border-bottom: 1px solid var(--line); }
.table-view td.num, .table-view th:last-child { text-align: right; }
</style>
