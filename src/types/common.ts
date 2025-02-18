export interface Result<T = unknown> {
  success: boolean
  errorMsg?: string
  data?: T
  total?: number
}

export interface Tip {
  tipId: string
  content: string
  time: string
  status: number
}
