<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { checkPermission, UserRole } from '@/utils/permission'
import type { Collection, EssayBrief } from '@/types/essay'
import { useUserStore } from '@/stores/user'
import { getCollections, getEssayBriefs, createCollection } from '@/api/essay'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

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

// 获取合集列表
const fetchCollections = async () => {
  try {
    const result = await getCollections()
    if (result.success && result.data) {
      collections.value = result.data.filter(collection =>
        checkPermission(
          collection.requiredRole as UserRole || UserRole.GUEST,
          userStore.userInfo?.userRole
        )
      )
    }
  } catch (error) {
    console.error('获取合集列表失败:', error)
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
