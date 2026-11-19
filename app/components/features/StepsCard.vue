<script setup lang="ts">
const steps = useStepsStore()
const { today, week } = storeToRefs(steps)

const pct = computed(() => Math.min(100, (today.value / STEP_GOAL) * 100))
const R = 52
const C = 2 * Math.PI * R
const max = computed(() => Math.max(STEP_GOAL, ...week.value.map((d) => d.steps)))

const editing = ref(false)
const value = ref('')
const saving = ref(false)
const parsed = computed(() => Math.round(Number(value.value.replace(/[\s ]/g, '').replace(',', '.'))))
const valid = computed(() => Number.isFinite(parsed.value) && parsed.value >= 0 && parsed.value <= 100000)
const fmt = (n: number) => n.toLocaleString('fr-FR')

function open() {
  value.value = today.value ? String(today.value) : ''
  editing.value = true
}
async function save() {
  if (!valid.value || saving.value) return
  saving.value = true
  if (await steps.setToday(parsed.value)) editing.value = false
  saving.value = false
}
</script>

<template>
  <section class="panel stack" aria-label="Pas du jour">
    <div class="top">
      <svg class="ring" viewBox="0 0 120 120" role="img" :aria-label="`${Math.round(pct)} % de l'objectif de pas`">
        <circle cx="60" cy="60" :r="R" class="track" />
        <circle
          cx="60" cy="60" :r="R" class="arc" :stroke-dasharray="C" :stroke-dashoffset="C * (1 - pct / 100)"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div class="big">
        <p class="label">Pas aujourd'hui</p>
        <p class="n num">{{ fmt(today) }}</p>
        <p class="muted small num">sur {{ fmt(STEP_GOAL) }} · {{ Math.round(pct) }} %</p>
      </div>
    </div>

    <div class="bars" role="img" aria-label="Pas des 7 derniers jours">
      <div v-for="d in week" :key="d.key" class="col">
        <div class="bar-wrap"><div class="bar" :class="{ hit: d.steps >= STEP_GOAL }" :style="{ height: `${Math.max(4, (d.steps / max) * 100)}%` }" /></div>
        <span class="muted small">{{ d.label }}</span>
      </div>
    </div>

    <form v-if="editing" class="row" @submit.prevent="save">
      <input v-model="value" type="text" inputmode="numeric" autocomplete="off" placeholder="ex. 6500" aria-label="Pas du jour">
      <button class="btn btn-primary" type="submit" :disabled="!valid || saving">OK</button>
      <button class="btn btn-quiet" type="button" @click="editing = false">Annuler</button>
    </form>
    <button v-else class="btn btn-line btn-block" type="button" @click="open">Saisir mes pas</button>
    <p class="muted small">Le total est celui de ta montre ou de ton téléphone ; sans saisie, il est estimé à partir de tes courses suivies.</p>
    <p v-if="steps.error" class="error small">{{ steps.error }}</p>
  </section>
</template>

<style scoped>
.top { display: flex; align-items: center; gap: 1rem; }
.ring { flex: none; width: min(34vw, 8.5rem); height: auto; }
.track { fill: none; stroke: var(--line); stroke-width: 11; }
.arc { fill: none; stroke: var(--cobalt); stroke-width: 11; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
.big { min-width: 0; }
.label { margin: 0; color: var(--ink-2); font-size: 0.9rem; }
.n { margin: 0.1rem 0; font-size: min(11vw, 2.8rem); font-weight: 800; font-stretch: 110%; line-height: 1; letter-spacing: -0.02em; }
.bars { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.4rem; height: 5.5rem; align-items: end; }
.col { display: grid; grid-template-rows: 1fr auto; gap: 0.25rem; height: 100%; justify-items: center; text-align: center; }
.bar-wrap { width: 100%; display: flex; align-items: flex-end; }
.bar { width: 100%; background: var(--line); border-radius: 4px 4px 2px 2px; }
.bar.hit { background: var(--cobalt); }
</style>
