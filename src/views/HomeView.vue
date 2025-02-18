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
  width: 100%;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 4rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
