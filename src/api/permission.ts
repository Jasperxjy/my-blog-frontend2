import { request } from '@/utils/request'
import type { Result } from '@/types/common'

/**
 * 获取权限等级
 * @param targetId - 目标ID
 * @returns Promise<Result> - 权限等级
 */
export async function getPermissionLevel(targetId: string): Promise<Result> {
  return request('/api/permission/getPermissionLevel', {
    method: 'GET',
    params: { targetId }
  })
}

/**
 * 设置权限
 * @param targetId - 目标ID
 * @param level - 权限等级
 * @returns Promise<Result> - 设置结果
 */
export async function setPermission(targetId: string, level: string): Promise<Result> {
  return request('/api/permission/setPermission', {
    method: 'POST',
    params: { targetId, level }
  })
}

/**
 * 检查权限
 * @param userId - 用户ID
 * @param targetId - 目标ID
 * @returns Promise<Result> - 检查结果
 */
export async function hasPermission(userId: string, targetId: string): Promise<Result> {
  return request('/api/permission/hasPermission', {
    method: 'GET',
    params: { userId, targetId }
  })
}
