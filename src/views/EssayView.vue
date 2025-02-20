<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { Essay, EssayTag, EssayBrief, Note } from '@/types/essay'
import { getEssayView, getEssayEdit, getEssayTags, getEssayNotes } from '@/api/essay'
import CommentSection from '@/components/CommentSection.vue'
// 替换原有导入
import ArticleEditor from '@/components/ArticleEditor.vue'
import AnnotationPanel from '@/components/AnnotationPanel.vue'


const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentEssay = ref<Essay | null>(null)
const essayTags = ref<EssayTag[]>([])
const essayNotes = ref<Note[]>([])
const essayList = ref<EssayBrief[]>([])
const loading = ref(true)

const statusConfig: Record<number, { label: string; type: string }> = {
  0: { label: '正常', type: 'success' },
  1: { label: '编辑中', type: 'warning' },
  2: { label: '已删除', type: 'danger' }
}
// 新增选中的批注状态管理
const selectedAnnotation = ref<{ id: string; pos: DOMRect | null }>({
  id: '',
  pos: null
})
// 处理批注点击事件
const handleAnnotationClick = (event: CustomEvent) => {
  if (selectedAnnotation.value.id === event.detail.id) {
    selectedAnnotation.value = { id: '', pos: null }
  } else {
    selectedAnnotation.value = {
      id: event.detail.id,
      pos: event.detail.pos
    }
  }
}
// 获取文章内容
const fetchEssayContent = async (essayId: string) => {
  try {
    const result = userStore.isAdmin
      ? await getEssayEdit(essayId)
      : await getEssayView(essayId)

    if (result.success && result.data) {
      currentEssay.value = result.data
      // 获取文章标签
      const tagsResult = await getEssayTags(essayId)
      if (tagsResult.success && tagsResult.data) {
        essayTags.value = tagsResult.data
      }
      // 获取文章批注
      const notesResult = await getEssayNotes(essayId)
      if (notesResult.success && notesResult.data) {
        essayNotes.value = notesResult.data
      }
    } else {
      ElMessage.error(result.errorMsg || '获取文章失败')
    }
  } catch (error) {
    ElMessage.error('获取文章失败')
  } finally {
    loading.value = false
  }
}

// 初始化文章列表
onMounted(() => {
  const essayId = route.params.id as string
  // 从 sessionStorage 获取文章列表
  const savedList = sessionStorage.getItem('currentEssayList')
  if (savedList) {
    essayList.value = JSON.parse(savedList)
  }

  if (essayId) {
    fetchEssayContent(essayId)
  }
})

// 处理文章切换
const handleEssayClick = (essayId: string) => {
  // 更新 URL，但不重新加载页面
  router.push({
    name: 'essay',
    params: { id: essayId },
    replace: true
  })
  // 获取新文章内容
  fetchEssayContent(essayId)
}
</script>

<template>
  <div class="essay-view">
    <!-- 左侧文章列表 -->
    <div class="essay-list">
      <div v-for="essay in essayList" :key="essay.essayId" class="essay-item"
        :class="{ active: essay.essayId === currentEssay?.essayId }" @click="handleEssayClick(essay.essayId)">
        {{ essay.essayTitle }}
      </div>
    </div>

    <!-- 中间文章内容 -->
    <div class="essay-content">
      <el-skeleton :loading="loading" animated>
        <template #default>
          <div v-if="currentEssay" class="essay-container">
            <div class="essay-header">
              <h1>{{ currentEssay.essayTitle }}</h1>
              <div class="essay-meta">
                <div class="essay-info">
                  <!-- 第一行元数据 -->
                  <div class="meta-row">
                    <span class="time">创建时间: {{ currentEssay.essayAddTime }}</span>
                    <span class="time">最后修改: {{ currentEssay.essayLastChangeTime }}</span>
                    <span class="version">版本: v{{ currentEssay.version }}</span>
                    <el-tag :type="statusConfig[currentEssay.status].type" size="small">
                      {{ statusConfig[currentEssay.status].label }}
                    </el-tag>
                  </div>

                  <!-- 第二行标签 -->
                  <div v-if="essayTags.length" class="tags-row">
                    <el-tag v-for="tag in essayTags" :key="tag.essayTagId" class="essay-tag" type="info" size="small">
                      {{ tag.essayTagName }}
                    </el-tag>
                  </div>
                </div>

                <!-- 统计数字保持不变 -->
                <div class="stats-numbers">
                  <span>👁️ {{ currentEssay.essayViewNum }}</span>
                  <span>👍 {{ currentEssay.essayLikeNum }}</span>
                  <span>⭐ {{ currentEssay.essayCollectionNum }}</span>
                </div>
              </div>
            </div>

            <article-editor :model-value="currentEssay.essayContext" :editable="false" :notes="essayNotes" />
            <!-- 新增批注面板 -->
            <annotation-panel :notes="essayNotes" :selected-annotation="selectedAnnotation"
              :user-role="userStore.userInfo?.userRole" @close="selectedAnnotation = { id: '', pos: null }" />
            <!-- 添加评论组件 -->
            <comment-section v-if="currentEssay" :essay-id="currentEssay.essayId" />
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
.essay-view {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  padding: 20px;
  max-width: 1800px;
  margin: 0 auto;
  min-height: 100vh;
}

.essay-list {
  position: sticky;
  top: 20px;
  height: calc(100vh - 40px);
  overflow-y: auto;
  padding-right: 20px;
  border-right: 1px solid #e6e9ed;
}

.essay-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.essay-item:hover {
  background-color: #f5f7fa;
}

.essay-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.essay-content {
  flex: 1;
  width: 100%;
  padding-right: 320px;
}

.essay-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ebeef5;
}

.essay-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  color: #909399;
  font-size: 0.9rem;
  align-items: flex-start;

}

.essay-type {
  margin-right: 1rem;
  padding: 0.2rem 0.5rem;
  background-color: #f0f2f5;
  border-radius: 4px;
}

.essay-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: #606266;
  font-size: 0.9rem;
  flex-direction: column;
  gap: 8px;
}

.tags-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  width: 100%;
}

.version {
  font-family: monospace;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.essay-tag {
  margin: 0;
  font-size: 0.85rem;
  background-color: #f0f4ff;
  color: #3366ff;
  border-radius: 4px;
}

.tags-row {

  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.stats-numbers {
  display: flex;
  gap: 1rem;
  color: #606266;
  font-size: 0.9rem;
  white-space: nowrap;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}

.essay-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  /* 新增以下规则 */
  :deep(.tiptap) {
    padding: 1rem;
    min-height: 300px;
  }

  :deep(.menu-bar) {
    display: none;
    /* 隐藏只读模式的菜单栏 */
  }
}
</style>
