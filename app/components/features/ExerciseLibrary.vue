<script setup lang="ts">
import type { DbExercise } from '~/composables/useExerciseDb'

const { loadExercises } = useExerciseDb()

const items = ref<DbExercise[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const started = ref(false)

const query = ref('')
const muscle = ref('')
const equipment = ref('')
const shown = ref(20)
const openId = ref<string | null>(null)

async function start() {
  started.value = true
  loading.value = true
  error.value = null
  try {
    items.value = await loadExercises()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Chargement impossible'
    started.value = false
  } finally {
    loading.value = false
  }
}

const muscles = computed(() => [...new Set(items.value.flatMap((e) => e.primaryMuscles))].sort())
const equipments = computed(() => [...new Set(items.value.map((e) => e.equipment).filter((e): e is string => !!e))].sort())

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.value.filter(
    (e) =>
      (!q || e.name.toLowerCase().includes(q)) &&
      (!muscle.value || e.primaryMuscles.includes(muscle.value)) &&
      (!equipment.value || e.equipment === equipment.value),
  )
})
const visible = computed(() => filtered.value.slice(0, shown.value))

watch([query, muscle, equipment], () => { shown.value = 20; openId.value = null })

function toggle(id: string) {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <section class="panel stack">
    <h2 style="margin: 0">Bibliothèque d'exercices</h2>

    <template v-if="!started">
      <p class="muted">Plus de 800 exercices avec images, à explorer par muscle ou par matériel.</p>
      <button class="btn btn-line btn-block" type="button" @click="start">Explorer les exercices</button>
      <p v-if="error" class="error small">{{ error }}</p>
    </template>

    <p v-else-if="loading" class="muted">Chargement des exercices…</p>

    <template v-else>
      <input v-model="query" type="search" placeholder="Rechercher (en anglais, ex. squat)" aria-label="Rechercher un exercice">
      <div class="field-grid">
        <select v-model="muscle" aria-label="Muscle">
          <option value="">Tous les muscles</option>
          <option v-for="m in muscles" :key="m" :value="m">{{ muscleFr(m) }}</option>
        </select>
        <select v-model="equipment" aria-label="Matériel">
          <option value="">Tout matériel</option>
          <option v-for="e in equipments" :key="e" :value="e">{{ equipmentFr(e) }}</option>
        </select>
      </div>
      <p class="muted small num">{{ filtered.length }} exercices</p>

      <ul class="list">
        <li v-for="ex in visible" :key="ex.id" class="item">
          <button class="head" type="button" :aria-expanded="openId === ex.id" @click="toggle(ex.id)">
            <span class="grow">
              <span class="title">{{ ex.name }}</span>
              <span class="muted small">{{ ex.primaryMuscles.map(muscleFr).join(', ') }} · {{ equipmentFr(ex.equipment) }}</span>
            </span>
          </button>
          <div v-if="openId === ex.id" class="detail stack">
            <FeaturesExerciseImage :frames="ex.images" :alt="ex.name" />
            <p class="small muted">
              Niveau {{ LEVEL_FR[ex.level] ?? ex.level }}<template v-if="ex.secondaryMuscles.length"> · aussi : {{ ex.secondaryMuscles.map(muscleFr).join(', ') }}</template>
            </p>
            <ol class="steps small">
              <li v-for="(line, i) in ex.instructions" :key="i">{{ line }}</li>
            </ol>
            <p class="muted small">Consignes en anglais (source : free-exercise-db).</p>
          </div>
        </li>
      </ul>
      <button v-if="filtered.length > shown" class="btn btn-line btn-block" type="button" @click="shown += 20">Voir plus</button>
      <p class="muted small">Données : free-exercise-db, domaine public.</p>
    </template>
  </section>
</template>

<style scoped>
.item { display: block !important; }
.head { all: unset; display: flex; width: 100%; cursor: pointer; padding: 0.15rem 0; }
.head:focus-visible { outline: 3px solid var(--cobalt); outline-offset: 2px; }
.head .grow { display: grid; gap: 0.1rem; }
.detail { margin-top: 0.7rem; }
.steps { margin: 0; padding-left: 1.2rem; display: grid; gap: 0.3rem; }
</style>
