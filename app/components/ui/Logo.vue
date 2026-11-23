<script setup lang="ts">
// Icône de l'app : « M » en deux tons (blanc cassé / jaune-vert) sur noir
withDefaults(defineProps<{ size?: number }>(), { size: 128 })
const id = useId()
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 1024 1024" role="img" aria-label="Momentum">
    <defs>
      <linearGradient :id="`g${id}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#14171B" /><stop offset="1" stop-color="#08090B" />
      </linearGradient>
      <clipPath :id="`l${id}`"><rect x="0" y="0" width="512" height="1024" /></clipPath>
      <clipPath :id="`r${id}`"><rect x="512" y="0" width="512" height="1024" /></clipPath>
    </defs>
    <rect width="1024" height="1024" rx="230" :fill="`url(#g${id})`" />
    <g transform="translate(0 -3)" fill="none" stroke-width="96" stroke-linecap="round" stroke-linejoin="round">
      <path d="M300 700 V330 L512 560 L724 330 V700" stroke="#F4F5F0" :clip-path="`url(#l${id})`" />
      <path d="M300 700 V330 L512 560 L724 330 V700" stroke="#C8F31D" :clip-path="`url(#r${id})`" />
    </g>
  </svg>
</template>
