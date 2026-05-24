<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Top, Bottom } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  mode?: 'fixed' | 'sticky'
}>(), {
  mode: 'fixed'
})

const visible = ref(false)

const checkVisible = () => {
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = window.innerHeight
  visible.value = scrollHeight > clientHeight + 20
}

const scrollTo = (position: 'top' | 'bottom') => {
  const target = position === 'top' ? 0 : document.documentElement.scrollHeight
  window.scrollTo({ top: target, behavior: 'smooth' })
}

onMounted(() => {
  checkVisible()
  window.addEventListener('scroll', checkVisible, { passive: true })
  window.addEventListener('resize', checkVisible)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', checkVisible)
  window.removeEventListener('resize', checkVisible)
})
</script>

<template>
  <transition name="fade">
    <div v-show="visible" class="scroll-to-buttons" :class="mode">
      <button class="scroll-btn" @click="scrollTo('top')" title="回到顶部">
        <el-icon><Top /></el-icon>
      </button>
      <button class="scroll-btn" @click="scrollTo('bottom')" title="去往底部">
        <el-icon><Bottom /></el-icon>
      </button>
    </div>
  </transition>
</template>

<style scoped>
.scroll-to-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

/* fixed 模式：固定在视口右下角 */
.scroll-to-buttons.fixed {
  position: fixed;
  right: 24px;
  bottom: 40px;
}

/* sticky 模式：粘在容器右下角 */
.scroll-to-buttons.sticky {
  position: sticky;
  bottom: 24px;
  align-self: flex-end;
  margin-right: -54px;
  margin-top: 24px;
}

.scroll-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: var(--shadow-md);
  transition: all var(--duration-fast) var(--ease-out);
}

.scroll-btn:hover {
  background-color: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.scroll-btn:active {
  transform: translateY(0);
}

/* 暗色模式适配 */
html.dark .scroll-btn {
  background-color: var(--color-bg-surface);
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
}

html.dark .scroll-btn:hover {
  background-color: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

/* 移动端 */
@media (max-width: 768px) {
  .scroll-to-buttons.fixed {
    right: 12px;
    bottom: 24px;
  }

  .scroll-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
