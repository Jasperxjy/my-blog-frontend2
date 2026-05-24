<script setup lang="ts">
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import TipsList from '@/components/TipsList.vue'
import { Document, Picture, Headset } from '@element-plus/icons-vue'

const router = useRouter()

const quickLinks = [
  { label: '浏览文章', path: '/articles', icon: Document, desc: '阅读技术文章与心得' },
  { label: '查看相册', path: '/albums', icon: Picture, desc: '分享生活点滴瞬间' },
  { label: '欣赏音乐', path: '/music', icon: Headset, desc: '聆听收藏的音乐' },
]
</script>

<template>
  <div class="home">
    <NavBar />

    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">渠成的学习笔记</h1>
        <p class="hero-subtitle">分享生活，学习技术，记录点滴</p>
        <div class="hero-divider"></div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="quick-links">
      <div
        v-for="link in quickLinks"
        :key="link.path"
        class="quick-link-card"
        @click="router.push(link.path)"
      >
        <div class="quick-link-icon">
          <el-icon :size="32"><component :is="link.icon" /></el-icon>
        </div>
        <h3 class="quick-link-label">{{ link.label }}</h3>
        <p class="quick-link-desc">{{ link.desc }}</p>
      </div>
    </section>

    <main class="main-content">
      <TipsList />
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  width: 100%;
  background-color: var(--color-bg-page);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Hero 区域 */
.hero {
  width: 100%;
  padding: var(--space-16) var(--space-6) var(--space-10);
  text-align: center;
  position: relative;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: 0.04em;
  line-height: var(--leading-tight);
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  font-weight: 400;
  margin-bottom: var(--space-6);
}

.hero-divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-hover));
  border-radius: 2px;
  margin: 0 auto;
}

/* 快捷入口 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  max-width: 900px;
  width: 100%;
  padding: 0 var(--space-6);
  margin-bottom: var(--space-10);
}

.quick-link-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}

.quick-link-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-accent-light);
}

.quick-link-icon {
  color: var(--color-accent);
  margin-bottom: var(--space-4);
}

.quick-link-label {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.quick-link-desc {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin: 0;
}

.main-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-10) var(--space-12);
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 移动端 */
@media (max-width: 768px) {
  .hero {
    padding: var(--space-10) var(--space-4) var(--space-6);
  }

  .hero-title {
    font-size: var(--text-3xl);
  }

  .quick-links {
    grid-template-columns: 1fr;
    padding: 0 var(--space-4);
  }

  .main-content {
    padding: 0 var(--space-4) var(--space-8);
  }
}
</style>
