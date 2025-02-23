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
  margin-top: 1rem;
  background: white; /* 新增背景 */
  padding: 16px;    /* 新增内边距 */
  border-radius: 8px; /* 新增圆角 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15); /* 新增阴影 */
  z-index: 1002; /* 确保在最顶层 */
}

.input-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.cancel-btn {
  margin-right: 0.5rem;
}
</style>
