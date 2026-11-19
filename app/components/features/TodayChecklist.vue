<script setup lang="ts">
const weight = useWeightStore()
const meals = useMealsStore()
const workouts = useWorkoutsStore()
const { weighedToday, goal, currentKg } = storeToRefs(weight)
const { totals } = storeToRefs(meals)
const { doneToday, nextSession } = storeToRefs(workouts)

const target = computed(() => (goal.value ? computeNutrition(goal.value, currentKg.value) : null))
const mealsDone = computed(() => meals.todayEntries.length >= 2)

const value = ref('')
const saving = ref(false)
const parsed = computed(() => Number(value.value.replace(',', '.')))
const valid = computed(() => Number.isFinite(parsed.value) && parsed.value >= 20 && parsed.value <= 400)

async function submit() {
  if (!valid.value || saving.value) return
  saving.value = true
  const ok = await weight.add(Math.round(parsed.value * 10) / 10)
  if (ok) value.value = ''
  saving.value = false
}
</script>

<template>
  <section class="panel today">
    <h2>Aujourd'hui</h2>
    <ul class="list">
      <!-- Pesée -->
      <li class="item">
        <span class="tick" :class="{ on: weighedToday }" aria-hidden="true">
          <UiIcon v-if="weighedToday" name="check" :size="16" />
        </span>
        <div v-if="weighedToday" class="grow">
          <p class="title">Pesée faite</p>
          <p class="muted small num">{{ fmtNum(currentKg) }} kg ce matin</p>
        </div>
        <form v-else class="grow weigh" @submit.prevent="submit">
          <label for="today-weight" class="title">Pèse-toi (à jeun, le matin)</label>
          <div class="row">
            <input
              id="today-weight" v-model="value" type="text" inputmode="decimal"
              placeholder="ex. 118,4" autocomplete="off" aria-label="Poids en kilos"
            >
            <button class="btn btn-primary" type="submit" :disabled="!valid || saving">OK</button>
          </div>
        </form>
      </li>

      <!-- Course -->
      <li class="item">
        <span class="tick" :class="{ on: doneToday }" aria-hidden="true">
          <UiIcon v-if="doneToday" name="check" :size="16" />
        </span>
        <div class="grow">
          <p class="title">{{ doneToday ? 'Séance faite' : nextSession ? 'Séance du jour' : 'Plan terminé' }}</p>
          <p v-if="nextSession" class="muted small">
            Sem. {{ nextSession.week }}, séance {{ nextSession.session }} · <span class="nw">{{ formatMinutes(nextSession.totalSec) }}</span>
          </p>
        </div>
        <NuxtLink v-if="nextSession && !doneToday" to="/course" class="btn btn-hivis go">Démarrer</NuxtLink>
      </li>

      <!-- Repas -->
      <li class="item">
        <span class="tick" :class="{ on: mealsDone }" aria-hidden="true">
          <UiIcon v-if="mealsDone" name="check" :size="16" />
        </span>
        <div class="grow">
          <p class="title">Repas</p>
          <p class="muted small num">
            {{ Math.round(totals.kcal) }}<template v-if="target"> sur {{ target.kcal }}</template> kcal
          </p>
        </div>
        <NuxtLink to="/repas" class="btn btn-line go">Ajouter</NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.today h2 { margin-bottom: 0.2rem; }
.item { align-items: flex-start !important; }
.tick {
  flex: none; width: 26px; height: 26px; margin-top: 2px; border-radius: 50%;
  border: 2px solid var(--ink-2); display: grid; place-items: center; color: var(--ink);
}
.tick.on { background: var(--hivis); border-color: var(--hivis); color: var(--on-hivis); }
.nw { white-space: nowrap; }
.weigh { display: grid; gap: 0.4rem; }
.go { align-self: center; min-height: 40px; padding: 0.4rem 0.9rem; font-size: 0.92rem; }
</style>
