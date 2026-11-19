<script setup lang="ts">
definePageMeta({ layout: 'blank' })
useHead({ title: "Conditions d'utilisation – Momentum" })
</script>

<template>
  <main class="legal">
    <h1>Conditions d'utilisation</h1>
    <p class="muted small">Dernière mise à jour : 19 novembre 2026</p>

    <h2>Objet</h2>
    <p>
      Momentum est une application gratuite de suivi du poids, de la course et de la nutrition.
      En l'utilisant, tu acceptes les présentes conditions.
    </p>

    <h2>Pas un avis médical</h2>
    <p>
      Les informations affichées (IMC, tendance, estimations) sont indicatives. Elles ne remplacent
      pas l'avis d'un médecin ou d'un diététicien. Consulte un professionnel de santé avant de
      modifier ton alimentation ou ton activité physique.
    </p>

    <h2>Disponibilité</h2>
    <p>
      Le service est fourni « en l'état », sans garantie de disponibilité, et peut évoluer ou
      s'arrêter à tout moment.
    </p>

    <h2>Ton compte</h2>
    <p>
      Tu es responsable de l'usage de ton compte Google. Tu peux demander la suppression de tes
      données à tout moment (voir la politique de confidentialité).
    </p>

    <NuxtLink to="/login">Retour</NuxtLink>
  </main>
</template>
