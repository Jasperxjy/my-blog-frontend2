import { ElMessage } from 'element-plus'

export function useNotification() {
  const showError = (message: string) => {
    ElMessage.error(message)
  }

  const showSuccess = (message: string) => {
    ElMessage.success(message)
  }

  return {
    showError,
    showSuccess
  }
}
