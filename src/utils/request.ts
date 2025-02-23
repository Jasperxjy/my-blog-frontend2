import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import type { Result } from '@/types/common'

// 服务器基础URL
export const BASE_URL = 'http://47.108.171.144:80'
// 图片资源基础URL，与后端服务器相同
export const IMAGE_BASE_URL = 'http://47.108.171.144:80'

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // 允许携带凭证
  timeout: 30000,
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
    const newToken = response.headers['NewToken']
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

// 新增：用于处理音频流的请求函数
export async function requestAudioStream(
  url: string,
  options?: AxiosRequestConfig,
): Promise<Blob> {
  try {
    const response = await service({
      url,
      responseType: 'blob',
      ...options,
    })
    return response.data
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('音频流请求失败')
  }
}
