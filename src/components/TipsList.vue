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
      }
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
      <h2>往事如烟，心迹犹存</h2>
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
  padding: var(--space-6);
  margin: 0 auto;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

h2 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-text-primary);
  font-weight: 700;
}

.add-tip-btn {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
}

.add-tip-btn:hover {
  background-color: var(--color-accent-hover);
}

.add-tip-form {
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background-color: var(--color-bg-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.add-tip-form textarea {
  width: 100%;
  padding: var(--space-3);
  margin-bottom: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  resize: vertical;
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.add-tip-form textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.add-tip-form button {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-success);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
}

.add-tip-form button:hover {
  background-color: var(--color-success);
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.tips-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-5);
}

.tip-card {
  background: var(--color-bg-surface);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.tip-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.tip-content {
  margin-bottom: var(--space-4);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text-primary);
}

.tip-card-disabled {
  opacity: 0.6;
  background-color: var(--color-bg-page);
}

.tip-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-4);
}

.tip-status {
  font-size: var(--text-xs);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background-color: var(--color-success);
  color: white;
  font-weight: 500;
}

.status-disabled {
  background-color: var(--color-error);
}

.tip-time {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}

/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-overlay);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: var(--color-bg-surface);
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
}

.dialog-content h3 {
  margin-bottom: var(--space-5);
  color: var(--color-text-primary);
  font-size: var(--text-xl);
  font-weight: 600;
}

.dialog-body {
  margin-bottom: var(--space-6);
}

.edit-area {
  margin-bottom: var(--space-5);
}

.edit-area label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
  font-weight: 500;
  font-size: var(--text-sm);
}

.edit-area textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  resize: vertical;
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-family: var(--font-body);
}

.edit-area textarea:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.tip-info {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  margin: var(--space-2) 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.delete-btn,
.cancel-btn,
.save-btn {
  padding: var(--space-2) var(--space-5);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
}

.delete-btn {
  background-color: var(--color-error);
  color: white;
}

.delete-btn:hover {
  background-color: var(--color-error);
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.save-btn {
  background-color: var(--color-accent);
  color: white;
}

.save-btn:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-1px);
}

.cancel-btn {
  background-color: var(--color-text-tertiary);
  color: white;
}

.cancel-btn:hover {
  background-color: var(--color-text-secondary);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .tips-container {
    padding: var(--space-4);
  }

  .tips-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  h2 {
    font-size: var(--text-2xl);
  }

  .tips-list {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .tip-card {
    padding: var(--space-4);
  }

  .dialog-content {
    padding: var(--space-5);
    width: 92%;
  }
}
</style>
