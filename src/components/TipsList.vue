<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { checkPermission, UserRole } from '@/utils/permission'
import { useNotification } from '@/composables/notification'
import { request } from '@/utils/request'
import type { Tip } from '@/types/common'

const tips = ref<Tip[]>([])
const newTipContent = ref('')
const showAddForm = ref(false)
const userStore = useUserStore()
const { showError, showSuccess } = useNotification()

const selectedTip = ref<Tip | null>(null)
const showEditDialog = ref(false)
const editedContent = ref('')

const isAdmin = computed(() =>
  checkPermission(UserRole.ADMIN, userStore.userInfo?.userRole)
)

// 根据权限过滤tips
const filteredTips = computed(() => {
  if (isAdmin.value) {
    return tips.value
  }
  return tips.value.filter(tip => tip.status === 1)
})

const getTipStatus = (status: number) => {
  switch (status) {
    case 1:
      return '正常'
    case 0:
      return '废弃'
    default:
      return '未知'
  }
}

const fetchTips = async () => {
  try {
    const result = await request<Tip[]>('/api/tip/all')
    if (result.success) {
      tips.value = result.data || []
    } else {
      showError(result.errorMsg || '获取贴士失败')
    }
  } catch (error) {
    console.error('获取贴士失败:', error)
    showError('获取贴士失败')
  }
}

const addTip = async () => {
  if (!newTipContent.value.trim()) {
    showError('请输入贴士内容')
    return
  }

  try {
    const result = await request<Tip>('/api/tip/add', {
      method: 'POST',
      data: {
        tipId: '',
        content: newTipContent.value,
        time: '',
        status: 1
      } as Tip
    })

    if (result.success) {
      showSuccess('添加贴士成功')
      newTipContent.value = ''
      showAddForm.value = false
      await fetchTips()
    } else {
      showError(result.errorMsg || '添加贴士失败')
    }
  } catch (error) {
    showError('添加贴士失败')
  }
}

const openEditDialog = (tip: Tip) => {
  if (!isAdmin.value) return
  selectedTip.value = { ...tip }
  editedContent.value = tip.content
  showEditDialog.value = true
}

const updateTip = async () => {
  if (!selectedTip.value || !editedContent.value.trim()) {
    showError('请输入内容')
    return
  }

  try {
    const result = await request<void>(`/api/tip/${selectedTip.value.tipId}/update`, {
      method: 'PUT',
      data: {
        ...selectedTip.value,
        content: editedContent.value
      }
    })

    if (result.success) {
      showSuccess('更新成功')
      showEditDialog.value = false
      selectedTip.value = null
      await fetchTips()
    } else {
      showError(result.errorMsg || '更新失败')
    }
  } catch (error) {
    showError('更新失败')
  }
}

const deleteTip = async () => {
  if (!selectedTip.value) return

  try {
    const result = await request<void>(`/api/tip/${selectedTip.value.tipId}/del`, {
      method: 'DELETE'
    })

    if (result.success) {
      showSuccess('删除成功')
      showEditDialog.value = false
      selectedTip.value = null
      await fetchTips()
    } else {
      showError(result.errorMsg || '删除失败')
    }
  } catch (error) {
    showError('删除失败')
  }
}

const closeDialog = () => {
  showEditDialog.value = false
  selectedTip.value = null
}

onMounted(() => {
  fetchTips()
})
</script>

<template>
  <div class="tips-container">
    <div class="tips-header">
      <h2>日有所思，夜有所念</h2>
      <button v-if="isAdmin"
              class="add-tip-btn"
              @click="showAddForm = !showAddForm">
        {{ showAddForm ? '取消' : '新增贴士' }}
      </button>
    </div>

    <!-- 新增贴士表单 -->
    <div v-if="showAddForm && isAdmin" class="add-tip-form">
      <textarea
        v-model="newTipContent"
        placeholder="请输入贴士内容..."
        rows="3"
      ></textarea>
      <button @click="addTip">提交</button>
    </div>

    <div class="tips-list">
      <div v-for="tip in filteredTips"
           :key="tip.tipId"
           class="tip-card"
           :class="{ 'tip-card-disabled': tip.status !== 1 }"
           @click="openEditDialog(tip)">
        <p class="tip-content">{{ tip.content }}</p>
        <div class="tip-footer">
          <span class="tip-time">{{ new Date(tip.time).toLocaleDateString() }}</span>
          <span v-if="isAdmin"
                class="tip-status"
                :class="{ 'status-disabled': tip.status !== 1 }">
            {{ getTipStatus(tip.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditDialog && selectedTip" class="dialog-overlay">
      <div class="dialog-content">
        <h3>编辑贴士</h3>
        <div class="dialog-body">
          <div class="edit-area">
            <label>贴士内容：</label>
            <textarea
              v-model="editedContent"
              rows="4"
              placeholder="请输入贴士内容..."
            ></textarea>
          </div>
          <p class="tip-info">
            创建时间：{{ new Date(selectedTip.time).toLocaleString() }}
          </p>
          <p class="tip-info">
            状态：{{ getTipStatus(selectedTip.status) }}
          </p>
        </div>
        <div class="dialog-footer">
          <button class="delete-btn" @click="deleteTip">删除</button>
          <button class="save-btn" @click="updateTip">保存</button>
          <button class="cancel-btn" @click="closeDialog">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tips-container {
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  margin: 0 auto;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h2 {
  font-size: 2.5rem;
  color: #2c3e50;
}

.add-tip-btn {
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-tip-btn:hover {
  background-color: #2980b9;
}

.add-tip-form {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.add-tip-form textarea {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.add-tip-form button {
  padding: 0.5rem 1rem;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-tip-form button:hover {
  background-color: #27ae60;
}

.tips-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.tip-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.tip-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.tip-content {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.tip-card-disabled {
  opacity: 0.7;
  background-color: #f5f5f5;
}

.tip-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.tip-status {
  font-size: 0.9rem;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #4caf50;
  color: white;
}

.status-disabled {
  background-color: #f44336;
}

.tip-time {
  color: #666;
  font-size: 0.9rem;
}

/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dialog-content h3 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.5rem;
}

.dialog-body {
  margin-bottom: 2rem;
}

.edit-area {
  margin-bottom: 1.5rem;
}

.edit-area label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.edit-area textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.3s;
}

.edit-area textarea:focus {
  border-color: #3498db;
  outline: none;
}

.tip-info {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.delete-btn:hover {
  background-color: #c82333;
}

.save-btn {
  background-color: #3498db;
  color: white;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.save-btn:hover {
  background-color: #2980b9;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #5a6268;
}
</style>
