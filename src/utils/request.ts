import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import type { Result } from '@/types/common'

// 后端API的基础URL
const BASE_URL = 'http://47.108.171.144:8080'

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // 允许携带凭证

  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const userStore = useUserStore()
    const newToken = response.headers['new-token']
    if (newToken) {
      userStore.setToken(newToken)
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * 统一的请求处理函数
 * @param url - 请求路径
 * @param options - fetch配置项
 * @returns Promise<any> - 返回处理后的响应数据
 */
export async function request<T = unknown>(
  url: string,
  options?: AxiosRequestConfig,
): Promise<Result<T>> {
  try {
    const response = await service({
      url,
      ...options,
    })
    return response.data
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('请求失败')
  }
}
