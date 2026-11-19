<script setup lang="ts">
const store = useRemindersStore()
const { prefs, enabled, busy, error, supported } = storeToRefs(store)
const tested = ref(false)

onMounted(() => store.load())

const DAYS = [
  { n: 1, l: 'Lun' }, { n: 2, l: 'Mar' }, { n: 3, l: 'Mer' }, { n: 4, l: 'Jeu' },
  { n: 5, l: 'Ven' }, { n: 6, l: 'Sam' }, { n: 7, l: 'Dim' },
]
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const hh = (h: number) => `${String(h).padStart(2, '0')} h`

function toggleDay(n: number) {
  const set = new Set(prefs.value.workout_days)
  set.has(n) ? set.delete(n) : set.add(n)
  prefs.value.workout_days = [...set].sort()
}

// <select> renvoie une chaîne : '' = rappel désactivé
const hourModel = (key: 'weigh_hour' | 'workout_hour' | 'meals_hour') =>
  computed({
    get: () => (prefs.value[key] === null ? '' : String(prefs.value[key])),
    set: (v: string) => { prefs.value[key] = v === '' ? null : Number(v) },
  })
const weigh = hourModel('weigh_hour')
const workout = hourModel('workout_hour')
const meals = hourModel('meals_hour')

async function test() {
  tested.value = await store.sendTest()
}
</script>

<template>
  <div class="stack">
    <p v-if="!supported" class="muted">
      Ce navigateur ne gère pas les notifications. Sur Android, ouvre l'app dans Chrome ; sur iPhone, ajoute-la d'abord à l'écran d'accueil.
    </p>

    <template v-else>
      <p class="muted small">
        Une notification Web Push est un message envoyé par le serveur même quand l'app est fermée. Le rappel n'est envoyé que si tu n'as pas déjà fait l'action ce jour-là.
      </p>

      <button v-if="!enabled" class="btn btn-primary btn-block" type="button" :disabled="busy" @click="store.enable()">
        Activer les rappels sur cet appareil
      </button>

      <template v-else>
        <div class="field">
          <label for="r-weigh">Pesée</label>
          <select id="r-weigh" v-model="weigh">
            <option value="">Pas de rappel</option>
            <option v-for="h in HOURS" :key="h" :value="String(h)">{{ hh(h) }}</option>
          </select>
        </div>
        <div class="field">
          <label for="r-meals">Repas à noter</label>
          <select id="r-meals" v-model="meals">
            <option value="">Pas de rappel</option>
            <option v-for="h in HOURS" :key="h" :value="String(h)">{{ hh(h) }}</option>
          </select>
        </div>
        <div class="field">
          <label for="r-work">Entraînement (course ou renfo)</label>
          <select id="r-work" v-model="workout">
            <option value="">Pas de rappel</option>
            <option v-for="h in HOURS" :key="h" :value="String(h)">{{ hh(h) }}</option>
          </select>
        </div>
        <fieldset class="days">
          <legend class="small">Jours d'entraînement</legend>
          <div class="chips">
            <button
              v-for="d in DAYS" :key="d.n" type="button" class="day"
              :aria-pressed="prefs.workout_days.includes(d.n)" :class="{ on: prefs.workout_days.includes(d.n) }"
              @click="toggleDay(d.n)"
            >{{ d.l }}</button>
          </div>
        </fieldset>

        <div class="row">
          <button class="btn btn-line" type="button" :disabled="busy" @click="test">Envoyer un test</button>
          <button class="btn btn-primary grow-btn" type="button" :disabled="busy" @click="store.savePrefs()">Enregistrer</button>
        </div>
        <p v-if="tested" class="small">Notification de test envoyée.</p>
        <button class="btn btn-quiet" type="button" :disabled="busy" @click="store.disable()">Désactiver les rappels</button>
      </template>

      <p v-if="error" class="error small">{{ error }}</p>
    </template>
  </div>
</template>

<style scoped>
.days { border: 0; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.day {
  min-height: 44px; min-width: 52px; padding: 0 0.7rem; cursor: pointer; font: inherit; color: var(--ink);
  background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius-sm);
}
.day.on { background: var(--cobalt); color: var(--on-accent); border-color: var(--cobalt); font-weight: 600; }
.day:focus-visible { outline: 2px solid var(--cobalt); outline-offset: 2px; }
.grow-btn { flex: 1; }
</style>
