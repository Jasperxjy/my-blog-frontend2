export interface Collection {
  collectionId: string
  collectionName: string
  collectionAbstract: string
  requiredRole?: string
}

export interface EssayBrief {
  essayId: string
  essayTitle: string
  classId: string
}
export interface Essay {
  essayId: string
  essayTitle: string
  essayAddTime: string
  essayLastChangeTime: string
  essayType: string
  essayContext: string
  essayLikeNum: number
  essayViewNum: number
  essayCollectionNum: number
  userId: string
  version: number
  status: number
  classId: string
}

export interface EssayTag {
  essayTagId: string
  essayTagName: string
}

export interface Note {
  noteId: string
  userId: string
  content: string
  position: number
  createTime: string
  essayId: string
}
