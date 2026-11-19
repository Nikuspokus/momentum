<script setup lang="ts">
import type { PlanSession } from '~/utils/plan'

const props = defineProps<{ session: PlanSession }>()
const emit = defineEmits<{ close: [] }>()

const workouts = useWorkoutsStore()

const {
  status, elapsed, distanceM, route, startedAt, gpsEnabled, gpsError,
  totalSec, index, current, next, remaining, durationS,
  start, pause, resume, finish,
} = useRunSession(props.session.segments)

const saving = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)

const phaseLabel = computed(() => (current.value.type === 'run' ? 'Trot' : 'Marche'))
const nextLabel = computed(() =>
  next.value ? `Ensuite : ${next.value.type === 'run' ? 'trot' : 'marche'} ${formatMinutes(next.value.sec)}` : 'Dernier segment',
)

async function save() {
  if (saving.value || saved.value) return
  saving.value = true
  saveError.value = null
  const ok = await workouts.add({
    plan_week: props.session.week,
    plan_session: props.session.session,
    duration_s: durationS.value,
    distance_m: Math.round(distanceM.value),
    route: route.value.length > 1 ? route.value : null,
    kind: 'plan',
    started_at: (startedAt.value ?? new Date()).toISOString(),
  })
  saving.value = false
  if (ok) saved.value = true
  else saveError.value = workouts.error
}
</script>

<template>
  <div class="run" :class="[`phase-${status === 'running' || status === 'paused' ? current.type : 'idle'}`]" role="dialog" aria-modal="true" aria-label="Séance de course">
    <header class="row-between">
      <div>
        <p class="small strong">Semaine {{ session.week }}, séance {{ session.session }}</p>
        <p class="small">{{ session.title }}</p>
      </div>
      <button v-if="status !== 'running'" class="close" type="button" aria-label="Fermer" @click="emit('close')">
        <UiIcon name="close" />
      </button>
    </header>

    <!-- Avant le départ -->
    <section v-if="status === 'idle'" class="body">
      <p class="headline">{{ formatMinutes(session.totalSec) }}</p>
      <p>Échauffement de 5 minutes en marchant, puis des alternances trot et marche, et 5 minutes de retour au calme. Un bip te prévient à chaque changement.</p>
      <label class="check">
        <input v-model="gpsEnabled" type="checkbox">
        <span>Enregistrer mon parcours avec le GPS</span>
      </label>
      <p class="small">Garde l'écran allumé : l'app le maintient éveillé pendant la séance. Si tu ressens une douleur ou un essoufflement anormal, arrête-toi.</p>
      <button class="btn btn-ink btn-block big-btn" type="button" @click="start">Démarrer</button>
    </section>

    <!-- Pendant la séance -->
    <section v-else-if="status === 'running' || status === 'paused'" class="body">
      <p class="phase">{{ phaseLabel }}</p>
      <p class="clock num">{{ formatClock(remaining) }}</p>
      <p>{{ nextLabel }}</p>

      <div class="ribbon" aria-hidden="true">
        <span
          v-for="(seg, i) in session.segments" :key="i" class="seg"
          :class="[seg.type, { past: i < index, now: i === index }]" :style="{ flexGrow: seg.sec }"
        />
      </div>

      <dl class="meta num">
        <div><dt>Écoulé</dt><dd>{{ formatClock(elapsed) }} sur {{ formatClock(totalSec) }}</dd></div>
        <div v-if="gpsEnabled"><dt>Distance</dt><dd>{{ formatKm(distanceM) }}</dd></div>
      </dl>
      <p v-if="gpsError" class="small">GPS : {{ gpsError }}</p>

      <div class="row">
        <button v-if="status === 'running'" class="btn btn-ink grow-btn big-btn" type="button" @click="pause">Pause</button>
        <button v-else class="btn btn-ink grow-btn big-btn" type="button" @click="resume">Reprendre</button>
        <button class="btn btn-line" type="button" @click="finish(false)">Terminer</button>
      </div>
    </section>

    <!-- Bilan -->
    <section v-else class="body">
      <p class="headline">Séance terminée</p>
      <dl class="meta num">
        <div><dt>Durée</dt><dd>{{ formatClock(durationS) }}</dd></div>
        <div v-if="distanceM > 0"><dt>Distance</dt><dd>{{ formatKm(distanceM) }}</dd></div>
      </dl>
      <FeaturesRouteMap v-if="route.length > 1" :route="route" />
      <p v-if="saveError" class="small strong">{{ saveError }}</p>
      <button v-if="!saved" class="btn btn-ink btn-block big-btn" type="button" :disabled="saving" @click="save">
        Enregistrer la séance
      </button>
      <p v-else class="strong">Séance enregistrée. Bien joué !</p>
      <button class="btn btn-line btn-block" type="button" @click="emit('close')">Fermer</button>
    </section>
  </div>
</template>

<style scoped>
.run {
  position: fixed; inset: 0; z-index: 50; overflow-y: auto;
  padding: 1rem 1.1rem calc(1.4rem + env(safe-area-inset-bottom));
  display: grid; align-content: start; gap: 1rem;
  background: var(--fog); color: var(--ink); transition: background 0.3s ease;
}
.run.phase-run { background: var(--cobalt); color: #fff; }
.run.phase-walk { background: var(--hivis); color: var(--ink); }
.body { display: grid; gap: 1rem; max-width: 520px; width: 100%; margin: 0 auto; }
.strong { font-weight: 700; }
.close { all: unset; cursor: pointer; padding: 0.4rem; }
.close:focus-visible { outline: 3px solid var(--cobalt); }
.headline { font-size: 2.4rem; font-weight: 900; font-stretch: 122%; line-height: 1; }
.phase { font-size: 1.6rem; font-weight: 800; font-stretch: 118%; }
.clock { font-size: clamp(5.5rem, 30vw, 8rem); font-weight: 900; font-stretch: 125%; line-height: 0.95; letter-spacing: -0.03em; }
.check { display: flex; gap: 0.6rem; align-items: center; font-weight: 600; }
.check input { width: 22px; height: 22px; min-height: 0; accent-color: var(--cobalt); }
.big-btn { min-height: 56px; font-size: 1.1rem; }
.grow-btn { flex: 1; }
.run.phase-run .btn-ink { background: #fff; color: var(--ink); }
.ribbon { display: flex; gap: 3px; height: 14px; }
.seg { border-radius: 4px; opacity: 0.35; }
.seg.run { background: currentColor; }
.seg.walk { background: currentColor; opacity: 0.18; }
.seg.past { opacity: 0.9; }
.seg.now { opacity: 1; outline: 2px solid currentColor; outline-offset: 2px; }
.meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.8rem; margin: 0; }
.meta dt { font-size: 0.85rem; opacity: 0.8; }
.meta dd { margin: 0; font-weight: 800; font-size: 1.4rem; }
</style>
