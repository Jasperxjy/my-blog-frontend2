<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Close, VideoPlay, VideoPause } from '@element-plus/icons-vue'
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

// 添加加载锁和清理函数
let isPending = false

watch(() => props.currentMusic, async (newMusic) => {
  if (!newMusic || isPending) return
  isPending = true

  try {
    if (audio.value) {
      audio.value.pause()
      audio.value.src = `${MUSIC_BASE_URL}${newMusic.filePath}`
      await audio.value.load()

      if (props.playing) {
        await audio.value.play()
        isPlaying.value = true
      }
    }
  } catch (error) {
    console.error('音乐加载失败:', error)
  } finally {
    isPending = false
  }
})

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

        <el-icon class="close-btn" @click.stop="closePlayer">
          <Close />
        </el-icon>
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  user-select: none;
}

.music-player:not(.minimized) {
  width: 300px;
}

.minimized {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #409EFF;
  cursor: pointer;
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
  padding: 12px;
  background: #409EFF;
  color: white;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.minimize-btn,
.close-btn {
  cursor: pointer;
  font-size: 20px;
  transition: color 0.2s;
}

.minimize-btn:hover,
.close-btn:hover {
  color: #f56c6c;
}

.drag-handle {
  font-weight: bold;
}

.player-content {
  padding: 16px;
}

.music-info {
  margin-bottom: 12px;
  text-align: center;
}

.music-name {
  font-weight: bold;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.progress-bar .el-slider {
  flex: 1;
}

.time {
  font-size: 12px;
  color: #666;
  min-width: 40px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
