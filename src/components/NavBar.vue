<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/notification'
import * as authApi from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const { showSuccess, showError } = useNotification()
const username = userStore.userInfo?.userName || '游客'

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
    userStore.clearUser() // 即使请求失败也清除本地状态
    showError('网络错误，请稍后重试')
    router.push('/login')
  }
}
</script>

<template>
  <nav class="nav-bar">
    <div class="left-menu">
      <router-link to="/essays">文章</router-link>
      <router-link to="/albums">相册</router-link>
      <router-link to="/music">音乐</router-link>
    </div>
    <div class="right-menu">
      <span class="username">{{ username }}</span>
      <button @click="handleLogout" class="logout-btn">登出</button>
    </div>
  </nav>
</template>

<style scoped>
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.left-menu a {
  margin-right: 2rem;
  text-decoration: none;
  color: #333;
}

.right-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #f56c6c;
  color: white;
  cursor: pointer;
}
</style>
