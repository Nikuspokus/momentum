<script setup lang="ts">
await useAppData()

const workouts = useWorkoutsStore()
const { entries, doneIds, nextSession, totalDistanceKm } = storeToRefs(workouts)

const running = ref(false)
const showPlan = ref(false)

const weeks = computed(() => {
  const byWeek = new Map<number, typeof PLAN>()
  for (const s of PLAN) byWeek.set(s.week, [...(byWeek.get(s.week) ?? []), s])
  return [...byWeek.entries()].map(([week, sessions]) => ({ week, sessions }))
})
const doneCount = computed(() => doneIds.value.size)
const withRoute = computed(() => entries.value.filter((w) => w.route && w.route.length > 1))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Course</h1>
      <p class="muted">Reprise en douceur, marche et trot en alternance</p>
    </header>

    <section v-if="nextSession" class="next stack">
      <p class="small strong">Prochaine séance</p>
      <h2 style="margin: 0">Semaine {{ nextSession.week }}, séance {{ nextSession.session }}</h2>
      <p>{{ nextSession.title }}</p>
      <p class="small">Durée totale : {{ formatMinutes(nextSession.totalSec) }}, échauffement et retour au calme compris.</p>
      <button class="btn btn-ink btn-block" type="button" @click="running = true">Démarrer la séance</button>
    </section>
    <p v-else class="strong">Tu as terminé tout le plan. Bravo !</p>

    <section class="panel stack">
      <div class="row-between">
        <h2 style="margin: 0">Progression</h2>
        <span class="muted small num">{{ doneCount }} / {{ PLAN.length }} séances · {{ fmtNum(totalDistanceKm, 1) }} km</span>
      </div>
      <div class="bar"><div class="bar-fill" :style="{ width: `${(doneCount / PLAN.length) * 100}%` }" /></div>
      <button class="btn btn-line btn-block" type="button" @click="showPlan = !showPlan">
        {{ showPlan ? 'Masquer le plan' : 'Voir le plan sur 12 semaines' }}
      </button>
      <ul v-if="showPlan" class="list">
        <li v-for="w in weeks" :key="w.week">
          <div class="grow">
            <p class="title">Semaine {{ w.week }}</p>
            <p class="muted small">{{ w.sessions[0]!.title }}</p>
          </div>
          <span class="dots" :aria-label="`${w.sessions.filter((s) => doneIds.has(s.id)).length} séances sur 3 faites`">
            <span v-for="s in w.sessions" :key="s.id" class="dot" :class="{ on: doneIds.has(s.id) }" />
          </span>
        </li>
      </ul>
    </section>

    <section v-if="entries.length" class="panel stack">
      <h2 style="margin: 0">Mes sorties</h2>
      <ul class="list">
        <li v-for="w in entries.slice(0, 10)" :key="w.id" class="outing">
          <div class="row-between">
            <div>
              <p class="title">
                <template v-if="w.plan_week">Semaine {{ w.plan_week }}, séance {{ w.plan_session }}</template>
                <template v-else>Sortie libre</template>
              </p>
              <p class="muted small">{{ formatDay(w.started_at) }}</p>
            </div>
            <p class="num strong">{{ formatMinutes(w.duration_s) }}<template v-if="w.distance_m > 0"> · {{ formatKm(w.distance_m) }}</template></p>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="withRoute.length" class="panel stack">
      <h2 style="margin: 0">Parcours</h2>
      <div v-for="w in withRoute.slice(0, 3)" :key="w.id" class="stack">
        <p class="muted small">{{ formatDay(w.started_at) }} · {{ formatKm(w.distance_m) }}</p>
        <FeaturesRouteMap :route="w.route!" />
      </div>
    </section>

    <p class="muted small">
      Ce plan est une proposition prudente. Arrête-toi en cas de douleur, et parles-en à ton médecin au moindre doute.
    </p>

    <FeaturesRunSession v-if="running && nextSession" :session="nextSession" @close="running = false" />
  </div>
</template>

<style scoped>
.page { display: grid; gap: 1.4rem; }
.next { background: var(--cobalt); color: var(--on-accent); border-radius: var(--radius); padding: 1.1rem; }
.next .btn-hivis { margin-top: 0.3rem; }
.strong { font-weight: 700; }
.dots { display: flex; gap: 6px; }
.dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink-2); }
.dot.on { background: var(--hivis); border-color: var(--hivis); }
.outing { display: block; }
</style>
