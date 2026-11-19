<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Accueil', icon: 'home' },
  { to: '/repas', label: 'Repas', icon: 'meal' },
  { to: '/course', label: 'Course', icon: 'track' },
  { to: '/renfo', label: 'Renfo', icon: 'dumbbell' },
  { to: '/profil', label: 'Profil', icon: 'user' },
] as const
</script>

<template>
  <div>
    <main class="shell">
      <slot />
    </main>
    <nav class="tabs" aria-label="Navigation principale">
      <div class="tabs-inner">
        <NuxtLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab">
          <UiIcon :name="tab.icon" />
          <span>{{ tab.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
