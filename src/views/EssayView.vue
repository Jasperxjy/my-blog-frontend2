<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import type { Essay, EssayTag, EssayBrief } from '@/types/essay'
import { getEssayView, getEssayEdit, getEssayTags } from '@/api/essay'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentEssay = ref<Essay | null>(null)
const essayTags = ref<EssayTag[]>([])
const essayList = ref<EssayBrief[]>([])
const loading = ref(true)

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
      <div
        v-for="essay in essayList"
        :key="essay.essayId"
        class="essay-item"
        :class="{ active: essay.essayId === currentEssay?.essayId }"
        @click="handleEssayClick(essay.essayId)"
      >
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
                <span class="essay-type">{{ currentEssay.essayType }}</span>
                <span class="essay-time">
                  创建于 {{ currentEssay.essayAddTime }}
                  <template v-if="currentEssay.essayLastChangeTime">
                    · 最后修改于 {{ currentEssay.essayLastChangeTime }}
                  </template>
                </span>
              </div>
              <div class="essay-info">
                <div class="tags-list">
                  <el-tag
                    v-for="tag in essayTags"
                    :key="tag.essayTagId"
                    class="essay-tag"
                    size="small"
                  >
                    {{ tag.essayTagName }}
                  </el-tag>
                </div>
                <div class="stats-numbers">
                  <span>👁️ {{ currentEssay.essayViewNum }}</span>
                  <span>👍 {{ currentEssay.essayLikeNum }}</span>
                  <span>⭐ {{ currentEssay.essayCollectionNum }}</span>
                </div>
              </div>
            </div>

            <MarkdownViewer
              :content="currentEssay.essayContext"
              :essay-id="currentEssay.essayId"
              readonly
            />
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
  max-width: 1500px;
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
  padding-right: 340px;
}

.essay-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ebeef5;
}

.essay-meta {
  margin: 1rem 0;
  color: #909399;
  font-size: 0.9rem;
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
  align-items: center;
  margin-top: 1rem;
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
}

.stats-numbers {
  display: flex;
  gap: 1rem;
  color: #606266;
  font-size: 0.9rem;
  white-space: nowrap;
}

.essay-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
