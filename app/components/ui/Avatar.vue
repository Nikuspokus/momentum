<script setup lang="ts">
// Photo de profil Google (user_metadata.avatar_url ou picture), avec initiales en secours
const props = withDefaults(defineProps<{ size?: number }>(), { size: 44 })

const { user } = storeToRefs(useAuthStore())
const failed = ref(false)

const meta = computed(() => (user.value?.user_metadata ?? {}) as Record<string, string | undefined>)
const src = computed(() => meta.value.avatar_url ?? meta.value.picture ?? null)
const name = computed(() => meta.value.full_name ?? meta.value.name ?? user.value?.email ?? '')
const initials = computed(() =>
  name.value.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?',
)

watch(src, () => { failed.value = false })
</script>

<template>
  <span class="avatar" :style="{ width: `${props.size}px`, height: `${props.size}px`, fontSize: `${props.size * 0.4}px` }">
    <img
      v-if="src && !failed" :src="src" :alt="`Photo de ${name}`" referrerpolicy="no-referrer"
      width="64" height="64" @error="failed = true"
    >
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>

<style scoped>
.avatar {
  flex: none; display: inline-grid; place-items: center; overflow: hidden;
  border-radius: 50%; background: var(--cobalt); color: var(--on-accent);
  font-weight: 800; border: 2px solid var(--paper); box-shadow: 0 0 0 1px var(--line);
}
.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
