<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Note } from '@/types/essay'
import { ElMessage } from 'element-plus'
import { updateNoteContent } from '@/api/essay'
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
</script>

<template>
  <div class="annotation-panel" :style="{ top: selectedAnnotation.pos?.top + 'px' }">
    <div v-if="currentNote" class="note-card">
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

    <div v-if="userRole && ['CLOSE_FRIEND', 'ADMIN'].includes(userRole)" class="new-note-footer">
      <el-button type="primary" :disabled="!hasCursorPosition" @click="showDialog = true" v-if="hasCursorPosition">
        新建批注
      </el-button>
      <el-tooltip v-else content="请先进入编辑模式选择批注位置" placement="top">
        <el-button type="primary" disabled>
          新建批注
        </el-button>
      </el-tooltip>
    </div>

    <el-dialog v-model="showDialog" title="新建批注">
      <el-input v-model="newNoteContent" type="textarea" :rows="4" />
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="$emit('create-note', newNoteContent)">提交</el-button>
      </template>
    </el-dialog>


  </div>
</template>

<style scoped>
.new-note-footer {
  padding: 16px;
  border-top: 1px solid #ebeef5;
}

.annotation-panel {
  position: fixed;
  right: 20px;
  width: 300px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  z-index: 1000;
  transition: top 0.3s ease;
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
  white-space: pre-wrap; /* 保留换行格式 */
}

.note-footer {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}
</style>
