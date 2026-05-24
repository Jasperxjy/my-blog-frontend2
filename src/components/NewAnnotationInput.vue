<template>
  <div v-if="visible" class="new-annotation-input">
    <el-input
      v-model="newNoteContent"
      type="textarea"
      :rows="4"
      placeholder="请输入批注内容"
    />
    <div class="input-buttons">
      <el-button @click="cancel" class="cancel-btn">取消</el-button>
      <el-button type="primary" @click="submit" class="submit-btn">提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineExpose } from 'vue';
import { ElMessage } from 'element-plus';
const visible = ref(false);
const newNoteContent = ref('');
const emit = defineEmits(['create-note']);

// 显示输入框
const show = () => {
  visible.value = true;
};

// 隐藏输入框
const cancel = () => {
  visible.value = false;
  newNoteContent.value = ''; // 清空输入内容
};

// 提交新批注
const submit = () => {
  if (newNoteContent.value.trim()) {
    emit('create-note', newNoteContent.value);
    cancel(); // 提交后重置输入框
    ElMessage.success('批注已提交')
  } else {
    ElMessage.warning('请输入批注内容');
  }
};

// 暴露方法给父组件
defineExpose({
  show,
  cancel
});
</script>

<style scoped>
.new-annotation-input {
  margin-top: var(--space-4);
  background: var(--color-bg-surface);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  z-index: 1002;
}

.input-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
  gap: var(--space-2);
}
</style>
