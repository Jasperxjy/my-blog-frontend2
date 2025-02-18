export enum UserRole {
  ADMIN = 'ADMIN',
  CLOSE_FRIEND = 'CLOSE_FRIEND',
  FRIEND = 'FRIEND',
  GUEST = 'GUEST'
}

export const roleLevel = {
  [UserRole.ADMIN]: 4,
  [UserRole.CLOSE_FRIEND]: 3,
  [UserRole.FRIEND]: 2,
  [UserRole.GUEST]: 1
}

export function checkPermission(requiredRole: UserRole, currentRole?: string): boolean {
  if (!currentRole) return false
  return roleLevel[currentRole as UserRole] >= roleLevel[requiredRole]
}
