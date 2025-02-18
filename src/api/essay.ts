import { request } from '@/utils/request'
import type { Result } from '@/types/common'
import type { Collection, EssayBrief } from '@/types/essay'

/**
 * 获取合集列表
 * @returns Promise<Result<Collection[]>> - 合集列表
 */
export async function getCollections(): Promise<Result<Collection[]>> {
  return request('/api/collection', {
    method: 'GET'
  })
}

/**
 * 获取文章列表
 * @param collectionId - 合集ID（可选）
 * @returns Promise<Result<EssayBrief[]>> - 文章列表
 */
export async function getEssayBriefs(collectionId?: string): Promise<Result<EssayBrief[]>> {
  return request('/api/essay/brief', {
    method: 'GET',
    params: { collectionId }
  })
}

/**
 * 创建新合集
 * @param data - 合集信息
 * @returns Promise<Result<Collection>> - 创建结果
 */
export async function createCollection(data: {
  collectionName: string
  collectionAbstract: string
  collectionId: string
}): Promise<Result<Collection>> {
  return request('/api/collection', {
    method: 'POST',
    data
  })
}
