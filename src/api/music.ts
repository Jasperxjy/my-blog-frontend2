import type { Music } from '@/types/music'
import { request } from '@/utils/request'
import type { Result } from '@/types/common'

export async function getAllMusic(): Promise<Result> {
  return request('/api/music/all', {
    method: 'GET'
  })
}

export async function uploadMusic(file: File, fileName: string, description: string): Promise<Result> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName)
  formData.append('description', description)

  return request('/api/music/upload', {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export async function updateMusic(musicId: string, music: Partial<Music>): Promise<Result> {
  return request(`/api/music/${musicId}`, {
    method: 'PUT',
    data: music
  })
}

export async function deleteMusic(musicId: string): Promise<Result> {
  return request(`/api/music/${musicId}`, {
    method: 'DELETE'
  })
}
