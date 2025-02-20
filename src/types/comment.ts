export interface CommentDTO {
  id: string
  essayId: string
  content: string
  senderUserId: string
  senderUsername: string
  commentTime: string
  commentLikeNum: number
  replyCommentId: string | null
}

export interface Comment {
  commentId: string
  essayId: string
  commentTime: string
  userId: string
  commentLikeNum: number
  commentVisible: string
  commentFatherId: string | null
  content: string
}
