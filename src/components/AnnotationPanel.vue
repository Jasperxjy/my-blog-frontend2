<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Note } from '@/types/essay'

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
// 在script部分添加
const showDialog = ref(false)
const newNoteContent = ref('')
// 过滤当前显示的批注
const currentNote = computed(() => {
  return props.notes.find(note => note.noteId === props.selectedAnnotation.id)
})
</script>

<template>
  <div class="annotation-panel" :style="{ top: selectedAnnotation.pos?.top + 'px' }">
    <div v-if="currentNote" class="note-card">
      <div class="note-header">
        <div class="user-info">用户：{{ currentNote.userId }}</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="note-content">{{ currentNote.content }}</div>
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
      <el-input
        v-model="newNoteContent"
        type="textarea"
        :rows="4" 
      />
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

.note-content {
  line-height: 1.6;
  color: #333;
}

.note-footer {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}
</style>
