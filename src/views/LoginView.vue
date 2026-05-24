<template>
  <div class="login-page">
    <div class="welcome-section">
      <h1>欢迎来到渠成的个人学习网站</h1>
      <p>分享生活，学习技术，记录点滴</p>
    </div>

    <div class="auth-container">
      <div class="auth-tabs">
        <button :class="{ active: isLogin }" @click="isLogin = true">登录</button>
        <button :class="{ active: !isLogin }" @click="isLogin = false">注册</button>
      </div>

      <!-- 登录表单 -->
      <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-item">
          <input v-model="loginForm.email" type="text" placeholder="请输入账号" aria-label="邮箱账号">
          <span v-if="userInfo" class="user-status">
            <span class="user-name">{{ userInfo.userName }}</span>
            {{ getUserStatusText(userInfo.status ?? -1) }}
          </span>
          <span v-else-if="loginForm.email" class="user-status not-exist">
            用户不存在
          </span>
        </div>
        <div class="form-item">
          <input v-model="loginForm.password" type="password" placeholder="请输入密码" aria-label="密码">
        </div>
        <button type="submit">登录</button>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-item">
          <input v-model="registerForm.userName" type="text" placeholder="请输入用户名" aria-label="用户名">
        </div>
        <div class="form-item">
          <input v-model="registerForm.email" type="text" placeholder="请输入邮箱账号" aria-label="邮箱账号">
          <span v-if="userInfo" class="user-status">
            <span class="user-name">{{ userInfo.userName }}</span>
            {{ getUserStatusText(userInfo.status ?? -1) }}
          </span>
          <span v-else-if="registerForm.email" class="user-status not-exist">
            用户不存在
          </span>
        </div>
        <div class="form-item">
          <input v-model="registerForm.password" type="password" placeholder="请输入密码" aria-label="密码">
        </div>
        <div class="form-item">
          <select v-model="registerForm.role" aria-label="角色">
            <!-- <option value="ADMIN">管理员</option> -->
            <option value="FRIEND">好友</option>
            <option value="CLOSE_FRIEND">密友/亲人</option>
            <!-- <option value="GUEST">游客</option> -->
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
      if (result.success && result.data) {
        userInfo.value = result.data
        username.value = result.data.userName || ''

        // 如果是注册页面且用户已存在，显示提示
        if (!isLogin.value && result.data.status !== undefined) {
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
      userStore.setUserInfo(userInfo.value!)
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
  background: var(--color-bg-page);
  padding: var(--space-10) var(--space-5);
  position: relative;
}

/* 微妙的背景纹理 */
.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c45c48' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
  pointer-events: none;
}

.welcome-section {
  text-align: center;
  margin-bottom: var(--space-10);
  width: 100%;
  max-width: 800px;
  position: relative;
  z-index: 1;
}

.welcome-section h1 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: 0.02em;
}

.welcome-section p {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  font-weight: 400;
}

.auth-container {
  background: var(--color-bg-surface);
  padding: var(--space-10);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 520px;
  position: relative;
  z-index: 1;
  border: 1px solid var(--color-border);
}

.auth-tabs {
  display: flex;
  margin-bottom: var(--space-6);
  gap: var(--space-2);
}

.auth-tabs button {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: none;
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-out);
}

.auth-tabs button:hover {
  color: var(--color-text-secondary);
  background-color: var(--color-accent-subtle);
}

.auth-tabs button.active {
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
  font-weight: 600;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-item {
  position: relative;
}

.form-item input,
.form-item select {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-base);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.form-item input:focus,
.form-item select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.form-item input::placeholder {
  color: var(--color-text-tertiary);
}

.username-hint {
  position: absolute;
  top: -20px;
  left: 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* 提交按钮 */
.auth-form button[type="submit"] {
  width: 100%;
  padding: var(--space-4);
  font-size: var(--text-lg);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: white;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.auth-form button[type="submit"]:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.auth-form button[type="submit"]:active {
  transform: translateY(0);
}

.guest-login {
  margin-top: var(--space-8);
  width: 100%;
  max-width: 520px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.guest-login button {
  width: auto;
  min-width: 200px;
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.guest-login button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-subtle);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
  color: var(--color-text-inverse);
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.user-status {
  position: absolute;
  top: -20px;
  right: 0;
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background-color: var(--color-bg-page);
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
}

.user-status.not-exist {
  background-color: rgba(201, 72, 72, 0.08);
  color: var(--color-error);
  border-color: rgba(201, 72, 72, 0.15);
}

.user-name {
  color: var(--color-accent);
  margin-right: var(--space-2);
  font-weight: 600;
}

/* 移动端 */
@media (max-width: 640px) {
  .welcome-section h1 {
    font-size: var(--text-3xl);
  }

  .auth-container {
    padding: var(--space-6);
  }
}
</style>
