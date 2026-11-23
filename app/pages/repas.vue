<script setup lang="ts">
import type { MealType } from '~/types/database'

await useAppData()

const weight = useWeightStore()
const meals = useMealsStore()
const { goal, currentKg } = storeToRefs(weight)
const { todayEntries, totals } = storeToRefs(meals)

const adding = ref(false)

const target = computed(() => (goal.value ? computeNutrition(goal.value, currentKg.value) : null))
const left = computed(() => (target.value ? target.value.kcal - totals.value.kcal : 0))
const pct = computed(() => (target.value ? Math.min((totals.value.kcal / target.value.kcal) * 100, 100) : 0))

const GROUPS: Array<{ type: MealType; label: string }> = [
  { type: 'breakfast', label: 'Petit-déjeuner' },
  { type: 'lunch', label: 'Déjeuner' },
  { type: 'dinner', label: 'Dîner' },
  { type: 'snack', label: 'Collations' },
]
const grouped = computed(() =>
  GROUPS.map((g) => ({ ...g, items: todayEntries.value.filter((m) => m.meal_type === g.type) })).filter(
    (g) => g.items.length,
  ),
)

const macros = computed(() =>
  target.value
    ? [
        { label: 'Protéines', value: totals.value.protein, goal: target.value.protein },
        { label: 'Glucides', value: totals.value.carbs, goal: target.value.carbs },
        { label: 'Lipides', value: totals.value.fat, goal: target.value.fat },
      ]
    : [],
)
</script>

<template>
  <div class="shell-inner">
    <header class="page-head">
      <h1>Repas</h1>
      <p class="muted">Ce que tu as mangé aujourd'hui</p>
    </header>

    <section v-if="target" class="panel stack">
      <p class="big num" :class="{ over: left < 0 }">
        {{ Math.abs(Math.round(left)) }}<span class="unit"> kcal {{ left < 0 ? 'de trop' : 'restantes' }}</span>
      </p>
      <div class="bar" role="progressbar" :aria-valuenow="Math.round(pct)" aria-valuemin="0" aria-valuemax="100">
        <div class="bar-fill" :class="{ over: left < 0 }" :style="{ width: `${pct}%` }" />
      </div>
      <p class="muted small num">{{ Math.round(totals.kcal) }} mangées sur un objectif de {{ target.kcal }} kcal</p>

      <ul class="macros">
        <li v-for="m in macros" :key="m.label">
          <div class="row-between small">
            <span>{{ m.label }}</span>
            <span class="num">{{ Math.round(m.value) }} / {{ m.goal }} g</span>
          </div>
          <div class="bar"><div class="bar-fill hivis" :style="{ width: `${Math.min((m.value / m.goal) * 100, 100)}%` }" /></div>
        </li>
      </ul>
    </section>

    <button class="btn btn-primary btn-block" type="button" @click="adding = true">
      <UiIcon name="plus" /> Ajouter un aliment
    </button>

    <FeaturesMealIdeas />

    <section v-if="grouped.length" class="stack">
      <div v-for="g in grouped" :key="g.type" class="panel">
        <h2>{{ g.label }}</h2>
        <ul class="list">
          <li v-for="m in g.items" :key="m.id">
            <div class="grow">
              <p class="title">{{ m.label }}</p>
              <p class="muted small num">{{ Math.round(Number(m.grams)) }} g</p>
            </div>
            <strong class="num">{{ Math.round(Number(m.kcal)) }} kcal</strong>
            <button class="btn btn-quiet" type="button" :aria-label="`Supprimer ${m.label}`" @click="meals.remove(m.id)">
              <UiIcon name="close" :size="18" />
            </button>
          </li>
        </ul>
      </div>
    </section>
    <p v-else class="muted">Rien de noté pour l'instant. Ajoute ton petit-déjeuner pour démarrer la journée.</p>

    <p class="muted small">
      Objectif calculé avec la formule de Mifflin-St Jeor : c'est une estimation. Un médecin ou un diététicien peut l'affiner.
      <NuxtLink to="/profil">Modifier mes réglages</NuxtLink>
    </p>

    <FeaturesFoodAdder v-if="adding" @close="adding = false" />
  </div>
</template>

<style scoped>
.shell-inner { display: grid; gap: 1.4rem; }
.big { font-size: 2.6rem; font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
.big.over { color: var(--bad); }
.unit { font-size: 1rem; font-weight: 600; letter-spacing: 0; color: var(--ink-2); }
.macros { list-style: none; margin: 0.4rem 0 0; padding: 0; display: grid; gap: 0.7rem; }
</style>
