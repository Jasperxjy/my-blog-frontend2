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
