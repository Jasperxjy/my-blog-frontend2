<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Essay, EssayTag, EssayBrief, Note } from '@/types/essay'
import { getEssayView, getEssayEdit, getEssayTags, getEssayNotes,addNote, startEditEssay, updateEssayContext, endEditEssay, deleteEssay } from '@/api/essay'
import CommentSection from '@/components/CommentSection.vue'
// 替换原有导入
import ArticleEditor from '@/components/ArticleEditor.vue'
import AnnotationPanel from '@/components/AnnotationPanel.vue'
import ScrollToButtons from '@/components/ScrollToButtons.vue'


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

// 代码块复制按钮
const setupCodeCopy = () => {
  nextTick(() => {
    const pres = document.querySelectorAll('.essay-content pre')
    pres.forEach((pre) => {
      if (pre.querySelector('.code-copy-btn')) return
      const btn = document.createElement('button')
      btn.className = 'code-copy-btn'
      btn.textContent = '复制'
      btn.onclick = () => {
        const code = pre.querySelector('code')
        const text = code?.textContent || ''
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '已复制'
          btn.classList.add('copied')
          setTimeout(() => {
            btn.textContent = '复制'
            btn.classList.remove('copied')
          }, 2000)
        })
      }
      pre.appendChild(btn)
    })
  })
}

watch(currentEssay, () => {
  if (currentEssay.value) setupCodeCopy()
})

// 初始化文章列表
onMounted(() => {
  const essayId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
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
  if (!currentEssay.value) {
    ElMessage.error('文章未加载')
    return
  }
  const essayId = currentEssay.value.essayId
  const userId = userStore.userInfo?.userId
  if (!userId) {
    ElMessage.error('用户未登录')
    return
  }
  try {
    // 获取当前光标位置
    const cursorPos = articleEditorRef.value?.currentCursorPos
    if (!cursorPos) throw new Error('请先选择批注位置')
    // 1. 创建批注记录
    const noteResult = await addNote({
      essayId,
      userId,
      content,
      position: cursorPos // 实际位置由后续插入操作决定
    })

    if (!noteResult.success) throw new Error(noteResult.errorMsg)

    // 2. 进入编辑模式
    const lockResult = await startEditEssay(essayId, userId)
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
      ...currentEssay.value,
      essayContext: articleEditorRef.value?.getContent() || currentEssay.value.essayContext
    }

    const updateResult = await updateEssayContext(essayId, updatedEssay)
    if (!updateResult.success) throw new Error(updateResult.errorMsg)

    // 更新本地批注列表
    essayNotes.value = (await getEssayNotes(essayId)).data ?? []
    // 解锁文章
    await endEditEssay(essayId, userId)
    // 添加成功后关闭弹窗
    selectedAnnotation.value = { id: '', pos: null }
    ElMessage.success('批注创建成功')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '创建失败')
    // 异常时解锁
    await endEditEssay(essayId, userId)
  }finally {
    isEditing.value = false
    currentNoteContent.value = ''
  }
}

// 添加关闭处理方法
const handleCloseAnnotation = async () => {
  if (!currentEssay.value) {
    ElMessage.error('文章未加载')
    return
  }
  const essayId = currentEssay.value.essayId
  const userId = userStore.userInfo?.userId
  if (!userId) {
    ElMessage.error('用户未登录')
    return
  }
  if (isEditing.value) {
    await endEditEssay(essayId, userId)
    isEditing.value = false
  }
  selectedAnnotation.value.id = ''
}

// 删除文章方法
const handleDeleteEssay = async () => {
  if (!currentEssay.value) return
  try {
    await ElMessageBox.confirm(
      '确定要删除这篇文章吗？删除后文章将标记为已删除状态。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const result = await deleteEssay(currentEssay.value.essayId)
    if (result.success) {
      ElMessage.success('删除成功')
      router.push({ name: 'articles' })
    } else {
      ElMessage.error(result.errorMsg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
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

                <!-- 编辑和删除按钮，仅管理员可见 -->
                <div v-if="userStore.isAdmin" class="edit-button">
                  <el-button type="primary" @click="editEssay(currentEssay, essayTags)">编辑</el-button>
                  <el-button type="danger" @click="handleDeleteEssay">删除</el-button>
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
            <comment-section v-if="currentEssay" :key="currentEssay.essayId" :essay-id="currentEssay.essayId" />
          </div>
        </template>
      </el-skeleton>
      <scroll-to-buttons mode="sticky" />
    </div>
    
  </div>
</template>

<style scoped>
.essay-view {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(auto, 900px) minmax(200px, 1fr);
  gap: 0;
  padding: var(--space-6);
  min-height: 100vh;
}

.essay-list {
  justify-self: end;
  width: 100%;
  max-width: 280px;
  position: sticky;
  top: 80px;
  height: calc(100vh - 100px);
  overflow-y: auto;
  padding-right: var(--space-5);
  border-right: 1px solid var(--color-border);
}

.essay-item {
  padding: var(--space-3);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.essay-item:hover {
  background-color: var(--color-accent-subtle);
}

.essay-item.active {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  font-weight: 600;
}

.essay-content {
  width: 100%;
  max-width: none;
  margin: 0;
  display: flex;
  flex-direction: column;
}

/* 中等屏幕：两列布局 */
@media (max-width: 1100px) and (min-width: 769px) {
  .essay-view {
    grid-template-columns: 280px minmax(0, 1fr);
    gap: var(--space-6);
  }

  .essay-list {
    justify-self: start;
    max-width: none;
    width: 280px;
  }

  .essay-content {
    max-width: 900px;
    margin: 0 auto;
  }
}

/* 移动端 */
@media (max-width: 768px) {
  .essay-view {
    grid-template-columns: 1fr;
    padding: var(--space-4);
    gap: var(--space-4);
  }

  .essay-list {
    position: relative;
    top: 0;
    height: auto;
    max-height: 200px;
    overflow-y: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding-right: 0;
    padding-bottom: var(--space-4);
    justify-self: start;
    max-width: none;
    width: 100%;
  }

  .essay-content {
    max-width: none;
    margin: 0;
  }

  .essay-header h1 {
    font-size: var(--text-2xl);
  }
}

.essay-header {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.essay-header h1 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  line-height: var(--leading-tight);
}

.essay-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: var(--space-4) 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.essay-type {
  margin-right: var(--space-3);
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
}

.essay-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  flex-direction: column;
  gap: var(--space-2);
}

.tags-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  width: 100%;
}

.version {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.essay-tag {
  margin: 0;
  font-size: var(--text-xs);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
}

.stats-numbers {
  display: flex;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.type {
  font-size: var(--text-base);
}

.annotation-container {
  annotation {
    display: inline-block;
    background-color: var(--color-accent-subtle);
    padding: 2px 4px;
    border-radius: 3px;
    border: 1px solid var(--color-accent-light);
    line-height: normal;
    vertical-align: baseline;
  }

  annotation:defined {
    display: inline;
  }
}

.essay-container {
  padding: var(--space-5);
  max-width: 1200px;
  margin: 0 auto;

  :deep(.tiptap) {
    padding: var(--space-4);
    min-height: 300px;
    line-height: var(--leading-relaxed);
    color: var(--color-text-primary);
  }

  :deep(.tiptap p) {
    margin-bottom: var(--space-4);
  }

  :deep(.tiptap blockquote) {
    border-left: 3px solid var(--color-accent);
    padding-left: var(--space-4);
    margin: var(--space-5) 0;
    color: var(--color-text-secondary);
    font-style: italic;
    background: var(--color-accent-subtle);
    padding: var(--space-4) var(--space-4) var(--space-4) var(--space-5);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  :deep(.tiptap img) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    max-width: 100%;
    height: auto;
  }

  :deep(.menu-bar) {
    display: none;
  }

}

.edit-button {
  margin-left: auto;
}
</style>
