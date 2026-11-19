<script setup lang="ts">
await useAppData()

const auth = useAuthStore()
const weight = useWeightStore()
const { user } = storeToRefs(auth)
const { goal, currentKg, error } = storeToRefs(weight)
const { badges, level, xp } = useGamification()

const form = reactive({
  target: '', height: '', age: '', sex: 'M', activity: '1.375', loss: '0.5',
})
const saving = ref(false)
const saved = ref(false)

watch(
  goal,
  (g) => {
    if (!g) return
    form.target = String(g.target_weight_kg)
    form.height = String(g.height_cm)
    form.age = String(g.age)
    form.sex = g.sex
    form.activity = String(g.activity_factor)
    form.loss = String(g.weekly_loss_kg)
  },
  { immediate: true },
)

const n = (s: string) => Number(s.replace(',', '.'))
const valid = computed(
  () => n(form.target) >= 30 && n(form.height) >= 120 && n(form.age) >= 16 && n(form.loss) > 0 && n(form.loss) <= 1,
)

const nutrition = computed(() => (goal.value ? computeNutrition(goal.value, currentKg.value) : null))

const ACTIVITIES = [
  { value: '1.2', label: 'Sédentaire (bureau)' },
  { value: '1.375', label: 'Léger (1 à 3 séances/sem.)' },
  { value: '1.55', label: 'Actif (3 à 5 séances/sem.)' },
  { value: '1.725', label: 'Très actif (6 à 7 séances/sem.)' },
]

async function save() {
  if (!valid.value || saving.value) return
  saving.value = true
  saved.value = false
  const ok = await weight.saveGoal({
    target_weight_kg: n(form.target),
    height_cm: n(form.height),
    age: Math.round(n(form.age)),
    sex: form.sex as 'M' | 'F',
    activity_factor: n(form.activity),
    weekly_loss_kg: n(form.loss),
  })
  saving.value = false
  saved.value = ok
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Profil</h1>
      <p class="muted">{{ user?.email }}</p>
    </header>

    <form v-if="goal" class="panel stack" @submit.prevent="save">
      <h2 style="margin: 0">Mon objectif</h2>
      <div class="field-grid">
        <div class="field">
          <label for="p-target">Poids cible (kg)</label>
          <input id="p-target" v-model="form.target" type="text" inputmode="decimal">
        </div>
        <div class="field">
          <label for="p-height">Taille (cm)</label>
          <input id="p-height" v-model="form.height" type="text" inputmode="numeric">
        </div>
        <div class="field">
          <label for="p-age">Âge</label>
          <input id="p-age" v-model="form.age" type="text" inputmode="numeric">
        </div>
        <div class="field">
          <label for="p-sex">Sexe</label>
          <select id="p-sex" v-model="form.sex">
            <option value="M">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="p-activity">Activité au quotidien</label>
        <select id="p-activity" v-model="form.activity">
          <option v-for="a in ACTIVITIES" :key="a.value" :value="a.value">{{ a.label }}</option>
        </select>
      </div>
      <div class="field">
        <label for="p-loss">Perte visée par semaine (kg, 1 maximum)</label>
        <input id="p-loss" v-model="form.loss" type="text" inputmode="decimal">
      </div>
      <p v-if="error" class="error small">{{ error }}</p>
      <p v-if="saved" class="small">Réglages enregistrés.</p>
      <button class="btn btn-primary btn-block" type="submit" :disabled="!valid || saving">Enregistrer</button>
    </form>

    <section v-if="nutrition" class="panel stack">
      <h2 style="margin: 0">Mon budget calorique</h2>
      <dl class="kv num">
        <div><dt>Métabolisme de base</dt><dd>{{ nutrition.bmr }} kcal</dd></div>
        <div><dt>Dépense journalière</dt><dd>{{ nutrition.tdee }} kcal</dd></div>
        <div><dt>Objectif du jour</dt><dd>{{ nutrition.kcal }} kcal</dd></div>
        <div><dt>Protéines</dt><dd>{{ nutrition.protein }} g</dd></div>
        <div><dt>Glucides</dt><dd>{{ nutrition.carbs }} g</dd></div>
        <div><dt>Lipides</dt><dd>{{ nutrition.fat }} g</dd></div>
      </dl>
      <p class="muted small">
        Le métabolisme de base est l'énergie dépensée au repos. La dépense journalière y ajoute ton activité.
        Ces valeurs sont des estimations (formule de Mifflin-St Jeor) : valide-les avec ton médecin ou un diététicien.
      </p>
    </section>

    <section class="panel stack">
      <div class="row-between">
        <h2 style="margin: 0">Badges</h2>
        <span class="muted small num">Niveau {{ level }} · {{ xp }} points</span>
      </div>
      <ul class="badges">
        <li v-for="b in badges" :key="b.id" :class="{ on: b.earned }">
          <p class="title">{{ b.label }}</p>
          <p class="small">{{ b.earned ? 'Obtenu' : b.hint }}</p>
        </li>
      </ul>
    </section>

    <section class="panel stack">
      <h2 style="margin: 0">Installer l'application</h2>
      <p class="muted">
        Dans Chrome sur Android, ouvre le menu (les trois points) puis « Ajouter à l'écran d'accueil »
        pour lancer Momentum comme une vraie application.
      </p>
    </section>

    <section class="stack">
      <button class="btn btn-line btn-block" type="button" @click="auth.signOut()">Se déconnecter</button>
      <p class="muted small">
        <NuxtLink to="/privacy">Confidentialité</NuxtLink> ·
        <NuxtLink to="/terms">Conditions d'utilisation</NuxtLink>
      </p>
    </section>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 1.6rem; }
.kv { display: grid; gap: 0.5rem; margin: 0; }
.kv div { display: flex; justify-content: space-between; border-bottom: 1px solid var(--fog); padding-bottom: 0.4rem; }
.kv dt { color: var(--ink-2); }
.kv dd { margin: 0; font-weight: 800; }
.badges { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.badges li { border: 2px dashed var(--ink-2); border-radius: var(--radius-sm); padding: 0.7rem; color: var(--ink-2); }
.badges li.on { border: 2px solid var(--hivis); background: var(--hivis); color: var(--on-accent); }
</style>
