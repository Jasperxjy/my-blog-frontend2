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
  padding: 2rem;
}

h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 2rem;
  text-align: center;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.user-card:hover {
  transform: translateY(-5px);
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.user-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  background-color: #4caf50;
  color: white;
}

.status-disabled {
  background-color: #f44336;
}

.user-info {
  font-size: 0.95rem;
  color: #666;
}

.user-info p {
  margin: 0.5rem 0;
  line-height: 1.5;
}

.user-info strong {
  color: #2c3e50;
}

.status-control {
  display: flex;
  align-items: center;
}

.status-select {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  background-color: white;
  color: #2c3e50;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: #4caf50;
}
</style>
