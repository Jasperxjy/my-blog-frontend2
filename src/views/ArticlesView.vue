<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UserRole } from '@/utils/permission'
import type { Collection, EssayBrief } from '@/types/essay'
import { useUserStore } from '@/stores/user'
import { getCollections, getEssayBriefs, createCollection, updateCollection, deleteCollection } from '@/api/essay'
import { setPermission, hasPermission } from '@/api/permission'
import { Plus, Edit, Delete, Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const collections = ref<Collection[]>([])
const currentEssays = ref<EssayBrief[]>([])
const userStore = useUserStore()
const selectedCollectionId = ref<string | undefined>(undefined)
const currentCollection = ref<Collection | undefined>(undefined)
const isCreating = ref(false)
const newCollection = ref<Partial<Collection>>({
  collectionName: '',
  collectionAbstract: ''
})

// 编辑合集相关
const isEditing = ref(false)
const editingCollection = ref<Partial<Collection> | null>(null)

// 权限设置相关
const isSettingPermission = ref(false)
const selectedPermission = ref<UserRole>(UserRole.GUEST)

// 权限选项
const permissionOptions = [
  { label: '管理员', value: UserRole.ADMIN },
  { label: '密友', value: UserRole.CLOSE_FRIEND },
  { label: '好友', value: UserRole.FRIEND },
  { label: '访客', value: UserRole.GUEST }
]

const router = useRouter()

// 获取合集列表
const fetchCollections = async () => {
  try {
    const result = await getCollections()
    if (result.success && result.data) {
      const allCollections = result.data
      const filteredCollections: Collection[] = []

      for (const collection of allCollections) {
        // 管理员可以看到所有合集
        if (userStore.isAdmin) {
          filteredCollections.push(collection)
          continue
        }

        // 确保 userInfo 不为 null
        const userId = userStore.userInfo?.userId
        if (!userId) {
          ElMessage.error('用户信息未加载')
          return
        }

        const permissionResult = await hasPermission(userId, collection.collectionId)
        if (permissionResult.success && permissionResult.data) {
          filteredCollections.push(collection)
        }
      }

      collections.value = filteredCollections
    }
  } catch (error) {
    console.error('获取合集列表失败:', error)
    ElMessage.error('获取合集列表失败')
  }
}

// 获取文章列表
const fetchEssays = async (collectionId?: string) => {
  try {
    const result = await getEssayBriefs(collectionId)
    if (result.success && result.data) {
      currentEssays.value = result.data
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
  }
}

const handleCollectionClick = (collectionId?: string, collection?: Collection) => {
  selectedCollectionId.value = collectionId
  currentCollection.value = collection
  fetchEssays(collectionId)
}

// 创建新合集
const createNewCollection = async () => {
  if (!newCollection.value.collectionName) {
    ElMessage.error('请输入合集名称')
    return
  }

  try {
    const result = await createCollection({
      collectionName: newCollection.value.collectionName,
      collectionAbstract: newCollection.value.collectionAbstract || '',
      collectionId: '' // 留空，由服务器生成
    })

    if (result.success) {
      ElMessage.success('创建成功')
      isCreating.value = false
      // 重置表单
      newCollection.value = {
        collectionName: '',
        collectionAbstract: ''
      }
      // 重新获取合集列表
      await fetchCollections()
    }
  } catch (error) {
    console.error('创建合集失败:', error)
    ElMessage.error('创建失败')
  }
}

// 取消创建
const cancelCreate = () => {
  isCreating.value = false
  newCollection.value = {
    collectionName: '',
    collectionAbstract: ''
  }
}

// 开始编辑合集
const startEdit = () => {
  if (currentCollection.value) {
    editingCollection.value = { ...currentCollection.value }
    isEditing.value = true
  }
}

// 保存合集编辑
const saveEdit = async () => {
  if (!editingCollection.value || !currentCollection.value) return

  try {
    const result = await updateCollection(
      currentCollection.value.collectionId,
      editingCollection.value
    )

    if (result.success) {
      ElMessage.success('更新成功')
      isEditing.value = false
      await fetchCollections()
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

// 删除合集
const confirmDelete = async () => {
  if (!currentCollection.value) return

  try {
    await ElMessageBox.confirm(
      '确定要删除这个合集吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await deleteCollection(currentCollection.value.collectionId)
    if (result.success) {
      ElMessage.success('删除成功')
      currentCollection.value = undefined
      selectedCollectionId.value = undefined
      await fetchCollections()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 保存权限设置
const savePermission = async () => {
  if (!currentCollection.value) return

  try {
    const result = await setPermission(
      currentCollection.value.collectionId,
      selectedPermission.value
    )

    if (result.success) {
      ElMessage.success('权限设置成功')
      isSettingPermission.value = false
    }
  } catch (error) {
    ElMessage.error('权限设置失败')
  }
}

// 处理文章点击
const handleEssayClick = (essay: EssayBrief) => {
  // 将当前文章列表存储到 sessionStorage
  sessionStorage.setItem('currentEssayList', JSON.stringify(currentEssays.value))
  // 导航到文章详情页
  router.push({
    name: 'essay',
    params: { id: essay.essayId }
  })
}

onMounted(() => {
  fetchCollections()
  // 默认加载未归类文章
  fetchEssays()
})
</script>

<template>
  <div class="articles-container">
    <!-- 左侧合集列表 -->
    <div class="collections-list">
      <!-- 添加新建合集按钮 -->
      <el-button
        v-if="userStore.isAdmin"
        type="primary"
        class="add-collection-button"
        @click="isCreating = true"
      >
        <el-icon><Plus /></el-icon>
        <span>新建合集</span>
      </el-button>

      <div
        class="collection-card"
        :class="{ active: selectedCollectionId === undefined }"
        @click="handleCollectionClick()"
      >
        未归类文章
      </div>
      <div
        v-for="collection in collections"
        :key="collection.collectionId"
        class="collection-card"
        :class="{ active: selectedCollectionId === collection.collectionId }"
        @click="handleCollectionClick(collection.collectionId, collection)"
      >
        {{ collection.collectionName }}
      </div>
    </div>

    <!-- 右侧文章列表 -->
    <div class="essays-container">
      <!-- 添加合集描述 -->
      <div class="collection-description">
        {{ currentCollection?.collectionAbstract || '这里是一些未归类的随想和小杂文' }}
      </div>

      <!-- 管理按钮组 -->
      <div v-if="userStore.isAdmin && currentCollection" class="admin-actions">
        <el-button-group>
          <el-button type="primary" @click="startEdit">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" @click="confirmDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
          <el-button type="warning" @click="isSettingPermission = true">
            <el-icon><Setting /></el-icon>
            权限
          </el-button>
        </el-button-group>
      </div>

      <div v-if="currentEssays.length === 0" class="empty-state">
        <div class="empty-message">
          <p class="primary-text">文字是思维的痕迹，书写是心灵的沉淀</p>
          <p class="secondary-text">暂无文章</p>
        </div>
      </div>
      <div v-else class="essays-list">
        <div
          v-for="essay in currentEssays"
          :key="essay.essayId"
          class="essay-card"
          @click="handleEssayClick(essay)"
        >
          {{ essay.essayTitle }}
        </div>
      </div>
    </div>

    <!-- 新建合集弹窗 -->
    <el-dialog
      v-model="isCreating"
      title="新建合集"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="newCollection" label-width="80px">
        <el-form-item label="合集名称" required>
          <el-input
            v-model="newCollection.collectionName"
            placeholder="请输入合集名称"
          />
        </el-form-item>
        <el-form-item label="内容摘要">
          <el-input
            v-model="newCollection.collectionAbstract"
            type="textarea"
            :rows="4"
            placeholder="请输入内容摘要"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelCreate">取消</el-button>
          <el-button type="primary" @click="createNewCollection">
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑合集弹窗 -->
    <el-dialog
      v-model="isEditing"
      title="编辑合集"
      width="30%"
    >
      <el-form v-if="editingCollection" :model="editingCollection">
        <el-form-item label="合集名称" required>
          <el-input v-model="editingCollection.collectionName" />
        </el-form-item>
        <el-form-item label="内容摘要">
          <el-input
            v-model="editingCollection.collectionAbstract"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isEditing = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限设置弹窗 -->
    <el-dialog
      v-model="isSettingPermission"
      title="设置权限"
      width="30%"
    >
      <el-form>
        <el-form-item label="访问权限">
          <el-select v-model="selectedPermission">
            <el-option
              v-for="option in permissionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isSettingPermission = false">取消</el-button>
          <el-button type="primary" @click="savePermission">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.articles-container {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.collections-list {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 1rem;
  border-right: 1px solid #e6e9ed;
}

.collection-card {
  padding: 1.2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-size: 1rem;
  color: #606266;
  border: 2px solid transparent;
}

.collection-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f8f9fa;
}

.collection-card.active {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

.essays-container {
  flex: 1;
  display: flex;
  flex-direction: column; /* 改为纵向布局 */
  align-items: center;
  padding: 2rem;
}

.collection-description {
  width: 100%;
  max-width: 1200px;
  padding: 0 1rem 2rem;
  color: #606266;
  font-size: 1.1rem;
  line-height: 1.6;
  text-align: center;
  font-weight: 300;
  opacity: 0.9;
}

.essays-list {
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  justify-items: center;
  padding: 1rem 0;
  max-height: calc(100vh - 12rem); /* 调整最大高度，为描述留出空间 */
  overflow-y: auto;
}

.essay-card {
  width: 100%;
  max-width: 320px;
  height: 100px;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1.1rem;
  color: #303133;
}

.essay-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.empty-state {
  text-align: center;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: transparent;
}

.empty-message {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.primary-text {
  font-size: 1.8rem;
  color: #606266;
  font-weight: 300;
  margin: 0;
  opacity: 0.8;
}

.secondary-text {
  font-size: 1.2rem;
  color: #909399;
  margin: 0;
  opacity: 0.7;
}

.add-collection-button {
  width: 100%;
  margin-bottom: 15px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.admin-actions {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
}

.admin-actions .el-button-group {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
