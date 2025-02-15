<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Tip {
  tipId: string
  content: string
  time: string
  status: number
}

const tips = ref<Tip[]>([])

const fetchTips = async () => {
  try {
    const response = await fetch('/tip/all')
    const result = await response.json()
    if (result.success) {
      tips.value = result.data
    }
  } catch (error) {
    console.error('获取贴士失败:', error)
  }
}

onMounted(() => {
  fetchTips()
})
</script>

<template>
  <div class="tips-container">
    <h2>日有所思，夜有所念</h2>
    <div class="tips-list">
      <div v-for="tip in tips" :key="tip.tipId" class="tip-card">
        <p class="tip-content">{{ tip.content }}</p>
        <span class="tip-time">{{ new Date(tip.time).toLocaleDateString() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tips-container {
  padding: 2rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tip-content {
  margin-bottom: 0.5rem;
}

.tip-time {
  color: #999;
  font-size: 0.9rem;
}
</style>
