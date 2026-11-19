<script setup lang="ts">
const { streak, xp, level, levelProgressPct, xpToNext } = useGamification()
</script>

<template>
  <section class="panel stack">
    <div class="row-between">
      <h2 style="margin: 0">Niveau {{ level }}</h2>
      <span v-if="streak > 0" class="chip">
        <UiIcon name="flame" :size="16" />
        {{ streak }} {{ streak > 1 ? 'jours' : 'jour' }} d'affilée
      </span>
    </div>
    <div class="bar" role="progressbar" :aria-valuenow="Math.round(levelProgressPct)" aria-valuemin="0" aria-valuemax="100">
      <div class="bar-fill" :style="{ width: `${levelProgressPct}%` }" />
    </div>
    <p class="muted small num">{{ xp }} points · encore {{ xpToNext }} pour le niveau {{ level + 1 }}</p>
  </section>
</template>
