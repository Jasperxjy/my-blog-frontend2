import { request } from '@/utils/request'
import type { Result } from '@/types/common'
import type { CommentDTO, Comment } from '@/types/comment'

export async function getEssayComments(essayId: string): Promise<Result<CommentDTO[]>> {
  return request(`/api/comment/essay/${essayId}`)
}

export async function likeComment(commentId: string): Promise<Result<void>> {
  return request(`/api/comment/${commentId}/like`, {
    method: 'POST'
  })
}

export async function deleteComment(commentId: string): Promise<Result<void>> {
  return request(`/api/comment/${commentId}`, {
    method: 'DELETE'
  })
}

export async function createComment(comment: Comment): Promise<Result<void>> {
  return request('/api/comment', {
    method: 'POST',
    data: comment
  })
}
