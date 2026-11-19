<script setup lang="ts">
import type { FoodHit } from '~/composables/useOpenFoodFacts'
import type { MealType } from '~/types/database'

const emit = defineEmits<{ close: [] }>()

const meals = useMealsStore()
const savedStore = useSavedMealsStore()
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

type Quick = { label: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number; count: number }

const hasHistory = meals.entries.length > 0 || savedStore.entries.length > 0
const tab = ref<'recent' | 'search' | 'scan' | 'manual'>(hasHistory ? 'recent' : 'search')
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
const keepManual = ref(false)

// Mes plats (enregistrés) puis aliments les plus fréquents des 45 derniers jours
const savedQuick = computed<Quick[]>(() =>
  savedStore.entries.map((m) => ({
    label: m.label, grams: Number(m.grams), kcal: Number(m.kcal),
    protein_g: Number(m.protein_g), carbs_g: Number(m.carbs_g), fat_g: Number(m.fat_g), count: 0,
  })),
)
const recentQuick = computed<Quick[]>(() => {
  const map = new Map<string, Quick>()
  for (const m of meals.entries) {
    const q = map.get(m.label)
    if (q) q.count++
    else map.set(m.label, {
      label: m.label, grams: Number(m.grams), kcal: Number(m.kcal),
      protein_g: Number(m.protein_g), carbs_g: Number(m.carbs_g), fat_g: Number(m.fat_g), count: 1,
    })
  }
  return [...map.values()].filter((q) => !savedStore.has(q.label)).sort((a, b) => b.count - a.count).slice(0, 15)
})

const factor = ref(1)
const FACTORS = [0.5, 1, 1.5, 2]
const addedCount = ref(0)
const justAdded = ref<string | null>(null)
const typeLabel = computed(() => TYPES.find((t) => t.value === mealType.value)?.label.toLowerCase() ?? '')

async function addQuick(q: Quick) {
  if (saving.value) return
  saving.value = true
  error.value = null
  const f = factor.value
  const ok = await meals.add({
    meal_type: mealType.value,
    label: q.label,
    grams: Math.round(q.grams * f),
    kcal: Math.round(q.kcal * f * 10) / 10,
    protein_g: Math.round(q.protein_g * f * 10) / 10,
    carbs_g: Math.round(q.carbs_g * f * 10) / 10,
    fat_g: Math.round(q.fat_g * f * 10) / 10,
    source: 'manual',
  })
  saving.value = false
  if (ok) { addedCount.value++; justAdded.value = q.label }
  else error.value = meals.error
}

async function toggleSaved(q: Quick) {
  if (savedStore.has(q.label)) await savedStore.remove(q.label)
  else await savedStore.save({ label: q.label, grams: q.grams, kcal: q.kcal, protein_g: q.protein_g, carbs_g: q.carbs_g, fat_g: q.fat_g })
}

// Raccourcis de quantité : portion indiquée sur l'emballage, paquet entier, moitié
const quantityChips = computed(() => {
  const h = selected.value
  if (!h) return []
  const chips: Array<{ label: string; g: number }> = []
  if (h.servingG) chips.push({ label: `1 portion · ${Math.round(h.servingG)} g`, g: h.servingG })
  if (h.packG) {
    chips.push({ label: `Tout le paquet · ${Math.round(h.packG)} g`, g: h.packG })
    chips.push({ label: `½ paquet · ${Math.round(h.packG / 2)} g`, g: h.packG / 2 })
  }
  chips.push({ label: '100 g', g: 100 })
  return chips
})

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
  if (ok && keepManual.value) {
    await savedStore.save({
      label: manual.label.trim(), grams: num(manual.grams) > 0 ? num(manual.grams) : 100,
      kcal: num(manual.kcal), protein_g: num(manual.protein), carbs_g: num(manual.carbs), fat_g: num(manual.fat),
    })
  }
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
        <div class="chips-row" role="group" aria-label="Quantités rapides">
          <button
            v-for="c in quantityChips" :key="c.label" type="button" class="qchip"
            :class="{ on: Math.round(gramsNum) === Math.round(c.g) }" @click="grams = String(Math.round(c.g))"
          >{{ c.label }}</button>
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
          <button type="button" role="tab" :aria-selected="tab === 'recent'" :class="{ on: tab === 'recent' }" @click="tab = 'recent'">Récents</button>
          <button type="button" role="tab" :aria-selected="tab === 'search'" :class="{ on: tab === 'search' }" @click="tab = 'search'">Recherche</button>
          <button type="button" role="tab" :aria-selected="tab === 'scan'" :class="{ on: tab === 'scan' }" @click="tab = 'scan'">Scanner</button>
          <button type="button" role="tab" :aria-selected="tab === 'manual'" :class="{ on: tab === 'manual' }" @click="tab = 'manual'">Manuel</button>
        </div>

        <div v-if="tab === 'recent'" class="stack">
          <div class="row-between factor">
            <span class="small">Quantité</span>
            <div class="chips-row" role="group" aria-label="Multiplier la portion">
              <button v-for="f in FACTORS" :key="f" type="button" class="qchip" :class="{ on: factor === f }" @click="factor = f">
                {{ f === 0.5 ? '½' : f === 1.5 ? '1,5' : f }}×
              </button>
            </div>
          </div>
          <p v-if="addedCount" class="added small" role="status">
            <UiIcon name="check" :size="16" /> {{ addedCount }} ajouté{{ addedCount > 1 ? 's' : '' }} au {{ typeLabel }}
          </p>
          <p v-if="error" class="error small">{{ error }}</p>

          <template v-if="savedQuick.length">
            <h3 class="sub">Mes plats</h3>
            <ul class="list">
              <li v-for="q in savedQuick" :key="q.label" class="quick">
                <div class="grow">
                  <p class="title">{{ q.label }}</p>
                  <p class="muted small num">{{ Math.round(q.kcal * factor) }} kcal · {{ Math.round(q.grams * factor) }} g</p>
                </div>
                <button class="icon-btn" type="button" :aria-label="`Retirer ${q.label} de mes plats`" @click="toggleSaved(q)"><UiIcon name="star" :filled="true" :size="20" /></button>
                <button class="icon-btn add" type="button" :class="{ done: justAdded === q.label }" :aria-label="`Ajouter ${q.label}`" :disabled="saving" @click="addQuick(q)"><UiIcon :name="justAdded === q.label ? 'check' : 'plus'" :size="20" /></button>
              </li>
            </ul>
          </template>

          <template v-if="recentQuick.length">
            <h3 class="sub">Fréquents</h3>
            <ul class="list">
              <li v-for="q in recentQuick" :key="q.label" class="quick">
                <div class="grow">
                  <p class="title">{{ q.label }}</p>
                  <p class="muted small num">{{ Math.round(q.kcal * factor) }} kcal · {{ Math.round(q.grams * factor) }} g</p>
                </div>
                <button class="icon-btn" type="button" :aria-label="`Ajouter ${q.label} à mes plats`" @click="toggleSaved(q)"><UiIcon name="star" :size="20" /></button>
                <button class="icon-btn add" type="button" :class="{ done: justAdded === q.label }" :aria-label="`Ajouter ${q.label}`" :disabled="saving" @click="addQuick(q)"><UiIcon :name="justAdded === q.label ? 'check' : 'plus'" :size="20" /></button>
              </li>
            </ul>
          </template>

          <p v-if="!savedQuick.length && !recentQuick.length" class="muted">
            Rien ici pour l'instant. Ajoute un aliment depuis Recherche ou Code-barres : il apparaîtra ici pour le ré-ajouter en un tap.
          </p>
          <p class="muted small">L'étoile garde un plat dans « Mes plats », en haut de la liste.</p>
          <button v-if="addedCount" class="btn btn-primary btn-block" type="button" @click="emit('close')">Terminé</button>
        </div>

        <div v-else-if="tab === 'search'" class="stack">
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
          <label class="keep"><input v-model="keepManual" type="checkbox"> Garder dans « Mes plats »</label>
          <p v-if="error" class="error small">{{ error }}</p>
          <button class="btn btn-primary btn-block" type="submit" :disabled="!manualValid || saving">Ajouter au repas</button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sheet-backdrop { position: fixed; inset: 0; z-index: 40; background: rgba(0, 0, 0, 0.6); display: flex; align-items: flex-end; justify-content: center; }
.sheet {
  width: 100%; max-width: 520px; max-height: 92dvh; overflow-y: auto;
  background: var(--paper); border-radius: 18px 18px 0 0; padding: 1rem 1rem calc(1.2rem + env(safe-area-inset-bottom));
  display: grid; gap: 0.9rem;
}
.seg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); background: var(--fog); border-radius: var(--radius-sm); padding: 3px; }
.seg button { border: 0; background: transparent; padding: 0.6rem 0.1rem; font-size: 0.9rem; border-radius: 8px; font: inherit; font-weight: 700; color: var(--ink-2); cursor: pointer; }
.seg button.on { background: var(--cobalt); color: var(--on-accent); }
.hit { all: unset; display: grid; gap: 0.1rem; width: 100%; cursor: pointer; padding: 0.15rem 0; }
.hit:focus-visible { outline: 3px solid var(--cobalt); outline-offset: 2px; }
.grow-btn { flex: 1; }
.chips-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.qchip {
  min-height: 40px; padding: 0 0.8rem; font: inherit; font-weight: 600; color: var(--ink); cursor: pointer;
  background: var(--paper); border: 1px solid var(--line); border-radius: 999px;
}
.qchip.on { background: var(--cobalt); color: var(--on-accent); border-color: var(--cobalt); }
.factor { gap: 0.6rem; }
.sub { margin: 0.2rem 0 0; font-size: 1rem; }
.quick { display: flex; align-items: center; gap: 0.5rem; }
.icon-btn {
  flex: none; width: 44px; height: 44px; display: grid; place-items: center; cursor: pointer;
  background: transparent; color: var(--ink-2); border: 1px solid var(--line); border-radius: 12px;
}
.icon-btn.add { background: var(--cobalt); color: var(--on-accent); border-color: var(--cobalt); }
.icon-btn.add.done { background: var(--hivis); color: var(--on-hivis); border-color: var(--hivis); }
.icon-btn:focus-visible { outline: 3px solid var(--cobalt); outline-offset: 2px; }
.added { display: flex; align-items: center; gap: 0.4rem; margin: 0; color: var(--ok); font-weight: 600; }
.keep { display: flex; align-items: center; gap: 0.6rem; min-height: 44px; }
</style>
