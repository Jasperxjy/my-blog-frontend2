<script setup lang="ts">
import { ref, watch, onUnmounted ,computed} from 'vue'
import type { Note } from '@/types/essay'

const props = defineProps<{
  notes: Note[]
  selectedAnnotation: {
    id: string
    pos: DOMRect | null
  }
  userRole?: string
}>()

const emit = defineEmits(['close'])
const panelRef = ref<HTMLDivElement | null>(null)
const connections = ref<SVGElement[]>([])

// 清除所有连接线
const clearConnections = () => {
  connections.value.forEach(svg => svg.remove())
  connections.value = []
}

// 过滤当前显示的批注
const currentNote = computed(() => {
  return props.notes.find(note => note.noteId === props.selectedAnnotation.id)
})

// 关闭批注卡片
const handleClose = () => {
  emit('close')
}

// 绘制连接线
const drawConnection = (start: DOMRect, end: DOMRect) => {
  clearConnections()

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.style.position = 'fixed'
  svg.style.top = '0'
  svg.style.left = '0'
  svg.style.width = '100%'
  svg.style.height = '100%'
  svg.style.pointerEvents = 'none'
  svg.style.zIndex = '1000'

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  const startX = start.right
  const startY = start.top + start.height / 2
  const endX = end.left
  const endY = end.top + end.height / 2

  // 贝塞尔曲线控制点
  const controlX = (endX - startX) * 0.5 + startX

  path.setAttribute(
    'd',
    `M ${startX},${startY}
     C ${controlX},${startY}
       ${controlX},${endY}
       ${endX},${endY}`
  )

  path.setAttribute('stroke', '#FFB800')
  path.setAttribute('stroke-width', '2')
  path.setAttribute('fill', 'none')

  svg.appendChild(path)
  document.body.appendChild(svg)
  connections.value.push(svg)
}

// 监听选中的批注变化
watch(
  () => props.selectedAnnotation,
  (newVal) => {
    if (newVal.id && newVal.pos && panelRef.value) {
      const noteCard = panelRef.value.querySelector(`[data-note-id="${newVal.id}"]`)
      if (noteCard) {
        const cardRect = noteCard.getBoundingClientRect()
        drawConnection(newVal.pos, cardRect)
      }
    } else {
      clearConnections()
    }
  },
  { deep: true }
)

onUnmounted(() => {
  clearConnections()
})
</script>

<template>
 <div ref="panelRef" class="annotation-panel">
    <div v-if="currentNote" class="note-card">
      <div class="note-header">
        <div class="user-info">用户：{{ currentNote.userId }}</div>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="note-content">{{ currentNote.content }}</div>
      <div class="note-footer">
        <div class="note-time">{{ new Date(currentNote.createTime).toLocaleString() }}</div>
        <button
          v-if="userRole && ['CLOSE_FRIEND', 'ADMIN'].includes(userRole)"
          class="edit-btn"
        >
          编辑
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.annotation-panel {
  transition: transform 0.3s ease;
  transform: translateX(100%);
}

.annotation-panel::v-deep(.note-card) {
  transition: opacity 0.3s ease;
}

.annotation-panel:has(.note-card) {
  transform: translateX(0);
}
.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.note-card {
  position: relative;
  padding: 1rem;
  margin: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.user-info {
  font-weight: 500;
  color: #333;
}

.note-card.active {
  background: #fff;
  border-color: #FFB800;
  box-shadow: 0 2px 8px rgba(255, 184, 0, 0.1);
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  padding: 0 0.5rem;
}

.close-btn:hover {
  color: #666;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.edit-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn:hover {
  background: #66b1ff;
}

.note-content {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.note-time {
  font-size: 0.85rem;
  color: #999;
}
</style>
