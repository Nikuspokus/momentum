<script setup lang="ts">
import type { RoutePoint } from '~/types/database'

// Tracé GPS dessiné en SVG (projection simple, suffisante à l'échelle d'une sortie)
const props = withDefaults(defineProps<{ route: RoutePoint[]; height?: number }>(), { height: 160 })

const W = 320
const PAD = 14

const shape = computed(() => {
  const pts = props.route
  if (pts.length < 2) return null
  const lat0 = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const kx = Math.cos((lat0 * Math.PI) / 180)
  const xs = pts.map((p) => p[1] * kx)
  const ys = pts.map((p) => -p[0])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const spanX = Math.max(maxX - minX, 1e-6)
  const spanY = Math.max(maxY - minY, 1e-6)
  const scale = Math.min((W - 2 * PAD) / spanX, (props.height - 2 * PAD) / spanY)
  const offX = (W - spanX * scale) / 2
  const offY = (props.height - spanY * scale) / 2
  const mapped = pts.map((_, i) => ({ x: offX + (xs[i]! - minX) * scale, y: offY + (ys[i]! - minY) * scale }))
  return {
    d: mapped.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    start: mapped[0]!,
    end: mapped[mapped.length - 1]!,
  }
})
</script>

<template>
  <svg
    v-if="shape" :viewBox="`0 0 ${W} ${height}`" class="map" role="img" aria-label="Tracé du parcours"
  >
    <path :d="shape.d" class="trace-under" />
    <path :d="shape.d" class="trace" />
    <circle :cx="shape.start.x" :cy="shape.start.y" r="5" class="start" />
    <circle :cx="shape.end.x" :cy="shape.end.y" r="5" class="end" />
  </svg>
</template>

<style scoped>
.map { width: 100%; height: auto; background: var(--fog); border-radius: var(--radius-sm); }
.trace-under { fill: none; stroke: var(--paper); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
.trace { fill: none; stroke: var(--cobalt); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.start { fill: var(--hivis); stroke: var(--ink); stroke-width: 2; }
.end { fill: var(--ink); stroke: var(--paper); stroke-width: 2; }
</style>
