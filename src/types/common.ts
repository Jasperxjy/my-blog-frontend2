export interface Result<T = unknown> {
  success: boolean
  errorMsg?: string
  data?: T
  total?: number
}
