<script setup lang="ts">
import { RouterView } from 'vue-router'
import MusicPlayer from '@/components/MusicPlayer.vue'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
</script>

<template>
  <div class="app-container">
    <RouterView />
    <MusicPlayer
      v-model:visible="playerStore.isVisible"
      :current-music="playerStore.currentMusic"
      v-model:playing="playerStore.isPlaying"
    />
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* App容器样式 */
.app-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* RouterView不需要特殊的flex样式，移除可能导致问题的样式 */
.app-container > * {
  width: 100%;
}

header {
  line-height: 1.5;
  max-height: 150vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {

  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}

#app {
  min-height: 100vh;
  background-color: #f5f7fa;
}
</style>
