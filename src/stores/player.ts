import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Music } from '@/types/music'

export const usePlayerStore = defineStore('player', () => {
  const currentMusic = ref<Music | null>(null)
  const isVisible = ref(false)
  const isPlaying = ref(false)

  const play = (music: Music) => {
    currentMusic.value = music
    isVisible.value = true
    isPlaying.value = true
  }

  const toggleVisible = (visible: boolean) => {
    isVisible.value = visible
  }

  const togglePlaying = (playing: boolean) => {
    isPlaying.value = playing
  }

  return {
    currentMusic,
    isVisible,
    isPlaying,
    play,
    toggleVisible,
    togglePlaying
  }
})
