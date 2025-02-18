<template>
  <div class="login-page">
    <div class="welcome-section">
      <h1>欢迎来到个人博客系统</h1>
      <p>分享生活，记录点滴</p>
    </div>

    <div class="auth-container">
      <div class="auth-tabs">
        <button :class="{ active: isLogin }" @click="isLogin = true">登录</button>
        <button :class="{ active: !isLogin }" @click="isLogin = false">注册</button>
      </div>

      <!-- 登录表单 -->
      <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-item">
          <input v-model="loginForm.email" type="text" placeholder="请输入账号">
          <span v-if="userInfo" class="user-status">
            <span class="user-name">{{ userInfo.userName }}</span>
            {{ getUserStatusText(userInfo.status ?? -1) }}
          </span>
          <span v-else-if="loginForm.email" class="user-status not-exist">
            用户不存在
          </span>
        </div>
        <div class="form-item">
          <input v-model="loginForm.password" type="password" placeholder="请输入密码">
        </div>
        <button type="submit">登录</button>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-item">
          <input v-model="registerForm.userName" type="text" placeholder="请输入用户名">
        </div>
        <div class="form-item">
          <input v-model="registerForm.email" type="text" placeholder="请输入邮箱账号">
          <span v-if="userInfo" class="user-status">
            <span class="user-name">{{ userInfo.userName }}</span>
            {{ getUserStatusText(userInfo.status ?? -1) }}
          </span>
          <span v-else-if="registerForm.email" class="user-status not-exist">
            用户不存在
          </span>
        </div>
        <div class="form-item">
          <input v-model="registerForm.password" type="password" placeholder="请输入密码">
        </div>
        <div class="form-item">
          <select v-model="registerForm.role">
            <option value="ADMIN">管理员</option>
            <option value="FRIEND">好友</option>
            <option value="CLOSE_FRIEND">亲人</option>
            <option value="GUEST">游客</option>
          </select>
        </div>
        <button type="submit">注册</button>
      </form>
    </div>

    <div class="guest-login">
      <button @click="handleGuestLogin">游客登录</button>
    </div>

    <div v-if="loading" class="loading-overlay">
      加载中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as authApi from '@/api/auth'
import type { LoginDTO, RegisterDTO } from '@/types/auth'
import { useNotification } from '@/composables/notification'
import { useUserStore } from '@/stores/user'
import type { UserInfoDTO } from '@/types/auth'

// 路由实例
const router = useRouter()
const { showError, showSuccess } = useNotification()

// 获取用户store
const userStore = useUserStore()

// 响应式状态
const isLogin = ref(true)          // 控制登录/注册表单切换
const username = ref('')           // 显示查询到的用户名
const errorMsg = ref('')          // 错误信息
const loading = ref(false)        // 加载状态

// 登录表单数据
const loginForm = ref<LoginDTO>({
  email: '',
  password: ''
})

// 注册表单数据
const registerForm = ref<RegisterDTO>({
  email: '',
  password: '',
  userName: '',
  role: 'user'
})
// 用户信息
const userInfo = ref<UserInfoDTO | null>({
  userName: '',
  userRole: '',
  userId: '',
  email: '',
  status: 0
})

/**
 * 防抖函数
 * @param fn - 需要防抖的函数
 * @param delay - 延迟时间
 */
function debounce<T extends (email: string) => Promise<void>>(
  fn: T,
  delay: number
): (email: string) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (email: string) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(email), delay)
  }
}

/**
 * 获取用户状态文本
 */
const getUserStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return '用户审核中'
    case 1:
      return '用户状态正常'
    case 2:
      return '用户已注销'
    case 3:
      return '用户已删除'
    default:
      return '未知状态'
  }
}

/**
 * 防抖处理的用户检查函数
 */
const debouncedCheckUser = debounce(async (email: string) => {
  if (email) {
    try {
      const result = await authApi.checkUser(email)
      if (result.success) {
        userInfo.value = result.data as UserInfoDTO
        username.value = userInfo.value.userName || ''

        // 如果是注册页面且用户已存在，显示提示
        if (!isLogin.value && userInfo.value.status !== undefined) {
          showError('该邮箱已被注册')
        }
      } else {
        username.value = ''
        userInfo.value = null
      }
    } catch {
      username.value = ''
      userInfo.value = null
      showError('用户查询失败，请稍后重试')
    }
  } else {
    username.value = ''
    userInfo.value = null
  }
}, 500)

// 监听登录表单邮箱变化
watch(
  () => loginForm.value.email,
  (newEmail) => debouncedCheckUser(newEmail)
)

// 监听注册表单邮箱变化
watch(
  () => registerForm.value.email,
  (newEmail) => debouncedCheckUser(newEmail)
)

/**
 * 表单验证
 * @param form - 表单数据
 * @returns boolean - 验证结果
 */
const validateForm = (form: LoginDTO | RegisterDTO): boolean => {
  if (!form.email) {
    errorMsg.value = '请输入账号'
    return false
  }
  if (!form.email.includes('@')) {
    errorMsg.value = '请输入有效的邮箱地址'
    return false
  }
  if (!form.password) {
    errorMsg.value = '请输入密码'
    return false
  }
  if ('userName' in form && !form.userName) {
    errorMsg.value = '请输入用户名'
    return false
  }
  return true
}

/**
 * 处理登录
 */
const handleLogin = async () => {
  if (!validateForm(loginForm.value)) {
    showError(errorMsg.value)
    return
  }

  try {
    loading.value = true
    errorMsg.value = ''
    const result = await authApi.login(loginForm.value)
    if (result.success && typeof result.data === 'string') {
      userStore.setToken(result.data)
      userStore.setUserInfo(userInfo.value as UserInfoDTO)
      router.push('/home')
    } else {
      showError(result.errorMsg || '登录失败')
    }
  } catch {
    showError('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 处理注册
 */
const handleRegister = async () => {
  if (!validateForm(registerForm.value)) {
    showError(errorMsg.value)
    return
  }

  // 检查用户是否已存在
  if (userInfo.value && userInfo.value.status !== undefined) {
    showError('该邮箱已被注册')
    return
  }

  try {
    loading.value = true
    errorMsg.value = ''
    const result = await authApi.register(registerForm.value)
    if (result.success) {
      isLogin.value = true
      loginForm.value.email = registerForm.value.email
      showSuccess('注册成功，请等待管理员审核')
      // 清空注册表单
      registerForm.value = {
        email: '',
        password: '',
        userName: '',
        role: 'GUEST'
      }
    } else {
      showError(result.errorMsg || '注册失败')
    }
  } catch {
    showError('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 处理游客登录
 */
const handleGuestLogin = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    const result = await authApi.guestLogin()
    if (result.success && typeof result.data === 'string') {
      userStore.setToken(result.data)
      userStore.setUserInfo({
        userName: '游客',
        userRole: 'GUEST',
        userId: '1279ab5352f882f16ddc0adbd2e06adf',
        email: '',
        status: 1
      })
      router.push('/home')
    }
  } catch {
    showError('游客登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 50px;
  color: #2c3e50;
  width: 100%;
  max-width: 800px;
}

.welcome-section h1 {
  font-size: 3.5em;
  margin-bottom: 20px;
  font-weight: 600;
}

.welcome-section p {
  font-size: 1.5em;
  color: #34495e;
}

.auth-container {
  background: white;
  padding: 50px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 520px;
}

.auth-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.auth-tabs button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
}

.auth-tabs button.active {
  color: #3498db;
  border-bottom: 2px solid #3498db;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  position: relative;
}

.form-item input,
.form-item select {
  width: 100%;
  padding: 16px;
  font-size: 1.1rem;
}

.username-hint {
  position: absolute;
  top: -20px;
  left: 0;
  font-size: 12px;
  color: #666;
}

button {
  width: 100%;
  padding: 16px;
  font-size: 1.2rem;
}

.guest-login {
  margin-top: 40px;
  width: 100%;
  max-width: 520px;
  text-align: center;
}

.guest-login button {
  width: auto;
  min-width: 200px;
  padding: 14px 30px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #3498db;
}

.user-status {
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #f0f0f0;
  color: #666;
}

.user-status.not-exist {
  background-color: #fff3f3;
  color: #ff4d4f;
}

.user-name {
  color: #1890ff;
  margin-right: 8px;
  font-weight: 500;
}
</style>
