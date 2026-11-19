<script setup lang="ts">
useHead({ title: 'Confidentialité – Momentum' })
</script>

<template>
  <main class="page legal">
    <h1>Politique de confidentialité</h1>
    <p class="muted small">Dernière mise à jour : 19 novembre 2026</p>

    <h2>Qui est responsable ?</h2>
    <p>
      Momentum est une application personnelle de suivi du poids, de la course et de la nutrition,
      éditée par Nicolas Marquillier (GitHub : Nikuspokus).
    </p>

    <h2>Données collectées</h2>
    <ul>
      <li>Ton adresse e-mail, ton nom et ta photo de profil Google, reçus lors de la connexion « Se connecter avec Google ».</li>
      <li>Les données que tu saisis toi-même : pesées, objectifs, et plus tard repas et sorties.</li>
    </ul>

    <h2>Utilisation</h2>
    <p>
      Ces données servent uniquement à t'authentifier et à afficher ton suivi. Elles ne sont ni vendues,
      ni partagées avec des tiers, ni utilisées pour de la publicité.
    </p>

    <h2>Hébergement</h2>
    <p>
      Les données sont stockées chez Supabase (base de données en Europe). Chaque utilisateur
      n'a accès qu'à ses propres données grâce à des règles de sécurité au niveau des lignes.
    </p>

    <h2>Tes droits</h2>
    <p>
      Tu peux demander l'accès, la rectification ou la suppression de tes données à tout moment via
      <a href="https://github.com/Nikuspokus" target="_blank" rel="noopener">le profil GitHub de l'éditeur</a>.
    </p>

    <NuxtLink to="/login">Retour</NuxtLink>
  </main>
</template>
