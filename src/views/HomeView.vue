<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import TipsList from '@/components/TipsList.vue'
</script>

<template>
  <div class="home">
    <NavBar />
    <main class="main-content">
      <TipsList />
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
