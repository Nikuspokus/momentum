<script setup lang="ts">
await useAppData()

const weight = useWeightStore()
const workouts = useWorkoutsStore()
const { entries: weighIns, goal } = storeToRefs(weight)
const { entries: runs, doneIds } = storeToRefs(workouts)

const now = new Date()

// --- Compte à rebours ---
const days = computed(() => daysUntil(OBJECTIVE.date, now))
const weeks = computed(() => Math.floor(days.value / 7))
const planDays = computed(() => Math.max(0, daysUntil(OBJECTIVE.planStart, now)))

// --- Cette semaine ---
const week = computed(() => {
  const { start, end } = weekBounds(now)
  const list = runs.value.filter((w) => {
    const t = new Date(w.started_at).getTime()
    return t >= start.getTime() && t < end.getTime()
  })
  return { count: list.length, km: list.reduce((s, w) => s + w.distance_m, 0) / 1000 }
})
const planDone = computed(() => doneIds.value.size)
const pct = (n: number, total: number) => `${Math.min(100, Math.round((n / total) * 100))}%`

// --- Poids et scénarios ---
const startKg = computed(() => startWeight(weighIns.value, goal.value?.start_weight_kg))
const sinceStart = computed(() => {
  const from = dayTime(OBJECTIVE.planStart) - 43_200_000
  return weighIns.value
    .filter((e) => new Date(e.measured_at).getTime() >= from)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
})
const latest = computed(() => sinceStart.value.at(-1) ?? null)

const realistic = SCENARIOS.find((s) => s.id === 'realiste')!
const gap = computed(() => {
  if (startKg.value == null || !latest.value) return null
  const planned = scenarioWeight(realistic, startKg.value, new Date(latest.value.measured_at).getTime())
  return planned - latest.value.weight_kg // > 0 : plus léger que prévu = en avance
})

const targets = computed(() =>
  startKg.value == null ? [] : SCENARIOS.map((s) => ({
    ...s, april: startKg.value! - s.lossApril, october: startKg.value! - s.lossOctober,
  })),
)

// Graphique SVG
const W = 340
const H = 230
const PAD = { top: 16, right: 14, bottom: 26, left: 38 }
const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom
const T0 = dayTime(AXIS_START)
const T1 = dayTime(AXIS_END)
const xOf = (t: number) => PAD.left + ((t - T0) / (T1 - T0)) * innerW

const yScale = computed(() => {
  if (startKg.value == null) return null
  const all = [
    ...SCENARIOS.flatMap((s) => [startKg.value! - s.lossOctober, startKg.value!]),
    ...sinceStart.value.map((e) => e.weight_kg),
  ]
  const min = Math.floor(Math.min(...all) / 5) * 5
  const max = Math.ceil(Math.max(...all) / 5) * 5
  return { min, max }
})
const yOf = (kg: number) => {
  const s = yScale.value!
  return PAD.top + (1 - (kg - s.min) / (s.max - s.min)) * innerH
}
const yTicks = computed(() => {
  const s = yScale.value
  if (!s) return []
  const out: number[] = []
  for (let v = s.min; v <= s.max; v += 5) out.push(v)
  return out
})
const knots = [T0, dayTime(DATE_APRIL), dayTime(DATE_OCTOBER), T1]
function scenarioPath(sc: Scenario): string {
  return knots.map((t, i) => `${i ? 'L' : 'M'}${xOf(t).toFixed(1)},${yOf(scenarioWeight(sc, startKg.value!, t)).toFixed(1)}`).join(' ')
}
const actualPath = computed(() =>
  sinceStart.value.map((e, i) => `${i ? 'L' : 'M'}${xOf(new Date(e.measured_at).getTime()).toFixed(1)},${yOf(e.weight_kg).toFixed(1)}`).join(' '),
)
const raceX = computed(() => xOf(dayTime(OBJECTIVE.date)))
const monthTicks = [
  ['2026-12-01', 'déc.'], ['2027-02-01', 'févr.'], ['2027-04-01', 'avr.'],
  ['2027-06-01', 'juin'], ['2027-08-01', 'août'], ['2027-10-01', 'oct.'],
].map(([iso, label]) => ({ x: xOf(dayTime(iso!)), label: label! }))

// Lecture au toucher / survol
const hoverT = ref<number | null>(null)
function onPointer(e: PointerEvent) {
  const svg = (e.currentTarget as SVGElement).ownerSVGElement!
  const r = svg.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * W
  hoverT.value = Math.min(T1, Math.max(T0, T0 + ((x - PAD.left) / innerW) * (T1 - T0)))
}
const readout = computed(() => {
  if (hoverT.value == null || startKg.value == null) return 'Touche le graphique pour lire les poids visés à une date'
  const d = new Date(hoverT.value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const v = SCENARIOS.map((s) => `${s.label.toLowerCase()} ${fmtNum(scenarioWeight(s, startKg.value!, hoverT.value!))} kg`).join(' · ')
  return `${d} — ${v}`
})

const chartLabel = computed(() => {
  if (startKg.value == null) return 'Courbe de poids indisponible'
  const last = latest.value ? `, dernier poids ${fmtNum(latest.value.weight_kg)} kg` : ', aucune pesée depuis le début du plan'
  return `Poids réel comparé à trois scénarios, départ ${fmtNum(startKg.value)} kg${last}`
})
const lineStyle: Record<Scenario['id'], { dash?: string; width: number }> = {
  prudent: { dash: '6 4', width: 1.75 },
  realiste: { width: 2 },
  optimiste: { dash: '1 4', width: 2.4 },
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <NuxtLink to="/" class="back small">‹ Accueil</NuxtLink>
      <h1>Objectif 10 km</h1>
      <p class="muted">{{ OBJECTIVE.name }}, {{ OBJECTIVE.city }}</p>
    </header>

    <section class="count" aria-labelledby="h-count">
      <h2 id="h-count" class="sr-only">Compte à rebours</h2>
      <template v-if="days > 0">
        <p class="big num"><span>{{ days }}</span> jours</p>
        <p class="sub">soit {{ weeks }} semaine{{ weeks > 1 ? 's' : '' }} avant le {{ formatLongDate(OBJECTIVE.date) }}</p>
      </template>
      <p v-else-if="days === 0" class="big">C'est aujourd'hui !</p>
      <p v-else class="big">Course passée</p>
      <p v-if="!OBJECTIVE.dateConfirmed" class="note">Date à confirmer auprès de l'organisation.</p>
      <p v-if="planDays > 0" class="note">Le plan démarre dans {{ planDays }} jour{{ planDays > 1 ? 's' : '' }}.</p>
    </section>

    <section class="panel stack" aria-labelledby="h-week">
      <h2 id="h-week" style="margin: 0">Cette semaine</h2>
      <p class="muted small">Du lundi au dimanche</p>
      <dl class="kpis num">
        <div>
          <dt>Sorties</dt>
          <dd>{{ week.count }} / {{ OBJECTIVE.weeklyOutings }}</dd>
          <div class="bar" role="progressbar" :aria-valuenow="week.count" aria-valuemin="0" :aria-valuemax="OBJECTIVE.weeklyOutings" aria-label="Sorties de la semaine">
            <div class="bar-fill" :style="{ width: pct(week.count, OBJECTIVE.weeklyOutings) }" />
          </div>
        </div>
        <div><dt>Distance</dt><dd>{{ fmtNum(week.km, 1) }} km</dd></div>
        <div class="wide">
          <dt>Séances du plan</dt>
          <dd>{{ planDone }} / {{ PLAN.length }}</dd>
          <div class="bar" role="progressbar" :aria-valuenow="planDone" aria-valuemin="0" :aria-valuemax="PLAN.length" aria-label="Séances du plan faites">
            <div class="bar-fill" :style="{ width: pct(planDone, PLAN.length) }" />
          </div>
        </div>
      </dl>
    </section>

    <section class="panel stack" aria-labelledby="h-weight">
      <h2 id="h-weight" style="margin: 0">Poids et scénarios</h2>

      <template v-if="startKg != null && yScale">
        <p v-if="gap != null" class="gap" :class="gap >= 0 ? 'ahead' : 'late'">
          <strong class="num">{{ fmtNum(Math.abs(gap)) }} kg</strong>
          {{ gap >= 0 ? "d'avance" : 'de retard' }} sur le scénario réaliste
        </p>
        <p v-else class="muted small">Aucune pesée depuis le {{ formatLongDate(OBJECTIVE.planStart) }} : le départ est fixé à {{ fmtNum(startKg) }} kg.</p>

        <p class="readout small" aria-live="polite">{{ readout }}</p>
        <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" :aria-label="chartLabel">
          <g class="grid">
            <line v-for="v in yTicks" :key="v" :x1="PAD.left" :x2="W - PAD.right" :y1="yOf(v)" :y2="yOf(v)" />
          </g>
          <g class="ylab">
            <text v-for="v in yTicks" :key="v" :x="PAD.left - 6" :y="yOf(v) + 4" text-anchor="end">{{ v }}</text>
          </g>
          <g class="xlab">
            <text v-for="m in monthTicks" :key="m.label" :x="m.x" :y="H - 8" text-anchor="middle">{{ m.label }}</text>
          </g>
          <line class="race" :x1="raceX" :x2="raceX" :y1="PAD.top" :y2="H - PAD.bottom" stroke-dasharray="3 3" />
          <text class="racelab" :x="raceX - 4" :y="PAD.top + 9" text-anchor="end">Course</text>

          <path v-for="s in SCENARIOS" :key="s.id" :d="scenarioPath(s)" class="scen" fill="none" stroke-linecap="round" stroke-linejoin="round"
            :stroke-width="lineStyle[s.id].width" :stroke-dasharray="lineStyle[s.id].dash" />
          <path v-if="sinceStart.length > 1" :d="actualPath" class="actual" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle v-for="e in sinceStart" :key="e.id" :cx="xOf(new Date(e.measured_at).getTime())" :cy="yOf(e.weight_kg)" r="3.5" class="pt" />

          <line v-if="hoverT != null" class="cursor" :x1="xOf(hoverT)" :x2="xOf(hoverT)" :y1="PAD.top" :y2="H - PAD.bottom" />
          <rect :x="PAD.left" :y="PAD.top" :width="innerW" :height="innerH" fill="transparent" class="hit"
            @pointerdown="onPointer" @pointermove="onPointer" @pointerleave="hoverT = null" />
        </svg>

        <ul class="legend small">
          <li>
            <svg width="26" height="8" aria-hidden="true"><line x1="1" x2="25" y1="4" y2="4" class="actual" stroke-width="3" stroke-linecap="round" /></svg>
            Poids réel
          </li>
          <li v-for="s in SCENARIOS" :key="s.id">
            <svg width="26" height="8" aria-hidden="true">
              <line x1="1" x2="25" y1="4" y2="4" class="scen" stroke-linecap="round" :stroke-width="lineStyle[s.id].width" :stroke-dasharray="lineStyle[s.id].dash" />
            </svg>
            {{ s.label }}
          </li>
        </ul>

        <table class="tbl num">
          <caption class="sr-only">Poids visés selon le scénario</caption>
          <thead><tr><th scope="col">Scénario</th><th scope="col">15 avril</th><th scope="col">15 octobre</th></tr></thead>
          <tbody>
            <tr v-for="t in targets" :key="t.id">
              <th scope="row">{{ t.label }}</th>
              <td>{{ fmtNum(t.april) }} kg <span class="muted">(−{{ fmtNum(t.lossApril) }})</span></td>
              <td>{{ fmtNum(t.october) }} kg <span class="muted">(−{{ fmtNum(t.lossOctober) }})</span></td>
            </tr>
          </tbody>
        </table>
      </template>
      <p v-else class="muted">Renseigne ton poids de départ dans le profil pour voir les scénarios.</p>

      <p class="muted small">
        Les scénarios sont des ordres de grandeur, pas des promesses. Reste sous 1 kg par semaine et demande l'avis de ton médecin avant de changer
        ton alimentation ou ton entraînement.
      </p>
    </section>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 1.4rem; }
.back { color: var(--ink-2); text-decoration: none; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* Carte compte à rebours : jaune-vert à motif de points, texte sombre dans les deux thèmes */
.count {
  position: relative; overflow: hidden; border-radius: var(--radius); padding: 1.3rem 1.1rem; color: #10140a;
  background-color: #c8f31d;
  background-image: radial-gradient(circle, rgb(16 20 10 / 0.16) 1px, transparent 1.4px), linear-gradient(135deg, #d6ff3a, #b6e015);
  background-size: 16px 16px, auto;
}
.big { margin: 0; font-size: 1.6rem; font-weight: 800; line-height: 1.1; }
.big span { font-size: min(22vw, 5.2rem); letter-spacing: -0.03em; }
.sub { margin: 0.3rem 0 0; font-weight: 600; }
.note { margin: 0.5rem 0 0; font-size: 0.85rem; }

.kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1rem; margin: 0; }
.kpis > div { display: grid; gap: 0.25rem; align-content: start; }
.kpis .wide { grid-column: 1 / -1; }
.kpis dt { color: var(--ink-2); font-size: 0.85rem; }
.kpis dd { margin: 0; font-weight: 700; font-size: 1.25rem; }

.gap { margin: 0; font-size: 1.05rem; }
.gap.ahead strong { color: var(--ok); }
.gap.late strong { color: var(--bad); }
.readout { margin: 0; min-height: 1.4em; color: var(--ink-2); }

.chart { width: 100%; height: auto; touch-action: pan-y; }
.grid line { stroke: var(--line); stroke-width: 1; }
.ylab text, .xlab text, .racelab { fill: var(--ink-2); font-size: 10px; }
.race { stroke: var(--ink-2); stroke-width: 1; }
.scen { stroke: var(--ink-2); }
.actual { stroke: var(--cobalt); }
.pt { fill: var(--cobalt); stroke: var(--paper); stroke-width: 2; }
.cursor { stroke: var(--ink); stroke-width: 1; opacity: 0.5; }
.hit { cursor: crosshair; }

.legend { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; list-style: none; margin: 0; padding: 0; }
.legend li { display: inline-flex; align-items: center; gap: 0.4rem; }
.legend .scen { stroke: var(--ink-2); }

.tbl { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.tbl th, .tbl td { text-align: left; padding: 0.5rem 0.3rem; border-top: 1px solid var(--line); }
.tbl thead th { border-top: 0; color: var(--ink-2); font-weight: 600; font-size: 0.82rem; }
.tbl tbody th { font-weight: 700; }
</style>
