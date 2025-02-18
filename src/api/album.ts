import { request } from '@/utils/request'
import type { Result } from '@/types/common'
import type { Album } from '@/types/album'

/**
 * 获取所有相册
 * @returns Promise<Result> - 相册列表
 */
export async function getAllAlbums(): Promise<Result> {
  return request('/api/album', {
    method: 'GET'
  })
}

/**
 * 创建相册
 * @param data - 相册信息
 * @returns Promise<Result> - 创建结果
 */
export async function createAlbum(data: Album): Promise<Result> {
  return request('/api/album', {
    method: 'POST',
    data
  })
}

/**
 * 更新相册
 * @param id - 相册ID
 * @param data - 相册信息
 * @returns Promise<Result> - 更新结果
 */
export async function updateAlbum(id: string, data: Album): Promise<Result> {
  return request(`/api/album/${id}`, {
    method: 'PUT',
    data
  })
}

/**
 * 删除相册
 * @param id - 相册ID
 * @returns Promise<Result> - 删除结果
 */
export async function deleteAlbum(id: string): Promise<Result> {
  return request(`/api/album/${id}`, {
    method: 'DELETE'
  })
}

/**
 * 获取相册详情
 * @param id - 相册ID
 * @returns Promise<Result> - 相册详情
 */
export async function getAlbumDetails(id: string): Promise<Result> {
  return request(`/api/album/${id}`, {
    method: 'GET'
  })
}

/**
 * 合并相册
 * @param sourceId - 源相册ID
 * @param targetId - 目标相册ID
 * @returns Promise<Result> - 合并结果
 */
export async function mergeAlbums(sourceId: string, targetId: string): Promise<Result> {
  return request('/api/album/merge', {
    method: 'GET',
    params: { sourceId, targetId }
  })
}
