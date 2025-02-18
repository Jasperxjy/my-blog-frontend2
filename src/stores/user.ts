import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfoDTO } from '@/types/auth'
import { checkPermission, UserRole } from '@/utils/permission'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(null)
  const userInfo = ref<UserInfoDTO | null>(null)


  // 设置用户 token
  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }
  // 设置用户信息
  const setUserInfo = (newUserInfo: UserInfoDTO) => {
    userInfo.value = newUserInfo
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo))
  }


  // 清除用户信息
  const clearUser = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 检查用户是否有指定权限
  const hasPermission = (requiredRole: string): boolean => {
    if (!userInfo.value?.userRole) return false
    return checkPermission(requiredRole as UserRole, userInfo.value.userRole)
  }

  // 检查是否为管理员
  const isAdmin = computed(() => {
    return userInfo.value?.userRole === UserRole.ADMIN
  })

  return {
    token,
    userInfo,
    setToken,
    clearUser,
    setUserInfo,
    hasPermission,
    isAdmin
  }
})
