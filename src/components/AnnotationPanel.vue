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
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  z-index: 1001; /* 确保在评论组件之上 */
  pointer-events: auto; /* 恢复面板的点击事件 */
  transition: top 0.3s ease;
}

.create-annotation-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001; /* 确保在评论组件之上 */
  pointer-events: auto; /* 恢复按钮的点击事件 */
}

.note-card {
  padding: 16px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0 8px;
}

.edit-area {
  margin-top: 12px;
}

.edit-buttons {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.note-content {
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.note-footer {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}

.no-notes {
  padding: 16px;
  text-align: center;
  color: #999;
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
</style>
