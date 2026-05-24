<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Close, VideoPlay, VideoPause, Minus } from '@element-plus/icons-vue'
import type { Music } from '@/types/music'
import { MUSIC_BASE_URL } from '@/utils/constants'

const props = defineProps<{
  visible: boolean
  currentMusic: Music | null
  playing: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:playing': [value: boolean]
}>()

const audio = ref<HTMLAudioElement | null>(null)
const audioUrl = ref<string | null>(null)
const isDragging = ref(false)
const position = ref({ x: 20, y: window.innerHeight - 200 })
const progress = ref(0)

// 播放器状态
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const isMinimized = ref(false)

// 监听当前音乐变化
watch(() => props.currentMusic, async (newMusic) => {
  if (newMusic && audio.value) {
    try {
      // 先暂停当前播放
      await audio.value.pause()
      isPlaying.value = false
      emit('update:playing', false)

      const musicUrl = `${MUSIC_BASE_URL}${newMusic.filePath}`
      audio.value.src = musicUrl

      // 等待音频加载完成
      await audio.value.load()

      // 只有在组件未被卸载且应该播放时才播放
      if (audio.value && props.playing) {
        await audio.value.play()
        isPlaying.value = true
        emit('update:playing', true)
      }
    } catch (error) {
      console.error('播放音乐失败:', error)
      isPlaying.value = false
      emit('update:playing', false)
    }
  }
})





// 监听播放状态变化
watch(() => props.playing, async (newPlaying) => {
  if (audio.value) {
    try {
      if (newPlaying) {
        await audio.value.play()
      } else {
        await audio.value.pause()
      }
      isPlaying.value = newPlaying
    } catch (error) {
      console.error('播放控制失败:', error)
      isPlaying.value = false
      emit('update:playing', false)
    }
  }
})

// 播放控制
const togglePlay = async () => {
  if (!audio.value || !props.currentMusic) return

  try {
    if (isPlaying.value) {
      await audio.value.pause()
    } else {
      await audio.value.play()
    }
    isPlaying.value = !isPlaying.value
    emit('update:playing', isPlaying.value)
  } catch (error) {
    console.error('播放控制失败:', error)
  }
}

// 拖动相关
const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  const startX = e.clientX - position.value.x
  const startY = e.clientY - position.value.y

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    position.value = {
      x: e.clientX - startX,
      y: e.clientY - startY
    }
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 关闭播放器
const closePlayer = () => {
  if (audio.value) {
    audio.value.pause()
  }
  emit('update:visible', false)
  emit('update:playing', false)
}
// 添加播放结束处理
const handleEnded = () => {
  isPlaying.value = false
  emit('update:playing', false)
  progress.value = 0
  currentTime.value = 0
}

// 增强清理函数
const cleanup = () => {
  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
    audio.value.removeEventListener('timeupdate', updateProgress)
    audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
    audio.value.removeEventListener('ended', handleEnded)
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
}

// 更新进度
const updateProgress = (e: Event) => {
  const audioEl = e.target as HTMLAudioElement
  currentTime.value = audioEl.currentTime
  if (!isDragging.value) {
    progress.value = (audioEl.currentTime / audioEl.duration) * 100
  }
}

// 增强进度控制逻辑
const handleProgressChange = (newProgress: number) => {
  if (!audio.value || isNaN(audio.value.duration)) return

  const time = (newProgress / 100) * audio.value.duration
  audio.value.currentTime = time
  currentTime.value = time
  progress.value = newProgress
}

// 更新元数据监听
const handleLoadedMetadata = (e: Event) => {
  const audioEl = e.target as HTMLAudioElement
  duration.value = audioEl.duration || 0
  if (audioEl.readyState > 0) {
    progress.value = (audioEl.currentTime / audioEl.duration) * 100
  }
}

// 格式化时间
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}


onMounted(() => {
  if (audio.value && props.currentMusic && audioUrl.value) {
    audio.value.src = audioUrl.value
  }
})

onUnmounted(cleanup)

</script>

<template>
  <div v-if="visible"
       :class="['music-player', { 'minimized': isMinimized }]"
       :style="{ left: `${position.x}px`, top: `${position.y}px` }"
       @mousedown.stop="startDrag">
    <div v-if="!isMinimized" class="player-header">
      <span class="drag-handle">♫ 音乐播放器</span>
      <div class="header-controls">
        <el-icon class="minimize-btn" @click.stop="isMinimized = true">
          <Minus />
        </el-icon>
        <el-icon class="close-btn" @click.stop="closePlayer">
          <Close />
        </el-icon>
      </div>
    </div>

    <!-- 最小化状态 -->
    <div v-else class="minimized" @click.stop="isMinimized = false">
      <div class="minimized-content">
        <el-icon :size="24"><VideoPlay v-if="!isPlaying" /><VideoPause v-else /></el-icon>
      </div>
    </div>

    <div v-if="!isMinimized" class="player-content">
      <div class="music-info">
        <span class="music-name">{{ currentMusic?.fileName || '未选择音乐' }}</span>
      </div>

      <div class="progress-bar" @mousedown.stop>
        <span class="time">{{ formatTime(currentTime) }}</span>
        <el-slider
          v-model="progress"
          :max="100"
          :show-tooltip="false"
          @change="handleProgressChange"
          @input="isDragging = true"
          @mouseup="isDragging = false"
        />
        <span class="time">{{ formatTime(duration) }}</span>
      </div>

      <div class="controls">
        <el-button
          type="primary"
          circle
          @click.stop="togglePlay"
        >
          <el-icon>
            <component :is="isPlaying ? VideoPause : VideoPlay" />
          </el-icon>
        </el-button>
      </div>

      <audio
        ref="audio"
        @timeupdate="updateProgress"
        @loadedmetadata="duration = ($event.target as HTMLAudioElement).duration"
        @ended="isPlaying = false"
      />
    </div>
  </div>
</template>

<style scoped>
.music-player {
  position: fixed;
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  user-select: none;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: box-shadow var(--duration-normal) var(--ease-out);
}

.music-player:hover {
  box-shadow: var(--shadow-xl);
}

.music-player:not(.minimized) {
  width: 320px;
}

.minimized {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-accent);
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.minimized:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-xl);
}

.minimized-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.player-header {
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  color: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.header-controls {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.minimize-btn,
.close-btn {
  cursor: pointer;
  font-size: 18px;
  transition: all var(--duration-fast) var(--ease-out);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.minimize-btn:hover,
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.drag-handle {
  font-weight: 600;
  font-size: var(--text-sm);
  letter-spacing: 0.02em;
}

.player-content {
  padding: var(--space-5);
}

.music-info {
  margin-bottom: var(--space-4);
  text-align: center;
}

.music-name {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-2);
  margin-bottom: var(--space-4);
}

.progress-bar :deep(.el-slider__runway) {
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-border-strong);
}

.progress-bar :deep(.el-slider__bar) {
  background-color: var(--color-accent);
  border-radius: 2px;
}

.progress-bar :deep(.el-slider__button) {
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-accent);
  background: var(--color-bg-surface);
  transition: transform var(--duration-fast) var(--ease-out);
}

.progress-bar :deep(.el-slider__button:hover) {
  transform: scale(1.3);
}

.time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  min-width: 40px;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.controls {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}

.controls :deep(.el-button) {
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.controls :deep(.el-button:hover) {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}
</style>
