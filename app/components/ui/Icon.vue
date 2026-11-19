<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 24 })

const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  meal: 'M7 3v7a2 2 0 0 0 2 2M7 3v18M11 3v7a2 2 0 0 1-2 2M17 21V3c-2.5 1.5-3 5-3 8h3',
  track: 'M7 6h10a6 6 0 0 1 0 12H7A6 6 0 0 1 7 6zM8 10h8a2 2 0 0 1 0 4H8a2 2 0 0 1 0-4z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5L20 7',
  close: 'M6 6l12 12M18 6L6 18',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.5-4.5',
  flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
}

const path = computed(() => PATHS[props.name] ?? '')
</script>

<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
  >
    <path :d="path" />
  </svg>
</template>
