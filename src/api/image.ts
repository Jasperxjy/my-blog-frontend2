import { request } from '@/utils/request'
import type { Result } from '@/types/common'
import type { Image } from '@/types/image'

/**
 * 获取相册中的图片
 * @param albumId - 相册ID
 * @returns Promise<Result> - 图片列表
 */
export async function getImagesByAlbum(albumId: string): Promise<Result> {
  return request(`/api/image/album/${albumId}`, {
    method: 'GET'
  })
}

/**
 * 更新图片信息
 * @param imageId - 图片ID
 * @param data - 图片信息
 * @returns Promise<Result> - 更新结果
 */
export async function updateImage(
  imageId: string,
  data: Partial<Omit<Image, 'imageId' | 'updateTime'>>
): Promise<Result> {
  return request(`/api/image/${imageId}/update`, {
    method: 'PUT',
    data
  })
}

/**
 * 删除图片
 * @param imageId - 图片ID
 * @returns Promise<Result> - 删除结果
 */
export async function deleteImage(imageId: string): Promise<Result> {
  return request(`/api/image/${imageId}/del`, {
    method: 'DELETE'
  })
}

/**
 * 上传图片
 * @param file - 图片文件
 * @param albumId - 相册ID（可选）
 * @param description - 图片描述（可选）
 * @returns Promise<Result> - 上传结果
 */
export async function uploadImage(
  file: File,
  albumId?: string,
  description?: string
): Promise<Result> {
  const formData = new FormData()
  formData.append('file', file)
  if (albumId) formData.append('albumId', albumId)
  if (description) formData.append('description', description)

  return request('/api/image/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  })
}

export async function uploadFileImage(
  file: File,
  essayId?: string,
): Promise<Result> {
  const formData = new FormData()
  formData.append('file', file)
  if (essayId) formData.append('essayId', essayId)

  return request('/api/image/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  })
}
