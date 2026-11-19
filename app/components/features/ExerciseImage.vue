<script setup lang="ts">
// Les deux images d'un exercice (départ et arrivée) alternent pour montrer le mouvement
const props = withDefaults(defineProps<{ frames: string[]; alt: string; animate?: boolean }>(), { animate: true })

const index = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (props.animate && !reduce && props.frames.length > 1) {
    timer = setInterval(() => { index.value = (index.value + 1) % props.frames.length }, 900)
  }
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="frame">
    <img
      v-for="(f, i) in frames" :key="f" :src="exerciseImageUrl(f)" :alt="i === 0 ? alt : ''"
      :aria-hidden="i !== 0" loading="lazy" :class="{ on: i === index }"
    >
  </div>
</template>

<style scoped>
.frame { position: relative; aspect-ratio: 4 / 3; background: #fff; border-radius: var(--radius-sm); overflow: hidden; }
.frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; }
.frame img.on { opacity: 1; }
</style>
