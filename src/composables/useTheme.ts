import { ref, watch, onMounted } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'myblog-theme'
const theme = ref<Theme>('system')
const isDark = ref(false)

function applyTheme(dark: boolean) {
  isDark.value = dark
  const html = document.documentElement
  if (dark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

function resolveSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function syncTheme() {
  if (theme.value === 'system') {
    applyTheme(resolveSystemPreference())
  } else {
    applyTheme(theme.value === 'dark')
  }
}

export function useTheme() {
  onMounted(() => {
    // 读取本地存储
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      theme.value = saved
    }
    syncTheme()

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (theme.value === 'system') {
        applyTheme(e.matches)
      }
    })
  })

  watch(theme, (newTheme) => {
    localStorage.setItem(STORAGE_KEY, newTheme)
    syncTheme()
  })

  const toggleTheme = () => {
    const preferences: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'light',
      system: resolveSystemPreference() ? 'light' : 'dark',
    }
    theme.value = preferences[theme.value]
  }

  const setTheme = (t: Theme) => {
    theme.value = t
  }

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
