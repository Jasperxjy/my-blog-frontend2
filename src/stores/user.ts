import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfoDTO } from '@/types/auth'
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

  return {
    token,
    userInfo,
    setToken,
    clearUser,
    setUserInfo,

  }
})
