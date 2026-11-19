<script setup lang="ts">
const weight = useWeightStore()

const value = ref('')
const saving = ref(false)

const parsed = computed(() => Number(value.value.replace(',', '.')))
const valid = computed(() => Number.isFinite(parsed.value) && parsed.value >= 20 && parsed.value <= 400)

async function submit() {
  if (!valid.value || saving.value) return
  saving.value = true
  const ok = await weight.add(Math.round(parsed.value * 10) / 10)
  if (ok) value.value = ''
  saving.value = false
}
</script>

<template>
  <form class="card form" @submit.prevent="submit">
    <label for="weight-input">Pesée du jour (kg)</label>
    <div class="row">
      <input
        id="weight-input"
        v-model="value"
        type="text"
        inputmode="decimal"
        placeholder="ex. 121,4"
        autocomplete="off"
      >
      <button class="btn btn-primary" type="submit" :disabled="!valid || saving">
        Ajouter
      </button>
    </div>
  </form>
</template>
