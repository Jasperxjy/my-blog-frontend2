export interface LoginDTO {
  email: string
  password: string
}

export interface RegisterDTO {
  email: string
  password: string
  userName: string
  role: string
}

export interface UserInfoDTO {
  userName?: string
  userRole?: string
  userId?: string
  email?: string
  status?: number
}

export interface Result<T = unknown> {
  success: boolean
  errorMsg?: string
  data?: T
  total?: number
}

export interface LoginResponse {
  token: string
}

