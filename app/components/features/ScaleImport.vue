<script setup lang="ts">
// Import d'un export CSV d'openScale
const weight = useWeightStore()

const input = ref<HTMLInputElement | null>(null)
const rows = ref<ScaleRow[]>([])
const skipped = ref(0)
const fileName = ref('')
const busy = ref(false)
const result = ref<string | null>(null)
const error = ref<string | null>(null)

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  result.value = null
  error.value = null
  fileName.value = file.name
  const parsed = parseOpenScaleCsv(await file.text())
  rows.value = parsed.rows
  skipped.value = parsed.skipped
  if (!parsed.rows.length) error.value = "Aucune mesure lisible. Vérifie que c'est bien l'export CSV d'openScale (colonnes dateTime et weight)."
}

const range = computed(() => {
  if (!rows.value.length) return null
  const t = rows.value.map((r) => r.measuredAt.getTime())
  return { from: new Date(Math.min(...t)), to: new Date(Math.max(...t)) }
})

async function run() {
  busy.value = true
  error.value = null
  const res = await weight.importMany(rows.value)
  busy.value = false
  if (!res) {
    error.value = weight.error
    return
  }
  result.value = `${res.added} mesures ajoutées${res.duplicates ? `, ${res.duplicates} déjà présentes` : ''}.`
  rows.value = []
  if (input.value) input.value.value = ''
}
</script>

<template>
  <div class="stack">
    <p class="muted small">
      Dans openScale : menu, « Exporter les données » (CSV), puis choisis le fichier ici. Les mesures déjà présentes sont ignorées.
    </p>
    <input ref="input" type="file" accept=".csv,text/csv,text/plain" aria-label="Fichier CSV openScale" @change="onFile">
    <template v-if="rows.length && range">
      <p class="num">
        <strong>{{ rows.length }} mesures</strong>
        <span class="muted small"> du {{ formatDay(range.from.toISOString()) }} au {{ formatDay(range.to.toISOString()) }}<template v-if="skipped"> · {{ skipped }} lignes ignorées</template></span>
      </p>
      <button class="btn btn-primary btn-block" type="button" :disabled="busy" @click="run">Importer {{ fileName }}</button>
    </template>
    <p v-if="result" class="strong">{{ result }}</p>
    <p v-if="error" class="error small">{{ error }}</p>
  </div>
</template>

<style scoped>
.strong { font-weight: 700; }
input[type='file'] { padding: 0.6rem; }
</style>
