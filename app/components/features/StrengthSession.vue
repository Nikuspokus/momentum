<script setup lang="ts">
const props = defineProps<{ session: StrengthSession }>()
const emit = defineEmits<{ close: [] }>()

const strength = useStrengthStore()

type Unit = { step: StrengthStep; stepIndex: number; setNo: number }
const units: Unit[] = props.session.steps.flatMap((step, stepIndex) =>
  Array.from({ length: step.sets }, (_, i) => ({ step, stepIndex, setNo: i + 1 })),
)

const mode = ref<'intro' | 'work' | 'rest' | 'done'>('intro')
const idx = ref(0)
const now = ref(Date.now())
const holdEnd = ref<number | null>(null)
const restEnd = ref(0)
const startedAt = ref<Date | null>(null)
const finishedAt = ref<Date | null>(null)
const saving = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)

let timer: ReturnType<typeof setInterval> | null = null
let audio: AudioContext | null = null

const unit = computed(() => units[idx.value]!)
const exercise = computed(() => EXERCISES[unit.value.step.exerciseId]!)
const nextUnit = computed(() => units[idx.value + 1] ?? null)
const holdLeft = computed(() => (holdEnd.value ? Math.max(0, Math.ceil((holdEnd.value - now.value) / 1000)) : null))
const restLeft = computed(() => Math.max(0, Math.ceil((restEnd.value - now.value) / 1000)))
const progressPct = computed(() => (idx.value / units.length) * 100)
const kindLabel = computed(() => ({ warmup: 'Échauffement', work: 'Exercice', cooldown: 'Étirements' })[unit.value.step.kind])
const stepsDone = computed(() => (mode.value === 'done' ? new Set(units.slice(0, idx.value).map((u) => u.stepIndex)).size : 0))
const durationS = computed(() =>
  startedAt.value && finishedAt.value ? Math.round((finishedAt.value.getTime() - startedAt.value.getTime()) / 1000) : 0,
)

function tick() {
  now.value = Date.now()
  if (mode.value === 'work' && holdEnd.value && now.value >= holdEnd.value) completeUnit()
  else if (mode.value === 'rest' && now.value >= restEnd.value) endRest()
}

function begin() {
  audio = new AudioContext()
  startedAt.value = new Date()
  mode.value = 'work'
  timer = setInterval(tick, 250)
}

function startHold() {
  holdEnd.value = Date.now() + (unit.value.step.holdSec ?? 30) * 1000
  playBeep(audio, [660])
}

function completeUnit() {
  holdEnd.value = null
  if (idx.value >= units.length - 1) {
    idx.value = units.length
    finish()
    return
  }
  const { step } = unit.value
  if (step.kind === 'work' && step.restSec > 0) {
    playBeep(audio, [880, 1100])
    restEnd.value = Date.now() + step.restSec * 1000
    mode.value = 'rest'
  } else {
    playBeep(audio, [660])
    idx.value++
  }
}

function endRest() {
  playBeep(audio, [660, 880])
  idx.value++
  mode.value = 'work'
}

function finish() {
  if (timer) clearInterval(timer)
  timer = null
  finishedAt.value = new Date()
  playBeep(audio, [660, 880, 1100])
  mode.value = 'done'
}

async function save() {
  if (saving.value || saved.value) return
  saving.value = true
  saveError.value = null
  const ok = await strength.add({
    plan_week: props.session.week,
    plan_session: props.session.session,
    template: props.session.template,
    duration_s: durationS.value,
    exercises_done: stepsDone.value,
    started_at: (startedAt.value ?? new Date()).toISOString(),
  })
  saving.value = false
  if (ok) saved.value = true
  else saveError.value = strength.error
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  audio?.close().catch(() => {})
})
</script>

<template>
  <div class="player" role="dialog" aria-modal="true" aria-label="Séance de renforcement">
    <header class="row-between">
      <div>
        <p class="small strong">Semaine {{ session.week }}, séance {{ session.session }}</p>
        <p class="small">{{ session.title }}</p>
      </div>
      <button v-if="mode !== 'work' && mode !== 'rest'" class="close" type="button" aria-label="Fermer" @click="emit('close')">
        <UiIcon name="close" />
      </button>
      <button v-else class="btn btn-line stop" type="button" @click="finish">Arrêter</button>
    </header>

    <!-- Avant le départ -->
    <section v-if="mode === 'intro'" class="body">
      <p class="headline">{{ session.estMin }} min</p>
      <p>{{ session.focus }}. Prépare un coin au sol, une chaise solide et, si tu veux, deux petites bouteilles d'eau comme haltères.</p>
      <ul class="plan">
        <li v-for="(s, i) in session.steps" :key="i">
          <span class="strong">{{ EXERCISES[s.exerciseId]!.name }}</span>
          <span class="muted small">{{ stepSummary(s) }}</span>
        </li>
      </ul>
      <p class="small">Mouvements lents et contrôlés. Si une douleur apparaît (autre qu'un effort musculaire), arrête-toi.</p>
      <button class="btn btn-primary btn-block big-btn" type="button" @click="begin">Commencer</button>
    </section>

    <!-- Exercice en cours -->
    <section v-else-if="mode === 'work'" class="body">
      <div class="bar" role="progressbar" :aria-valuenow="Math.round(progressPct)" aria-valuemin="0" aria-valuemax="100">
        <div class="bar-fill" :style="{ width: `${progressPct}%` }" />
      </div>
      <p class="small strong">{{ kindLabel }}<template v-if="unit.step.sets > 1"> · série {{ unit.setNo }} sur {{ unit.step.sets }}</template></p>
      <h2 class="ex-name">{{ exercise.name }}</h2>
      <FeaturesExerciseImage :key="unit.step.exerciseId" :frames="exerciseFrames(unit.step.exerciseId)" :alt="exercise.name" />
      <p>{{ exercise.cue }}</p>

      <template v-if="unit.step.reps !== null">
        <p class="target num">{{ unit.step.reps }} répétitions</p>
        <button class="btn btn-primary btn-block big-btn" type="button" @click="completeUnit">Série faite</button>
      </template>
      <template v-else>
        <p class="target num">{{ holdLeft ?? unit.step.holdSec }} s</p>
        <button v-if="holdLeft === null" class="btn btn-primary btn-block big-btn" type="button" @click="startHold">Je suis prêt</button>
        <button v-else class="btn btn-line btn-block" type="button" @click="completeUnit">Passer</button>
      </template>
    </section>

    <!-- Repos -->
    <section v-else-if="mode === 'rest'" class="body rest">
      <p class="phase">Repos</p>
      <p class="clock num">{{ restLeft }}</p>
      <p v-if="nextUnit">
        Ensuite : <strong>{{ EXERCISES[nextUnit.step.exerciseId]!.name }}</strong>
        <template v-if="nextUnit.step.sets > 1"> (série {{ nextUnit.setNo }} sur {{ nextUnit.step.sets }})</template>
      </p>
      <button class="btn btn-ink btn-block big-btn" type="button" @click="endRest">Je suis prêt</button>
    </section>

    <!-- Bilan -->
    <section v-else class="body">
      <p class="headline">Séance terminée</p>
      <dl class="meta num">
        <div><dt>Durée</dt><dd>{{ formatClock(durationS) }}</dd></div>
        <div><dt>Exercices</dt><dd>{{ stepsDone }} sur {{ session.steps.length }}</dd></div>
      </dl>
      <p v-if="saveError" class="error">{{ saveError }}</p>
      <button v-if="!saved" class="btn btn-primary btn-block big-btn" type="button" :disabled="saving || stepsDone === 0" @click="save">
        Enregistrer la séance
      </button>
      <p v-else class="strong">Séance enregistrée. Bien joué !</p>
      <button class="btn btn-line btn-block" type="button" @click="emit('close')">Fermer</button>
    </section>
  </div>
</template>

<style scoped>
.player {
  position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: var(--fog); color: var(--ink);
  padding: 1rem 1.1rem calc(1.4rem + env(safe-area-inset-bottom)); display: grid; align-content: start; gap: 1rem;
}
.body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.9rem; max-width: 520px; width: 100%; margin: 0 auto; }
.strong { font-weight: 700; }
.close { all: unset; cursor: pointer; padding: 0.4rem; }
.close:focus-visible { outline: 3px solid var(--cobalt); }
.stop { min-height: 40px; padding: 0.3rem 0.9rem; }
.headline { font-size: 2.4rem; font-weight: 800; line-height: 1; }
.ex-name { font-size: 1.5rem; }
.target { font-size: 2.6rem; font-weight: 800; line-height: 1; }
.big-btn { min-height: 56px; font-size: 1.1rem; }
.plan { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.1rem; }
.plan li { display: flex; justify-content: space-between; gap: 0.8rem; padding: 0.45rem 0; border-top: 1px solid var(--line); }
.plan li:first-child { border-top: 0; }
.rest .phase { font-size: 1.6rem; font-weight: 800; }
.rest .clock { font-size: min(34vw, 9rem); font-weight: 800; line-height: 0.95; }
.meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.8rem; margin: 0; }
.meta dt { font-size: 0.85rem; color: var(--ink-2); }
.meta dd { margin: 0; font-weight: 800; font-size: 1.4rem; }
</style>
