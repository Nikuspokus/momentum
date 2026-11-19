<script setup lang="ts">
await useAppData()

const strength = useStrengthStore()
const { entries, doneIds, nextSession } = storeToRefs(strength)

const running = ref(false)
const showPlan = ref(false)

const weeks = computed(() => {
  const byWeek = new Map<number, StrengthSession[]>()
  for (const s of STRENGTH_PLAN) byWeek.set(s.week, [...(byWeek.get(s.week) ?? []), s])
  return [...byWeek.entries()].map(([week, sessions]) => ({ week, sessions }))
})
const preview = computed(() => nextSession.value?.steps.filter((s) => s.kind === 'work') ?? [])
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Renfo</h1>
      <p class="muted">Renforcement musculaire à la maison, sans impact</p>
    </header>

    <section v-if="nextSession" class="next stack">
      <p class="small strong">Prochaine séance</p>
      <h2 style="margin: 0">Semaine {{ nextSession.week }}, séance {{ nextSession.session }}</h2>
      <p>{{ nextSession.title }} · {{ nextSession.focus }}</p>
      <p class="small">Environ {{ nextSession.estMin }} min, échauffement et étirements compris.</p>
      <button class="btn btn-ink btn-block" type="button" @click="running = true">Commencer la séance</button>
    </section>
    <p v-else class="strong">Tu as terminé tout le plan de 8 semaines. Bravo !</p>

    <section v-if="nextSession" class="panel stack">
      <h2 style="margin: 0">Au programme</h2>
      <ul class="prog">
        <li v-for="s in preview" :key="s.exerciseId">
          <FeaturesExerciseImage :frames="exerciseFrames(s.exerciseId)" :alt="EXERCISES[s.exerciseId]!.name" :animate="false" class="thumb" />
          <div>
            <p class="title">{{ EXERCISES[s.exerciseId]!.name }}</p>
            <p class="muted small">{{ stepSummary(s) }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section class="panel stack">
      <div class="row-between">
        <h2 style="margin: 0">Progression</h2>
        <span class="muted small num">{{ doneIds.size }} / {{ STRENGTH_PLAN.length }} séances</span>
      </div>
      <div class="bar"><div class="bar-fill" :style="{ width: `${(doneIds.size / STRENGTH_PLAN.length) * 100}%` }" /></div>
      <button class="btn btn-line btn-block" type="button" @click="showPlan = !showPlan">
        {{ showPlan ? 'Masquer le plan' : 'Voir le plan sur 8 semaines' }}
      </button>
      <ul v-if="showPlan" class="list">
        <li v-for="w in weeks" :key="w.week">
          <div class="grow">
            <p class="title">Semaine {{ w.week }}</p>
            <p class="muted small">{{ w.sessions[0]!.steps.find((s) => s.kind === 'work')!.sets }} séries par exercice</p>
          </div>
          <span class="dots">
            <span v-for="s in w.sessions" :key="s.id" class="dot" :class="{ on: doneIds.has(s.id) }" />
          </span>
        </li>
      </ul>
    </section>

    <section v-if="entries.length" class="panel stack">
      <h2 style="margin: 0">Mes séances</h2>
      <ul class="list">
        <li v-for="s in entries.slice(0, 6)" :key="s.id">
          <div class="grow">
            <p class="title">Semaine {{ s.plan_week }}, séance {{ s.plan_session }}</p>
            <p class="muted small">{{ formatDay(s.started_at) }}</p>
          </div>
          <strong class="num">{{ formatMinutes(s.duration_s) }}</strong>
        </li>
      </ul>
    </section>

    <FeaturesExerciseLibrary />

    <p class="muted small">
      Plan prudent pour reprendre. Avance à ton rythme, arrête-toi en cas de douleur et demande conseil à ton médecin au moindre doute.
    </p>

    <FeaturesStrengthSession v-if="running && nextSession" :session="nextSession" @close="running = false" />
  </div>
</template>

<style scoped>
.page { display: grid; gap: 1.4rem; }
.next { background: var(--cobalt); color: var(--on-accent); border-radius: var(--radius); padding: 1.1rem; }
.strong { font-weight: 700; }
.prog { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.8rem; }
.prog li { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 0.8rem; align-items: center; }
.thumb { width: 84px; }
.dots { display: flex; gap: 6px; }
.dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink-2); }
.dot.on { background: var(--hivis); border-color: var(--hivis); }
</style>
