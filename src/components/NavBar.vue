<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/notification'
import { useTheme } from '@/composables/useTheme'
import { checkPermission, UserRole } from '@/utils/permission'
import * as authApi from '@/api/auth'
import { computed, ref } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { showSuccess, showError } = useNotification()
const { isDark, toggleTheme } = useTheme()
const username = userStore.userInfo?.userName || '游客'

const isAdmin = computed(() =>
  checkPermission(UserRole.ADMIN, userStore.userInfo?.userRole)
)

const navItems = computed(() => [
  { label: '文章', path: '/articles' },
  { label: '相册', path: '/albums' },
  { label: '音乐', path: '/music' },
  ...(isAdmin.value ? [{ label: '用户管理', path: '/users' }] : []),
])

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')

const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  try {
    if (!userStore.token) {
      userStore.clearUser()
      router.push('/login')
      return
    }

    const result = await authApi.logout()
    if (result.success) {
      userStore.clearUser()
      showSuccess('已安全退出')
      router.push('/login')
    } else {
      showError(result.errorMsg || '登出失败')
    }
  } catch (error) {
    userStore.clearUser()
    showError('网络错误，请稍后重试')
    router.push('/login')
  }
}
</script>

<template>
  <nav class="nav-bar">
    <div class="nav-brand">
      <router-link to="/home" class="brand-link">渠成的笔记</router-link>
    </div>

    <div class="nav-links">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['nav-link', { active: isActive(item.path) }]"
      >
        {{ item.label }}
      </router-link>
    </div>

    <!-- 移动端汉堡菜单按钮 -->
    <button
      class="mobile-menu-btn"
      @click="mobileMenuOpen = !mobileMenuOpen"
      aria-label="打开菜单"
    >
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    </button>

    <!-- 移动端抽屉菜单 -->
    <div v-if="mobileMenuOpen" class="mobile-drawer-overlay" @click="mobileMenuOpen = false">
      <div class="mobile-drawer" @click.stop>
        <div class="mobile-drawer-header">
          <span class="brand-link">渠成的笔记</span>
          <button class="drawer-close" @click="mobileMenuOpen = false" aria-label="关闭菜单">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="mobile-drawer-links">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="['mobile-nav-link', { active: isActive(item.path) }]"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </router-link>
        </div>
        <div class="mobile-drawer-footer">
          <span class="username">{{ username }}</span>
          <button @click="handleLogout" class="logout-btn">登出</button>
        </div>
      </div>
    </div>

    <div class="nav-actions">
      <button
        class="theme-toggle"
        @click="toggleTheme"
        :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
        aria-label="切换主题"
      >
        <svg v-if="isDark" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
      <span class="username">{{ username }}</span>
      <button @click="handleLogout" class="logout-btn">登出</button>
    </div>
  </nav>
</template>

<style scoped>
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-8);
  height: 60px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal) var(--ease-out);
}

html.dark .nav-bar {
  background: rgba(30, 30, 30, 0.8);
  border-bottom-color: var(--color-border);
}

.nav-brand {
  flex-shrink: 0;
}

.brand-link {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  text-decoration: none;
  letter-spacing: 0.05em;
  transition: color var(--duration-fast) var(--ease-out);
}

.brand-link:hover {
  color: var(--color-accent);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.nav-link {
  position: relative;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) var(--ease-out),
              background-color var(--duration-fast) var(--ease-out);
}

.nav-link:hover {
  color: var(--color-text-primary);
  background-color: var(--color-accent-subtle);
}

.nav-link.active {
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 1px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}

.theme-toggle:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.icon {
  width: 18px;
  height: 18px;
}

.username {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.logout-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.logout-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background-color: rgba(201, 72, 72, 0.06);
}

/* 移动端适配 */
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  margin-left: auto;
}

.mobile-menu-btn:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.mobile-drawer-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  z-index: 200;
  backdrop-filter: blur(4px);
}

.mobile-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: var(--color-bg-surface);
  border-left: 1px solid var(--color-border);
  z-index: 201;
  display: flex;
  flex-direction: column;
  animation: slide-in-right var(--duration-normal) var(--ease-out) both;
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.drawer-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-close:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.mobile-drawer-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  gap: var(--space-1);
}

.mobile-nav-link {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-out);
}

.mobile-nav-link:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-text-primary);
}

.mobile-nav-link.active {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  font-weight: 600;
}

.mobile-drawer-footer {
  padding: var(--space-5);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

@media (max-width: 768px) {
  .nav-bar {
    padding: 0 var(--space-4);
  }

  .brand-link {
    font-size: var(--text-lg);
  }

  .nav-links {
    display: none;
  }

  .nav-actions {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }
}
</style>
