<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { Essay, EssayTag, EssayBrief, Note } from '@/types/essay'
import { getEssayView, getEssayEdit, getEssayTags, getEssayNotes,addNote, startEditEssay, updateEssayContext, endEditEssay } from '@/api/essay'
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
const isEditing = ref(false)
const currentNoteContent = ref('')
const articleEditorRef = ref<InstanceType<typeof ArticleEditor>>()
const statusConfig: Record<number, { label: string; type: string }> = {
  0: { label: '正常', type: 'success' },
  1: { label: '编辑中', type: 'warning' },
  2: { label: '已删除', type: 'danger' }
}
// 新增选中的批注状态管理
const selectedAnnotation = ref({
  id: '',
  pos: null as DOMRect | null
})
// 处理批注点击事件
const handleAnnotationClick = (event: { detail: { id: string; pos: DOMRect } }) => {
  if (!event?.detail) return

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
// 添加处理方法
const handleCreateNote = async (content: string) => {
  try {
    // 获取当前光标位置
    const cursorPos = articleEditorRef.value?.currentCursorPos
    if (!cursorPos) throw new Error('请先选择批注位置')
    // 1. 创建批注记录
    const noteResult = await addNote({
      essayId: currentEssay.value!.essayId,
      userId: userStore.userInfo!.userId!,
      content,
      position: cursorPos // 实际位置由后续插入操作决定
    })

    if (!noteResult.success) throw new Error(noteResult.errorMsg)

    // 2. 进入编辑模式
    const lockResult = await startEditEssay(currentEssay.value!.essayId, userStore.userInfo!.userId!)
    if (!lockResult.success) throw new Error('文章加锁失败')

    // 3. 准备编辑器状态
    isEditing.value = true
    currentNoteContent.value = content
    // 触发编辑器进入批注插入模式（需要通过ArticleEditor组件实现）
    // 添加data存在性检查
    if (!noteResult.success || !noteResult.data) {
      throw new Error(noteResult.errorMsg || '创建批注失败')
    }

    // 后续代码保持不变，但添加可选链操作符
    articleEditorRef.value?.insertAnnotation(noteResult.data.noteId, cursorPos)

    // 更新文章内容（从编辑器获取最新内容）
    const updatedEssay = {
      ...currentEssay.value!,
      essayContext: articleEditorRef.value?.getContent() || currentEssay.value!.essayContext
    }

    const updateResult = await updateEssayContext(currentEssay.value!.essayId, updatedEssay)
    if (!updateResult.success) throw new Error(updateResult.errorMsg)

    // 更新本地批注列表
    essayNotes.value = (await getEssayNotes(currentEssay.value!.essayId)).data ?? []
    // 解锁文章
    await endEditEssay(currentEssay.value!.essayId, userStore.userInfo!.userId!)
    // 添加成功后关闭弹窗
    selectedAnnotation.value = { id: '', pos: null }

  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '创建失败')
    // 异常时解锁
    await endEditEssay(currentEssay.value!.essayId, userStore.userInfo!.userId!)
  }finally {
    isEditing.value = false
    currentNoteContent.value = ''
  }
}

// 添加关闭处理方法
const handleCloseAnnotation = async () => {
  if (isEditing.value) {
    await endEditEssay(currentEssay.value!.essayId, userStore.userInfo!.userId!)
    isEditing.value = false
  }
  selectedAnnotation.value.id = ''
}

// 编辑文章方法
const editEssay = (essay: Essay, tags: EssayTag[]) => {
  if (essay) {
    // 将当前文章对象和标签列表保存到 localStorage
    localStorage.setItem('currentEssay', JSON.stringify(essay));
    localStorage.setItem('currentTags', JSON.stringify(tags));

    router.push({
      name: 'essayEdit',
      params: { id: essay.essayId }
    });
  }
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

                  <!-- 显示文章类型 -->
                  <div class="meta-row">
                    <span class="type">文章类型: {{ currentEssay.essayType }}</span>
                  </div>

                  <!-- 第二行标签 -->
                  <div v-if="essayTags.length" class="tags-row">
                    <el-tag v-for="tag in essayTags" :key="tag.essayTagId" class="essay-tag" type="info" size="small">
                      {{ tag.essayTagName }}
                    </el-tag>
                  </div>
                </div>

                <!-- 编辑按钮，仅管理员可见 -->
                <div v-if="userStore.isAdmin" class="edit-button">
                  <el-button type="primary" @click="editEssay(currentEssay, essayTags)">编辑</el-button>
                </div>

                <!-- 统计数字保持不变 -->
                <div class="stats-numbers">
                  <span>👁️ {{ currentEssay.essayViewNum }}</span>
                  <span>👍 {{ currentEssay.essayLikeNum }}</span>
                  <span>⭐ {{ currentEssay.essayCollectionNum }}</span>
                </div>
              </div>
            </div>

            <article-editor
            ref="articleEditorRef"
            :model-value="currentEssay.essayContext"
            :editable="['CLOSE_FRIEND', 'ADMIN'].includes(userStore.userInfo?.userRole??'GUEST')" @annotation-click="(detail) => {
              selectedAnnotation.id = detail.id
              selectedAnnotation.pos = detail.pos
            }" />

            <annotation-panel  :user-role="userStore.userInfo?.userRole" :notes="essayNotes" :selected-annotation="selectedAnnotation"
              @close="handleCloseAnnotation" :has-cursor-position="!!articleEditorRef?.currentCursorPos"
              @create-note="handleCreateNote"/>

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

.type {

  font-size: 1.1rem;
  
}

.annotation-container {
  annotation {
    display: inline-block;
    background-color: #fff3d8;
    padding: 2px 4px;
    border-radius: 3px;
    border: 1px solid #ffd799;
    line-height: normal;
    vertical-align: baseline;
  }

  /* 补充现代浏览器对自定义标签的支持 */
  annotation:defined {
    display: inline;
  }
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

/* 添加样式以调整编辑按钮的位置 */
.edit-button {
  margin-left: auto; /* 将按钮推到右侧 */
}
</style>
