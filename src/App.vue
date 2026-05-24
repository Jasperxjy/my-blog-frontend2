<script setup lang="ts">
import { RouterView } from 'vue-router'
import MusicPlayer from '@/components/MusicPlayer.vue'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
</script>

<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <footer class="site-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank">蜀ICP备2025125475号-1</a>
      <span class="footer-sep">·</span>
      <router-link to="/about">网站使用指南</router-link>
    </footer>

    <MusicPlayer
      :visible="playerStore.isVisible"
      :current-music="playerStore.currentMusic"
      :playing="playerStore.isPlaying"
      @update:visible="playerStore.toggleVisible"
      @update:playing="playerStore.togglePlaying"
    />
  </div>
</template>

<style>
/* App 容器 */
.app-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
}

/* 页脚 */
.site-footer {
  width: 100%;
  padding: var(--space-5) var(--space-4);
  text-align: center;
  background-color: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-3);
  margin-top: auto;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.site-footer a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.site-footer a:hover {
  color: var(--color-accent);
}

.footer-sep {
  color: var(--color-border-strong);
}

/* 页面过渡 */
.page-enter-active,
.page-leave-active {
  transition: opacity var(--duration-slow) var(--ease-out),
              transform var(--duration-slow) var(--ease-out);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
