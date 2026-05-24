<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { request } from '@/utils/request'
import { useNotification } from '@/composables/notification'

interface User {
  email: string
  userRole: string
  userRegisterTime: string
  status: number
  userName: string
  userId: string
}

const users = ref<User[]>([])
const { showError } = useNotification()


const getRoleText = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return '管理员'
    case 'CLOSE_FRIEND':
      return '亲友'
    case 'FRIEND':
      return '好友'
    case 'GUEST':
      return '游客'
    default:
      return '未知'
  }
}

const fetchUsers = async () => {
  try {
    const result = await request<User[]>('/api/user/all')
    if (result.success) {
      users.value = result.data || []
    } else {
      showError(result.errorMsg || '获取用户列表失败')
    }
  } catch (error) {
    showError('获取用户列表失败')
  }
}

const updateUserStatus = async (userId: string, newStatus: number) => {
  try {
    const result = await request(`/api/user/review/${userId}`, {
      method: 'PUT',
      params: { status: newStatus }
    })
    if (result.success) {
      await fetchUsers()
    } else {
      showError(result.errorMsg || '更新用户状态失败')
    }
  } catch (error) {
    showError('更新用户状态失败')
  }
}

const sortedUsers = computed(() => {
  return [...users.value].sort((a, b) => {
    if (a.status === 0 && b.status !== 0) return -1
    if (a.status !== 0 && b.status === 0) return 1
    return 0
  })
})

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="users-container">
    <h2>用户管理</h2>
    <div class="users-grid">
      <div v-for="user in sortedUsers" :key="user.email" class="user-card">
        <div class="user-header">
          <h3>{{ user.userName }}</h3>
          <div class="status-control">
            <select
              :value="user.status"
              @change="(e) => updateUserStatus(user.userId, Number((e.target as HTMLSelectElement).value))"
              class="status-select"
            >
              <option value="0">等待审核</option>
              <option value="1">正常</option>
              <option value="2">已注销</option>
              <option value="3">已删除</option>
            </select>
          </div>
        </div>
        <div class="user-info">
          <p><strong>邮箱：</strong>{{ user.email }}</p>
          <p><strong>权限：</strong>{{ getRoleText(user.userRole) }}</p>
          <p><strong>注册时间：</strong>{{ new Date(user.userRegisterTime).toLocaleString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

h2 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-text-primary);
  margin-bottom: var(--space-8);
  text-align: center;
  font-weight: 700;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
}

.user-card {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.user-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  font-weight: 600;
}

.status-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  background-color: var(--color-success);
  color: white;
  font-weight: 500;
}

.status-disabled {
  background-color: var(--color-error);
}

.user-info {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.user-info p {
  margin: var(--space-2) 0;
  line-height: var(--leading-normal);
}

.user-info strong {
  color: var(--color-text-primary);
}

.status-control {
  display: flex;
  align-items: center;
}

.status-select {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.status-select:focus {
  outline: none;
  border-color: var(--color-accent);
}

@media (max-width: 768px) {
  .users-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .user-card {
    padding: var(--space-4);
  }
}
</style>
