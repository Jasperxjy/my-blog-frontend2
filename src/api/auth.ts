import { request } from '@/utils/request'
import type { LoginDTO, RegisterDTO } from '@/types/auth'
import type { Result } from '@/types/common'

/**
 * 用户登录
 * @param data - 登录信息
 * @returns Promise<Result> - 登录结果
 */
export async function login(data: LoginDTO): Promise<Result> {
  return request('/api/user/login', {
    method: 'post',
    data,
  })
}

/**
 * 用户注册
 * @param data - 注册信息
 * @returns Promise<Result> - 注册结果
 */
export async function register(data: RegisterDTO): Promise<Result> {
  return request('/api/user/register', {
    method: 'post',
    data,
  })
}

/**
 * 检查用户邮箱
 * @param email - 用户邮箱
 * @returns Promise<Result> - 查询结果
 */
export async function checkUser(email: string): Promise<Result> {
  return request(`/api/user/check`, {
    params: { email },
  })
}

/**
 * 游客登录
 * @returns Promise<Result> - 登录结果
 */
export async function guestLogin(): Promise<Result> {
  return request('/api/user/guest')
}

/**
 * 用户登出
 * @returns Promise<Result> - 登出结果
 */
export async function logout(): Promise<Result> {
  return request('/api/user/logout', {
    method: 'get',
  })
}
