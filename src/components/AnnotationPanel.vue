<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Note } from '@/types/essay'
import { ElMessage } from 'element-plus'
import { updateNoteContent } from '@/api/essay'
import NewAnnotationInput from './NewAnnotationInput.vue'

const props = defineProps<{
  notes: Note[]
  selectedAnnotation: {
    id: string
    pos: DOMRect | null
  }
  userRole?: string
  hasCursorPosition: boolean  // 新增属性
}>()

const emit = defineEmits(['close', 'create-note'])
const isEditing = ref(false)
const editNoteContent = ref('')

// 在script部分添加
const showDialog = ref(false)
const newNoteContent = ref('')
// 过滤当前显示的批注
const currentNote = computed(() => {
  return props.notes.find(note => note.noteId === props.selectedAnnotation.id)
})

// 新增编辑方法
const handleEditNote = async () => {
  try {
    if (!currentNote.value) return

    const updatedNote = {
      ...currentNote.value,
      content: editNoteContent.value
    }

    await updateNoteContent(updatedNote)
    currentNote.value.content = editNoteContent.value
    isEditing.value = false
    ElMessage.success('批注更新成功')
  } catch (error) {
    ElMessage.error('批注更新失败')
    editNoteContent.value = currentNote.value?.content || ''
  }
}

const resetDialog = () => {
  newNoteContent.value = ''; // 清空输入内容
  showDialog.value = false; // 关闭对话框
  newAnnotationInput.value?.cancel(); // 调用新组件的 cancel 方法
};

const createNewNote = (content: string) => {
  emit('create-note', content);
};

const newAnnotationInput = ref<InstanceType<typeof NewAnnotationInput> | null>(null);

// 显示新批注输入框
const showNewAnnotationInput = () => {
  newAnnotationInput.value?.show(); // 使用可选链操作符
};
</script>

<template>
  <!-- 将输入框移出容器 -->
  <new-annotation-input @create-note="createNewNote" ref="newAnnotationInput" />

  <div class="annotation-container">
    <transition name="slide-fade">
      <div class="annotation-panel" v-show="currentNote" :style="{
        top: selectedAnnotation.pos?.top + 'px',
        transition: 'top 0.3s ease'}">
        <div v-if="!currentNote" class="no-notes">
          <p>当前没有批注。</p>
        </div>

        <div v-else class="note-card">
          <div class="note-header">
            <div class="user-info">用户：{{ currentNote.userId }}</div>
            <div>
              <el-button v-if="['CLOSE_FRIEND', 'ADMIN'].includes(userRole || '')" size="small"
                @click="isEditing = true; editNoteContent = currentNote.content">
                编辑
              </el-button>
              <button class="close-btn" @click="$emit('close')">×</button>
            </div>
          </div>
          <div v-if="!isEditing" class="note-content">{{ currentNote.content }}</div>
          <div v-else class="edit-area">
            <el-input v-model="editNoteContent" type="textarea" :rows="4" placeholder="请输入批注内容" />
            <div class="edit-buttons">
              <el-button size="small" @click="isEditing = false">取消</el-button>
              <el-button type="primary" size="small" @click="handleEditNote">保存</el-button>
            </div>
          </div>
          <div class="note-footer">
            <div class="note-time">{{ new Date(currentNote.createTime).toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 新增批注按钮，固定在容器底部 -->
    <div class="create-annotation-button" v-if="['CLOSE_FRIEND', 'ADMIN'].includes(userRole || '')">
      <el-tooltip :content="hasCursorPosition ? '点击添加批注' : '请先选择批注位置'" placement="top">
        <el-button
          type="primary"
          :disabled="!hasCursorPosition"
          @click="showNewAnnotationInput"
        >
          新建批注
        </el-button>
      </el-tooltip>
    </div>

    <new-annotation-input @create-note="createNewNote" ref="newAnnotationInput" />
  </div>
</template>

<style scoped>
.annotation-container {
  position: fixed;
  top: 0;
  right: 20px;
  bottom: 0;
  width: 300px;
  display: flex;
  flex-direction: column;
}

.annotation-panel {
  position: absolute;
  width: 100%;
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  z-index: 1001;
  pointer-events: auto;
  transition: top var(--duration-normal) var(--ease-out);
}

.create-annotation-button {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  padding: var(--space-4);
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  z-index: 1001;
  pointer-events: auto;
}

.note-card {
  padding: var(--space-4);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0 var(--space-2);
  color: var(--color-text-tertiary);
  transition: color var(--duration-fast) var(--ease-out);
}

.close-btn:hover {
  color: var(--color-accent);
}

.edit-area {
  margin-top: var(--space-3);
}

.edit-buttons {
  margin-top: var(--space-3);
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.note-content {
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  white-space: pre-wrap;
}

.note-footer {
  margin-top: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.no-notes {
  padding: var(--space-4);
  text-align: center;
  color: var(--color-text-tertiary);
}

/* 新增过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateY(-20px); /* 调整进入方向 */
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
/* 新增输入框容器定位 */
.new-annotation-input {
  position: fixed;
  right: 20px;
  bottom: 100px; /* 根据按钮位置调整 */
  width: 300px;
  z-index: 1002; /* 确保在批注面板之上 */
}

/* 移动端适配：底部抽屉模式 */
@media (max-width: 768px) {
  .annotation-container {
    position: relative;
    top: auto;
    right: auto;
    bottom: auto;
    width: 100%;
  }

  .annotation-panel {
    position: relative;
    top: auto !important;
    width: 100%;
    z-index: auto;
    margin: var(--space-4) 0;
    border-radius: var(--radius-md);
  }

  .create-annotation-button {
    position: fixed;
    bottom: var(--space-4);
    right: var(--space-4);
    z-index: 90;
    padding: var(--space-3);
  }

  .new-annotation-input {
    left: 20px;
    right: 20px;
    width: auto;
    bottom: 80px;
    z-index: 90;
  }
}
</style>
