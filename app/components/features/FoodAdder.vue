<script setup lang="ts">
import type { FoodHit } from '~/composables/useOpenFoodFacts'
import type { MealType } from '~/types/database'

const emit = defineEmits<{ close: [] }>()

const meals = useMealsStore()
const { searchFoods, findByBarcode } = useOpenFoodFacts()

const TYPES: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
  { value: 'snack', label: 'Collation' },
]

function defaultType(): MealType {
  const h = new Date().getHours()
  if (h < 10) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 18) return 'snack'
  return 'dinner'
}

const tab = ref<'search' | 'scan' | 'manual'>('search')
const mealType = ref<MealType>(defaultType())
const query = ref('')
const results = ref<FoodHit[]>([])
const searched = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const selected = ref<FoodHit | null>(null)
const grams = ref('100')
const saving = ref(false)

const manual = reactive({ label: '', kcal: '', protein: '', carbs: '', fat: '', grams: '' })

const gramsNum = computed(() => Number(grams.value.replace(',', '.')))
const portion = computed(() => {
  if (!selected.value || !(gramsNum.value > 0)) return null
  const f = gramsNum.value / 100
  const p = selected.value.per100
  return { kcal: p.kcal * f, protein: p.protein * f, carbs: p.carbs * f, fat: p.fat * f }
})
const manualValid = computed(() => manual.label.trim() !== '' && Number(manual.kcal.replace(',', '.')) >= 0 && manual.kcal !== '')

const round1 = (n: number) => Math.round(n * 10) / 10
const num = (s: string) => Number(s.replace(',', '.')) || 0

async function runSearch() {
  const q = query.value.trim()
  if (q.length < 2) return
  loading.value = true
  error.value = null
  searched.value = true
  try {
    results.value = await searchFoods(q)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Recherche impossible'
  } finally {
    loading.value = false
  }
}

function choose(hit: FoodHit) {
  selected.value = hit
  grams.value = String(Math.round(hit.servingG ?? 100))
}

async function onScanned(code: string) {
  tab.value = 'search'
  loading.value = true
  error.value = null
  try {
    const hit = await findByBarcode(code)
    if (hit) choose(hit)
    else error.value = `Produit ${code} introuvable dans Open Food Facts. Essaie la saisie manuelle.`
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Recherche impossible'
  } finally {
    loading.value = false
  }
}

async function addSelected() {
  if (!selected.value || !portion.value || saving.value) return
  saving.value = true
  const s = selected.value
  const ok = await meals.add({
    meal_type: mealType.value,
    label: s.brand ? `${s.name} (${s.brand})` : s.name,
    barcode: s.code || null,
    grams: gramsNum.value,
    kcal: round1(portion.value.kcal),
    protein_g: round1(portion.value.protein),
    carbs_g: round1(portion.value.carbs),
    fat_g: round1(portion.value.fat),
    source: 'off',
  })
  saving.value = false
  if (ok) emit('close')
  else error.value = meals.error
}

async function addManual() {
  if (!manualValid.value || saving.value) return
  saving.value = true
  const ok = await meals.add({
    meal_type: mealType.value,
    label: manual.label.trim(),
    grams: num(manual.grams) > 0 ? num(manual.grams) : 100,
    kcal: num(manual.kcal),
    protein_g: num(manual.protein),
    carbs_g: num(manual.carbs),
    fat_g: num(manual.fat),
    source: 'manual',
  })
  saving.value = false
  if (ok) emit('close')
  else error.value = meals.error
}
</script>

<template>
  <div class="sheet-backdrop" @click.self="emit('close')">
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Ajouter un aliment">
      <div class="row-between">
        <h2 style="margin: 0">Ajouter un aliment</h2>
        <button class="btn btn-quiet" type="button" aria-label="Fermer" @click="emit('close')">
          <UiIcon name="close" />
        </button>
      </div>

      <div class="field">
        <label for="meal-type">Repas</label>
        <select id="meal-type" v-model="mealType">
          <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>

      <!-- Portion d'un produit choisi -->
      <div v-if="selected" class="stack">
        <div>
          <h3>{{ selected.name }}</h3>
          <p v-if="selected.brand" class="muted small">{{ selected.brand }}</p>
        </div>
        <div class="field">
          <label for="grams">Quantité (g)</label>
          <input id="grams" v-model="grams" type="text" inputmode="decimal">
        </div>
        <p v-if="portion" class="num">
          <strong>{{ Math.round(portion.kcal) }} kcal</strong>
          <span class="muted small"> · protéines {{ fmtNum(portion.protein) }} g · glucides {{ fmtNum(portion.carbs) }} g · lipides {{ fmtNum(portion.fat) }} g</span>
        </p>
        <div class="row">
          <button class="btn btn-line" type="button" @click="selected = null">Retour</button>
          <button class="btn btn-primary grow-btn" type="button" :disabled="!portion || saving" @click="addSelected">Ajouter au repas</button>
        </div>
      </div>

      <template v-else>
        <div class="seg" role="tablist">
          <button type="button" role="tab" :aria-selected="tab === 'search'" :class="{ on: tab === 'search' }" @click="tab = 'search'">Recherche</button>
          <button type="button" role="tab" :aria-selected="tab === 'scan'" :class="{ on: tab === 'scan' }" @click="tab = 'scan'">Code-barres</button>
          <button type="button" role="tab" :aria-selected="tab === 'manual'" :class="{ on: tab === 'manual' }" @click="tab = 'manual'">Manuel</button>
        </div>

        <div v-if="tab === 'search'" class="stack">
          <form class="row" @submit.prevent="runSearch">
            <input v-model="query" type="search" placeholder="Yaourt nature, riz basmati…" aria-label="Rechercher un aliment">
            <button class="btn btn-ink" type="submit" :disabled="query.trim().length < 2 || loading" aria-label="Rechercher">
              <UiIcon name="search" />
            </button>
          </form>
          <p v-if="loading" class="muted">Recherche en cours…</p>
          <p v-if="error" class="error small">{{ error }}</p>
          <p v-else-if="searched && !loading && !results.length" class="muted">
            Aucun résultat. Essaie un autre mot, ou ajoute l'aliment à la main.
          </p>
          <ul class="list">
            <li v-for="hit in results" :key="hit.code + hit.name">
              <button class="hit" type="button" @click="choose(hit)">
                <span class="title">{{ hit.name }}</span>
                <span class="muted small">{{ hit.brand }}<template v-if="hit.brand"> · </template>{{ Math.round(hit.per100.kcal) }} kcal pour 100 g</span>
              </button>
            </li>
          </ul>
          <p class="muted small">Données : Open Food Facts, base collaborative. Vérifie les valeurs sur l'emballage.</p>
        </div>

        <FeaturesBarcodeScanner v-else-if="tab === 'scan'" @detected="onScanned" @close="tab = 'search'" />

        <form v-else class="stack" @submit.prevent="addManual">
          <div class="field">
            <label for="m-label">Nom</label>
            <input id="m-label" v-model="manual.label" type="text" placeholder="Pomme, omelette 2 œufs…">
          </div>
          <div class="field-grid">
            <div class="field">
              <label for="m-kcal">Calories (kcal)</label>
              <input id="m-kcal" v-model="manual.kcal" type="text" inputmode="decimal">
            </div>
            <div class="field">
              <label for="m-grams">Quantité (g)</label>
              <input id="m-grams" v-model="manual.grams" type="text" inputmode="decimal" placeholder="facultatif">
            </div>
            <div class="field">
              <label for="m-p">Protéines (g)</label>
              <input id="m-p" v-model="manual.protein" type="text" inputmode="decimal" placeholder="facultatif">
            </div>
            <div class="field">
              <label for="m-c">Glucides (g)</label>
              <input id="m-c" v-model="manual.carbs" type="text" inputmode="decimal" placeholder="facultatif">
            </div>
            <div class="field">
              <label for="m-f">Lipides (g)</label>
              <input id="m-f" v-model="manual.fat" type="text" inputmode="decimal" placeholder="facultatif">
            </div>
          </div>
          <p v-if="error" class="error small">{{ error }}</p>
          <button class="btn btn-primary btn-block" type="submit" :disabled="!manualValid || saving">Ajouter au repas</button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sheet-backdrop { position: fixed; inset: 0; z-index: 40; background: rgba(14, 27, 44, 0.55); display: flex; align-items: flex-end; justify-content: center; }
.sheet {
  width: 100%; max-width: 520px; max-height: 92dvh; overflow-y: auto;
  background: var(--paper); border-radius: 18px 18px 0 0; padding: 1rem 1rem calc(1.2rem + env(safe-area-inset-bottom));
  display: grid; gap: 0.9rem;
}
.seg { display: grid; grid-template-columns: repeat(3, 1fr); background: var(--fog); border-radius: var(--radius-sm); padding: 3px; }
.seg button { border: 0; background: transparent; padding: 0.6rem 0.2rem; border-radius: 8px; font: inherit; font-weight: 700; color: var(--ink-2); cursor: pointer; }
.seg button.on { background: var(--paper); color: var(--ink); box-shadow: 0 1px 2px rgba(14, 27, 44, 0.15); }
.hit { all: unset; display: grid; gap: 0.1rem; width: 100%; cursor: pointer; padding: 0.15rem 0; }
.hit:focus-visible { outline: 3px solid var(--cobalt); outline-offset: 2px; }
.grow-btn { flex: 1; }
</style>
