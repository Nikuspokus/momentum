<script setup lang="ts">
import type { RoutePoint } from '~/types/database'
import type { Map as LMap, LayerGroup } from 'leaflet'

// Carte OpenStreetMap (Leaflet) : un ou plusieurs parcours, départ et arrivée marqués
const props = defineProps<{ routes: Array<{ id: string; route: RoutePoint[] }>; selectedId?: string | null }>()

const el = ref<HTMLDivElement | null>(null)
let map: LMap | null = null
let layer: LayerGroup | null = null
let L: typeof import('leaflet') | null = null

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#0b0c0e'

function draw() {
  if (!map || !layer || !L) return
  layer.clearLayers()
  const primary = css('--cobalt')
  const honey = css('--hivis') || '#c8f31d'
  const bounds: Array<[number, number]> = []
  for (const r of props.routes) {
    const pts = r.route.map((p) => [p[0], p[1]] as [number, number])
    if (pts.length < 2) continue
    const selected = !props.selectedId || r.id === props.selectedId
    // Fond blanc sous le trait pour qu'il se lise sur n'importe quel fond de carte
    L.polyline(pts, { color: '#ffffff', weight: selected ? 9 : 6, opacity: selected ? 0.9 : 0.5 }).addTo(layer)
    L.polyline(pts, { color: primary, weight: selected ? 5 : 3, opacity: selected ? 1 : 0.55 }).addTo(layer)
    if (selected) {
      L.circleMarker(pts[0]!, { radius: 7, color: '#0b0c0e', weight: 2, fillColor: honey, fillOpacity: 1 }).addTo(layer)
      L.circleMarker(pts[pts.length - 1]!, { radius: 7, color: '#ffffff', weight: 2, fillColor: '#0b0c0e', fillOpacity: 1 }).addTo(layer)
      bounds.push(...pts)
    } else if (!props.selectedId) bounds.push(...pts)
  }
  if (bounds.length) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 })
}

onMounted(async () => {
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')
  if (!el.value) return
  map = L.map(el.value, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView([50.45, 2.9], 12)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  layer = L.layerGroup().addTo(map)
  draw()
})
watch(() => [props.routes, props.selectedId], draw, { deep: true })
onBeforeUnmount(() => { map?.remove(); map = null })
</script>

<template>
  <div ref="el" class="map" role="region" aria-label="Carte des parcours" />
</template>

<style scoped>
.map { height: 17rem; border-radius: var(--radius-sm); overflow: hidden; background: var(--fog); z-index: 0; }
:root[data-theme='dark'] .map :deep(.leaflet-tile-pane) { filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9); }
.map :deep(.leaflet-control-attribution) { font-size: 10px; }
.map :deep(.leaflet-control-zoom a) { color: #0b0c0e; }
</style>
