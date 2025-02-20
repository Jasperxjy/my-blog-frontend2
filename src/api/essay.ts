import { request } from '@/utils/request'
import type { Result } from '@/types/common'
import type { Collection, EssayBrief, Essay, EssayTag, Note } from '@/types/essay'

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

/**
 * 更新合集信息
 * @param collectionId - 合集ID
 * @param data - 更新的合集信息
 * @returns Promise<Result<Collection>> - 更新结果
 */
export async function updateCollection(
  collectionId: string,
  data: Partial<Collection>
): Promise<Result<Collection>> {
  return request(`/api/collection/${collectionId}`, {
    method: 'PUT',
    data
  })
}

/**
 * 删除合集
 * @param collectionId - 合集ID
 * @returns Promise<Result> - 删除结果
 */
export async function deleteCollection(collectionId: string): Promise<Result> {
  return request(`/api/collection/${collectionId}`, {
    method: 'DELETE'
  })
}



/**
 * 获取文章内容（普通用户）
 * @param essayId - 文章ID
 * @returns Promise<Result<Essay>> - 文章内容
 */
export async function getEssayView(essayId: string): Promise<Result<Essay>> {
  return request(`/api/essay/view/${essayId}`, {
    method: 'GET'
  })
}

/**
 * 获取文章内容（管理员）
 * @param essayId - 文章ID
 * @returns Promise<Result<Essay>> - 文章内容
 */
export async function getEssayEdit(essayId: string): Promise<Result<Essay>> {
  return request(`/api/essay/edit/${essayId}`, {
    method: 'GET'
  })
}

/**
 * 获取文章标签
 * @param essayId - 文章ID
 * @returns Promise<Result<EssayTag[]>> - 标签列表
 */
export async function getEssayTags(essayId: string): Promise<Result<EssayTag[]>> {
  return request('/api/essayTagList/getTagsByEssay', {
    method: 'GET',
    params: { essayId }
  })
}

/**
 * 获取文章的所有批注
 * @param essayId - 文章ID
 * @returns Promise<Result<Note[]>> - 批注列表
 */
export async function getEssayNotes(essayId: string): Promise<Result<Note[]>> {
  return request(`/api/note/essay/${essayId}`, {
    method: 'GET'
  })
}

/**
 * 创建新的批注记录
 * @param note - 批注对象（自动生成noteId和createTime字段）
 * @returns Promise<Result<Note>> - 包含新创建批注的响应结果
 */
export async function addNote(note: Omit<Note, 'noteId' | 'createTime'>): Promise<Result<Note>> {
  return request('/api/note/add', {
    method: 'POST',
    data: note
  })
}

export async function startEditEssay(essayId: string, userId: string): Promise<Result> {
  return request(`/api/essay/${essayId}/edit`, {
    method: 'POST',
    params: { userId }
  })
}

export async function updateEssayContext(essayId: string, essay: Essay): Promise<Result> {
  return request(`/api/essay/${essayId}/context`, {
    method: 'PUT',
    data: essay
  })
}

export async function endEditEssay(essayId: string, userId: string): Promise<Result> {
  return request(`/api/essay/${essayId}/end-edit`, {
    method: 'POST',
    params: { userId }
  })
}
