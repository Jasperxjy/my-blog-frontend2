<template>
    <div class="essay-edit">
        <Editor v-model="content" :initial-content="content" />
        <div class="preview">
            {{ content }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Editor from '../components/Editor.vue'

const content = ref('# 开始编写你的文章')
</script>

<style scoped>
.essay-edit {
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.preview {
    border: 1px solid #eee;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
}
</style>