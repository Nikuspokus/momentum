<script setup lang="ts">
await useAppData()

const activity = useActivityStore()
const workouts = useWorkoutsStore()
const { slots, hasData } = storeToRefs(activity)
const { entries } = storeToRefs(workouts)

// --- Activité par créneau ---
const dayOffset = ref(0) // 0 = aujourd'hui, -1 = hier…
const perHour = ref(true)
const day = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset.value)
  return d
})
const dayLabel = computed(() =>
  dayOffset.value === 0 ? "Aujourd'hui" : dayOffset.value === -1 ? 'Hier'
    : day.value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
)
const bars30 = computed(() => dayBars(slots.value, day.value, false))
const bars = computed(() => (perHour.value ? dayBars(slots.value, day.value, true) : bars30.value))
const insights = computed(() => analyseDay(bars30.value))
const dayHasData = computed(() => insights.value.total > 0)
const native = ref(false)
onMounted(() => { native.value = isNative() })

// --- Parcours ---
const withRoute = computed(() => entries.value.filter((w) => w.route && w.route.length > 1))
const selectedId = ref<string | null>(null)
const showAll = ref(false)
watchEffect(() => { if (!selectedId.value && withRoute.value.length) selectedId.value = withRoute.value[0]!.id })
const selected = computed(() => withRoute.value.find((w) => w.id === selectedId.value) ?? null)
const mapRoutes = computed(() =>
  (showAll.value ? withRoute.value.slice(0, 30) : selected.value ? [selected.value] : []).map((w) => ({ id: w.id, route: w.route! })),
)
const splits = computed(() => (selected.value ? kmSplits(selected.value.route!) : []))
const endTime = computed(() => {
  const w = selected.value
  return w ? new Date(new Date(w.started_at).getTime() + w.duration_s * 1000) : null
})
const clock = (d: Date | string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const speed = computed(() => {
  const w = selected.value
  return w && w.duration_s > 0 && w.distance_m > 0 ? (w.distance_m / 1000) / (w.duration_s / 3600) : null
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Activité</h1>
      <p class="muted">Quand tu bouges, et où tu es allé</p>
    </header>

    <section class="panel stack" aria-labelledby="h-steps">
      <div class="row-between">
        <h2 id="h-steps" style="margin: 0">Pas par créneau</h2>
        <div class="seg" role="group" aria-label="Regroupement">
          <button type="button" :class="{ on: !perHour }" :aria-pressed="!perHour" @click="perHour = false">30 min</button>
          <button type="button" :class="{ on: perHour }" :aria-pressed="perHour" @click="perHour = true">1 h</button>
        </div>
      </div>

      <div class="daynav">
        <button class="btn btn-line" type="button" :disabled="dayOffset <= -13" aria-label="Jour précédent" @click="dayOffset--">‹</button>
        <p class="daylabel">{{ dayLabel }}</p>
        <button class="btn btn-line" type="button" :disabled="dayOffset >= 0" aria-label="Jour suivant" @click="dayOffset++">›</button>
      </div>

      <template v-if="dayHasData">
        <FeaturesActivityChart :bars="bars" />
        <dl class="kpis num">
          <div><dt>Total</dt><dd>{{ insights.total.toLocaleString('fr-FR') }} pas</dd></div>
          <div><dt>Heures actives</dt><dd>{{ insights.activeHours }}</dd></div>
          <div v-if="insights.peak"><dt>Pic</dt><dd>{{ insights.peak.label }}</dd></div>
          <div v-if="insights.idle"><dt>Plus longue pause</dt><dd>{{ insights.idle.from }}–{{ insights.idle.to }} · {{ formatDuration(insights.idle.minutes) }}</dd></div>
        </dl>
        <p class="muted small">
          Une heure active compte au moins {{ ACTIVE_HOUR_STEPS }} pas. La pause mesure la plus longue période d'immobilité entre 8 h et 22 h.
          Répartition estimée à partir des relevés de Health Connect.
        </p>
      </template>
      <p v-else-if="native || hasData" class="muted">Aucun pas enregistré ce jour-là. Ouvre l'accueil pour lancer la synchronisation avec Health Connect.</p>
      <p v-else class="muted">
        Le détail par heure vient de Health Connect, disponible dans l'application Android. Installe-la depuis le dépôt GitHub
        (voir « Version Android » dans l'aide) puis ouvre l'accueil pour synchroniser.
      </p>
    </section>

    <section class="panel stack" aria-labelledby="h-map">
      <h2 id="h-map" style="margin: 0">Où tu es allé</h2>

      <template v-if="withRoute.length">
        <FeaturesActivityMap :routes="mapRoutes" :selected-id="showAll ? null : selectedId" />

        <div class="chips" role="group" aria-label="Choisir une sortie">
          <button type="button" class="chip-btn" :class="{ on: showAll }" :aria-pressed="showAll" @click="showAll = !showAll">Toutes</button>
          <button
            v-for="w in withRoute.slice(0, 12)" :key="w.id" type="button" class="chip-btn"
            :class="{ on: !showAll && selectedId === w.id }" :aria-pressed="!showAll && selectedId === w.id"
            @click="selectedId = w.id; showAll = false"
          >{{ formatDay(w.started_at) }}</button>
        </div>

        <template v-if="selected && !showAll">
          <dl class="kpis num">
            <div><dt>Temps</dt><dd>{{ formatMinutes(selected.duration_s) }}</dd></div>
            <div><dt>Distance</dt><dd>{{ formatKm(selected.distance_m) }}</dd></div>
            <div v-if="pace(selected.duration_s, selected.distance_m)"><dt>Allure moyenne</dt><dd>{{ pace(selected.duration_s, selected.distance_m) }}</dd></div>
            <div v-if="speed"><dt>Vitesse</dt><dd>{{ fmtNum(speed) }} km/h</dd></div>
            <div><dt>Départ</dt><dd>{{ clock(selected.started_at) }}</dd></div>
            <div v-if="endTime"><dt>Arrivée</dt><dd>{{ clock(endTime) }}</dd></div>
          </dl>
          <div v-if="splits.length">
            <h3 class="sub">Temps par kilomètre</h3>
            <ul class="list">
              <li v-for="s in splits" :key="s.km" class="row-between">
                <span>Km {{ s.km }}</span><span class="num strong">{{ formatClock(s.sec) }}</span>
              </li>
            </ul>
          </div>
          <p v-else class="muted small">Le détail par kilomètre est disponible pour les sorties enregistrées à partir de cette version.</p>
        </template>
        <p v-else class="muted small">{{ Math.min(withRoute.length, 30) }} parcours affichés. Choisis une date pour le détail d'une sortie.</p>
      </template>
      <p v-else class="muted">
        Aucun parcours pour l'instant. Lance une séance depuis l'onglet Course avec le GPS activé : le tracé, le temps et l'allure apparaîtront ici.
        Seules les sorties suivies par GPS sont cartographiées.
      </p>
    </section>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 1.4rem; }
.seg { display: inline-grid; grid-template-columns: 1fr 1fr; background: var(--fog); border: 1px solid var(--line); border-radius: 10px; padding: 3px; }
.seg button { white-space: nowrap; min-height: 36px; padding: 0 0.8rem; border: 0; border-radius: 8px; background: transparent; color: var(--ink-2); font: inherit; font-weight: 600; cursor: pointer; }
.seg button.on { background: var(--cobalt); color: var(--on-accent); }
.daynav { display: grid; grid-template-columns: 48px minmax(0, 1fr) 48px; align-items: center; gap: 0.5rem; }
.daynav .btn { min-height: 44px; padding: 0; font-size: 1.4rem; }
.daylabel { margin: 0; text-align: center; font-weight: 700; text-transform: capitalize; }
.kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem 1rem; margin: 0; }
.kpis dt { color: var(--ink-2); font-size: 0.85rem; }
.kpis dd { margin: 0; font-weight: 700; font-size: 1.05rem; }
.chips { display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.2rem; }
.chip-btn {
  flex: none; min-height: 40px; padding: 0 0.9rem; font: inherit; font-weight: 600; color: var(--ink); cursor: pointer;
  background: var(--paper); border: 1px solid var(--line); border-radius: 999px;
}
.chip-btn.on { background: var(--cobalt); color: var(--on-accent); border-color: var(--cobalt); }
.sub { margin: 0 0 0.3rem; font-size: 1rem; }
.strong { font-weight: 700; }
</style>
