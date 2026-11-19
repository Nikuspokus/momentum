<script setup lang="ts">
import type { MealType } from '~/types/database'

const weight = useWeightStore()
const meals = useMealsStore()
const prefs = useFoodPrefsStore()
const { goal, currentKg } = storeToRefs(weight)
const { totals } = storeToRefs(meals)

const TYPES: Array<{ value: MealType; label: string; share: number }> = [
  { value: 'breakfast', label: 'Petit-déjeuner', share: 0.25 },
  { value: 'lunch', label: 'Déjeuner', share: 0.35 },
  { value: 'dinner', label: 'Dîner', share: 0.3 },
  { value: 'snack', label: 'Collation', share: 0.1 },
]

function defaultType(): MealType {
  const h = new Date().getHours()
  if (h < 10) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 18) return 'snack'
  return 'dinner'
}

const open = ref(false)
const editing = ref(false)
const type = ref<MealType>(defaultType())
const haveText = ref('')
const avoidText = ref('')
const adding = ref<string | null>(null)
const added = ref<string | null>(null)
const error = ref<string | null>(null)

const target = computed(() => (goal.value ? computeNutrition(goal.value, currentKg.value) : null))
const kcalLeft = computed(() => (target.value ? target.value.kcal - totals.value.kcal : 2000))
const share = computed(() => TYPES.find((t) => t.value === type.value)!.share)
const ideal = computed(() => (target.value ? target.value.kcal * share.value : 500))

const ideas = computed(() =>
  suggest({
    type: type.value,
    have: prefs.have.map(norm),
    avoid: prefs.avoid.map(norm),
    kcalLeft: kcalLeft.value,
    idealKcal: ideal.value,
  }),
)

function startEdit() {
  haveText.value = prefs.have.join(', ')
  avoidText.value = prefs.avoid.join(', ')
  editing.value = true
}

async function saveEdit() {
  error.value = null
  const ok = await prefs.save(parseList(haveText.value), parseList(avoidText.value))
  if (ok) editing.value = false
  else error.value = prefs.error
}

async function addIdea(s: Suggestion) {
  adding.value = s.recipe.id
  error.value = null
  const rec = s.recipe
  const ok = await meals.add({
    meal_type: type.value,
    label: rec.name,
    grams: rec.grams,
    kcal: rec.kcal,
    protein_g: rec.protein,
    carbs_g: rec.carbs,
    fat_g: rec.fat,
    source: 'manual',
  })
  adding.value = null
  if (ok) added.value = rec.id
  else error.value = meals.error
}
</script>

<template>
  <section class="panel stack">
    <div class="row-between">
      <h2 style="margin: 0">Idées de repas</h2>
      <button v-if="open" class="btn btn-quiet" type="button" @click="open = false">Réduire</button>
    </div>

    <template v-if="!open">
      <p class="muted">Des repas équilibrés qui rentrent dans ton budget, selon ce que tu as et ce que tu n'aimes pas.</p>
      <button class="btn btn-line btn-block" type="button" @click="open = true">Me proposer des repas</button>
    </template>

    <template v-else>
      <div class="field">
        <label for="idea-type">Pour quel repas ?</label>
        <select id="idea-type" v-model="type">
          <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>

      <div v-if="!editing" class="prefs">
        <p class="small"><strong>J'ai :</strong> <span class="muted">{{ prefs.have.length ? prefs.have.join(', ') : 'rien de renseigné' }}</span></p>
        <p class="small"><strong>J'évite :</strong> <span class="muted">{{ prefs.avoid.length ? prefs.avoid.join(', ') : 'rien de renseigné' }}</span></p>
        <button class="btn btn-line" type="button" @click="startEdit">Modifier mes ingrédients</button>
      </div>
      <form v-else class="stack" @submit.prevent="saveEdit">
        <div class="field">
          <label for="have">Ce que j'ai chez moi (séparé par des virgules)</label>
          <textarea id="have" v-model="haveText" rows="2" placeholder="poulet, riz, brocoli, œufs, fromage blanc" />
        </div>
        <div class="field">
          <label for="avoid">Ce que je n'aime pas ou ne mange pas</label>
          <textarea id="avoid" v-model="avoidText" rows="2" placeholder="poisson, champignons, feta" />
        </div>
        <div class="row">
          <button class="btn btn-line" type="button" @click="editing = false">Annuler</button>
          <button class="btn btn-primary grow-btn" type="submit">Enregistrer</button>
        </div>
      </form>

      <p v-if="error" class="error small">{{ error }}</p>

      <ul v-if="ideas.length" class="ideas">
        <li v-for="s in ideas" :key="s.recipe.id" class="idea">
          <p class="title">{{ s.recipe.name }}</p>
          <p class="num small"><strong>{{ s.recipe.kcal }} kcal</strong>
            <span class="muted"> · protéines {{ s.recipe.protein }} g · glucides {{ s.recipe.carbs }} g · lipides {{ s.recipe.fat }} g</span>
          </p>
          <p v-if="prefs.have.length && s.missing.length" class="muted small">Il te manque : {{ s.missing.join(', ') }}</p>
          <p v-else-if="prefs.have.length" class="small">Tu as tout ce qu'il faut.</p>
          <button
            class="btn btn-line" type="button" :disabled="adding === s.recipe.id || added === s.recipe.id" @click="addIdea(s)"
          >{{ added === s.recipe.id ? 'Ajouté' : 'Ajouter à mon repas' }}</button>
        </li>
      </ul>
      <p v-else class="muted">Rien ne rentre dans ton budget restant avec ces exclusions. Assouplis la liste ou garde ça pour demain.</p>

      <p class="muted small">Valeurs par portion, estimées : ajuste selon tes quantités réelles. Suggestions calculées par règles, sans intelligence artificielle.</p>
    </template>
  </section>
</template>

<style scoped>
textarea {
  width: 100%; padding: 0.75rem 0.8rem; font: inherit; color: var(--ink); background: var(--paper);
  border: 1px solid var(--line); border-radius: var(--radius-sm); resize: vertical;
}
textarea:focus { border-color: var(--cobalt); outline: 2px solid var(--cobalt); outline-offset: 0; }
.prefs { display: grid; gap: 0.5rem; }
.ideas { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.8rem; }
.idea { display: grid; gap: 0.3rem; padding-top: 0.8rem; border-top: 1px solid var(--line); }
.idea:first-child { padding-top: 0; border-top: 0; }
.idea .btn { justify-self: start; min-height: 40px; }
.grow-btn { flex: 1; }
</style>
