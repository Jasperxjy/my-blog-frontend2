<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, type ShallowRef } from 'vue'
import { useEditor , EditorContent, Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { Annotation } from '@/extensions/annotation'
import { getEssayNotes } from '@/api/essay'
import type { Note } from '@/types/essay'
import AnnotationPanel from './AnnotationPanel.vue'

const props = defineProps<{
  content: string
  readonly?: boolean
  essayId?: string
}>()

const editor: ShallowRef<Editor | undefined> = shallowRef();
const notes = ref<Note[]>([])
const loading = ref(false)

// 获取文章的所有批注
const fetchNotes = async () => {
  if (!props.essayId) return

  loading.value = true
  try {
    const result = await getEssayNotes(props.essayId)
    if (result.success && result.data) {
      notes.value = result.data
    }
  } catch (error) {
    console.error('获取批注失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const editorInstance = useEditor({
    content: props.content,
    editable: !props.readonly,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true

      }),
      Annotation.configure({
        HTMLAttributes: {
          class: 'annotation-marker'
        }
      })
    ],
    onBeforeCreate({ editor }) {
      console.log('初始化内容:', props.content)
    },
    onCreate({ editor }) {
      console.log('编辑器创建完成，当前内容:', editor.getHTML())
    },
    onUpdate({ editor }) {
      console.log('内容更新:', editor.getHTML())
    }
  });
  editor.value = editorInstance.value;

  if (props.essayId) {
    fetchNotes()
  }

})

// 监听内容变化
watch(
  () => props.content,
  (newContent) => {
    console.log('内容更新:', newContent) // 调试日志
    const editorInstance = editor.value
    if (editorInstance && newContent) {
      editorInstance.commands.setContent(newContent, false, {
        preserveWhitespace: true
      })
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="markdown-viewer-container">
    <div class="markdown-viewer">
      <editor-content :editor="editor" />
    </div>
    <annotation-panel :notes="notes" />
  </div>
</template>

<style>
.markdown-viewer-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  position: relative;
}

.markdown-viewer {
  flex: 1;
  width: 100%;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
}

.ProseMirror {
  min-height: 100vh;
  outline: none;
}

/* 标题样式 */
.markdown-viewer h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
  margin: 1em 0;
}

.markdown-viewer h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
  margin: 1em 0;
}

.markdown-viewer h3 {
  font-size: 1.25em;
  margin: 1em 0;
}

/* 列表样式 */
.markdown-viewer ul,
.markdown-viewer ol {
  padding-left: 2em;
  margin: 1em 0;
}

.markdown-viewer li + li {
  margin-top: 0.25em;
}

/* 代码块样式 */
.markdown-viewer .code-block {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 1em;
  margin: 1em 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  overflow-x: auto;
}

.markdown-viewer .inline-code {
  background: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
}

/* 引用样式 */
.markdown-viewer blockquote {
  margin: 1em 0;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

/* 链接样式 */
.markdown-viewer a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-viewer a:hover {
  text-decoration: underline;
}

/* 图片样式 */
.markdown-viewer img {
  max-width: 100%;
  height: auto;
  margin: 1em 0;
}

/* 分割线样式 */
.markdown-viewer hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
}

.annotation-marker {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: #FFE58F;
  border-radius: 50%;
  margin: 0 4px;
  cursor: pointer;
  vertical-align: middle;
  transition: background-color 0.2s;
}

.annotation-marker:hover {
  background-color: #FFCD44;
}
</style>
