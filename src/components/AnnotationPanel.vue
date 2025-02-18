<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Note } from '@/types/essay'

const props = defineProps<{
  notes: Note[]
}>()

interface AnnotationPosition {
  noteId: string
  markerRect: DOMRect | null
  content: string
  createTime: string
}

const annotationPositions = ref<AnnotationPosition[]>([])

const scrollY = computed(() => window.scrollY)

// 更新批注位置信息
const updatePositions = () => {
  annotationPositions.value = props.notes.map(note => {
    const markerElement = document.querySelector(`[data-annotation-id="${note.noteId}"]`);
    const markerRect = markerElement ? markerElement.getBoundingClientRect() : null;
    return {
      noteId: note.noteId,
      markerRect,
      content: note.content,
      createTime: note.createTime
    };
  });
}

// 使用 ResizeObserver 监听容器大小变化
let resizeObserver: ResizeObserver
onMounted(() => {
  resizeObserver = new ResizeObserver(updatePositions)
  const container = document.querySelector('.markdown-viewer')
  if (container) {
    resizeObserver.observe(container)
  }

  // 监听滚动事件
  window.addEventListener('scroll', updatePositions, { passive: true })
  // 初始更新位置
  updatePositions()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', updatePositions)
})
</script>

<template>
  <div class="annotation-panel">
    <div
      v-for="pos in annotationPositions"
      :key="pos.noteId"
      v-show="pos.markerRect"
      class="annotation-item"
      :style="{
        top: pos.markerRect ? `${pos.markerRect.top + scrollY}px` : '0'
      }"
    >
      <div class="annotation-content">
        <div class="annotation-text">{{ pos.content }}</div>
        <div class="annotation-time">{{ pos.createTime }}</div>
      </div>
      <svg class="connector" :style="{ height: '2px' }">
        <line
          :x1="0"
          :y1="1"
          :x2="40"
          :y2="1"
          stroke="#ddd"
          stroke-width="2"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.annotation-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 300px;
  height: 100vh;
  background: #f9f9f9;
  border-left: 1px solid #eee;
  padding: 20px;
  overflow-y: auto;
}

.annotation-item {
  position: absolute;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  transform: translateY(-50%);
}

.annotation-content {
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-left: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.annotation-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px;
}

.annotation-time {
  font-size: 12px;
  color: #999;
}

.connector {
  position: absolute;
  left: 0;
  top: 50%;
  width: 40px;
}
</style>
