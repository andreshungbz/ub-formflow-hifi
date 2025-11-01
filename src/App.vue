<script setup lang="ts">
import { usePageTitle } from '@/composables/usePageTitle'
usePageTitle('UB FormFlow') // keeps document.title in sync with route.meta.title
</script>

<template>
  <header class="app-header">
    <h1>UB FormFlow</h1>
    <nav>
      <RouterLink to="/">Home</RouterLink>
    </nav>
  </header>

  <main class="app-main">
    <RouterView />
  </main>

  <footer class="app-footer">
    <p>© 2025 UB FormFlow</p>
  </footer>
</template>

<style src="./styles/globals.css"></style>
