<script setup lang="ts">
const weight = useWeightStore()
const meals = useMealsStore()
const workouts = useWorkoutsStore()
const { weighedToday, goal, currentKg } = storeToRefs(weight)
const { todayEntries, totals } = storeToRefs(meals)
const { doneToday, nextSession } = storeToRefs(workouts)

const target = computed(() => (goal.value ? computeNutrition(goal.value, currentKg.value) : null))

const items = computed(() => [
  {
    key: 'weigh',
    label: 'Te peser, de préférence le matin à jeun',
    done: weighedToday.value,
    to: null as string | null,
  },
  {
    key: 'run',
    label: nextSession.value
      ? `Séance de la semaine ${nextSession.value.week}, n° ${nextSession.value.session}`
      : 'Plan terminé, bravo',
    done: doneToday.value || !nextSession.value,
    to: '/course',
  },
  {
    key: 'meals',
    label: target.value
      ? `Noter tes repas (${Math.round(totals.value.kcal)} sur ${target.value.kcal} kcal)`
      : 'Noter tes repas',
    done: todayEntries.value.length >= 2,
    to: '/repas',
  },
])
</script>

<template>
  <section>
    <h2>Aujourd'hui</h2>
    <ul class="list">
      <li v-for="item in items" :key="item.key">
        <span class="tick" :class="{ on: item.done }" aria-hidden="true">
          <UiIcon v-if="item.done" name="check" :size="16" />
        </span>
        <NuxtLink v-if="item.to && !item.done" :to="item.to" class="grow title">{{ item.label }}</NuxtLink>
        <span v-else class="grow title" :class="{ muted: item.done }">{{ item.label }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.tick {
  flex: none; width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid var(--ink-2); display: grid; place-items: center; color: var(--ink);
}
.tick.on { background: var(--hivis); border-color: var(--ink); }
.list a { color: var(--ink); text-decoration: none; }
</style>
