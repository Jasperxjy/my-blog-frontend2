<template>
  <div class="editor">
    <div class="menu-bar">
      <button @click="editor?.chain().focus().toggleBold().run()" :class="{ active: editor?.isActive('bold') }">
        加粗
      </button>
      <button @click="editor?.chain().focus().toggleItalic().run()" :class="{ active: editor?.isActive('italic') }">
        斜体
      </button>
      <button @click="editor?.chain().focus().toggleStrike().run()" :class="{ active: editor?.isActive('strike') }">
        删除线
      </button>
      <button @click="editor?.chain().focus().toggleCode().run()" :class="{ active: editor?.isActive('code') }">
        行内代码
      </button>
      <button @click="editor?.chain().focus().toggleUnderline().run()"
        :class="{ active: editor?.isActive('underline') }">
        下划线
      </button>
      <button @click="editor?.chain().focus().toggleHighlight().run()"
        :class="{ active: editor?.isActive('highlight') }">
        高亮
      </button>
      <button @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ active: editor?.isActive('heading', { level: 1 }) }">
        H1
      </button>
      <button @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ active: editor?.isActive('heading', { level: 2 }) }">
        H2
      </button>
      <button @click="editor?.chain().focus().toggleBulletList().run()"
        :class="{ active: editor?.isActive('bulletList') }">
        无序列表
      </button>
      <button @click="editor?.chain().focus().toggleOrderedList().run()"
        :class="{ active: editor?.isActive('orderedListItem') }">
        有序列表
      </button>
      <button @click="editor?.chain().focus().toggleBlockquote().run()"
        :class="{ active: editor?.isActive('blockquote') }">
        引用
      </button>
      <button @click="editor?.chain().focus().toggleCodeBlock().run()"
        :class="{ active: editor?.isActive('codeBlock') }">
        代码块
      </button>
      <button @click="editor?.chain().focus().setHorizontalRule().run()">
        分割线
      </button>
      <button @click="editor?.chain().focus().setImage({ src: '' }).run()">
        图片
      </button>
      <button @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">
        表格
      </button>
      <button @click="editor?.chain().focus().setHardBreak().run()">
        硬换行
      </button>
      <button @click="editor?.chain().focus().toggleLink({ href: '' }).run()">
        链接
      </button>
    </div>
    <editor-content :editor="editor" class="editor-content" spellcheck="false" />
  </div>
</template>

<script setup lang="ts">
declare global {
  interface HTMLElementEventMap {
    'annotation-click': CustomEvent<{ id: string; pos: DOMRect }>
  }
}
import { useEditor, EditorContent } from '@tiptap/vue-3'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import OrderedList from '@tiptap/extension-ordered-list'
import Link from '@tiptap/extension-link'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Blockquote from '@tiptap/extension-blockquote'
import Code from '@tiptap/extension-code'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Document from '@tiptap/extension-document'
import { createLowlight } from 'lowlight'
import { watch, onBeforeUnmount, ref, onMounted } from 'vue'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import { Annotation } from '@/extensions/annotation.ts'
import type { Note } from '@/types/essay'
import StarterKit from '@tiptap/starter-kit'
import { ElMessage } from 'element-plus'
import { uploadImage, deleteImage } from '@/api/image'
import { IMAGE_BASE_URL } from '@/utils/constants'
import type { Result } from '@/types/common';
import type { Image as typeImage } from '@/types/image';


// 修改 props 定义
const props = defineProps<{
  modelValue: string
  editable?: boolean
  notes?: Note[] // 新增批注属性
  essayId?: string // 新增文章ID属性
}>()

// 合并事件定义
const emit = defineEmits(['annotation-click', 'update:model-value']);
// 新增当前光标位置
const currentCursorPos = ref<number | null>(null)
// 在编辑器配置中增强点击处理
const handleAnnotationClick = (event: CustomEvent) => {
  emit('annotation-click', event.detail) // 将事件传递给父组件
}



const lowlight = createLowlight()
lowlight.register('html', html)
lowlight.register('css', css)
lowlight.register('js', js)
lowlight.register('javascript', js) // 添加别名
lowlight.register('ts', ts)
lowlight.register('typescript', ts)
lowlight.register('py', python)
lowlight.register('python', python)
lowlight.register('java', java)
lowlight.register('cpp', cpp)
lowlight.register('c++', cpp)
lowlight.register('json', json)
lowlight.register('bash', bash)
lowlight.register('shell', bash)
lowlight.register('sh', bash)

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

const handleImageUpload = async (file: File, pos: number) => {
  if (!editor.value || !props.essayId) return
  try {
    const result = await uploadImage(file, props.essayId)
    if (!result.data) throw new Error('上传失败')
    const data = result.data
    editor.value.chain().insertContentAt(pos, {
      type: 'image',
      attrs: {
        src: `${IMAGE_BASE_URL}${data.filePath}`,
        serverId: data.imageId,
        alt: file.name,
        title: file.name
      }
    }).focus().run()
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

const handleWindowDragOver = (event: DragEvent) => {
  // 只有事件目标在编辑器区域内才阻止默认行为
  const editorEl = document.querySelector('.editor')
  if (editorEl && editorEl.contains(event.target as Node)) {
    event.preventDefault()
  }
}

const handleWindowDrop = (event: DragEvent) => {
  const editorEl = document.querySelector('.editor')
  if (!editorEl || !editorEl.contains(event.target as Node)) return

  event.preventDefault()
  event.stopPropagation()

  if (!editor.value || !props.essayId) {
    ElMessage.warning('编辑器未就绪或文章ID缺失')
    return
  }

  const dt = event.dataTransfer
  const files = Array.from(dt?.files || []).filter((f) =>
    ALLOWED_IMAGE_TYPES.includes(f.type)
  )

  if (!files.length) {
    ElMessage.info(`未检测到图片文件，dataTransfer.types: ${JSON.stringify(dt?.types || [])}`)
    return
  }

  ElMessage.info(`检测到 ${files.length} 个图片文件，开始上传...`)

  const view = editor.value.view
  const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
  const pos = coords?.pos ?? view.state.selection.$anchor.pos
  files.forEach((file) => handleImageUpload(file, pos))
}

const handleWindowPaste = (event: ClipboardEvent) => {
  const editorEl = document.querySelector('.editor')
  if (!editorEl || !editorEl.contains(event.target as Node)) return

  if (!editor.value || !props.essayId) {
    ElMessage.warning('编辑器未就绪或文章ID缺失')
    return
  }

  const items = Array.from(event.clipboardData?.items || [])
  const imageItems = items.filter((item) =>
    ALLOWED_IMAGE_TYPES.includes(item.type)
  )

  if (!imageItems.length) {
    // 没有图片数据，不拦截，让 ProseMirror 正常处理文本粘贴
    return
  }

  event.preventDefault()
  event.stopPropagation()

  ElMessage.info(`检测到 ${imageItems.length} 个粘贴图片，开始上传...`)

  const pos = editor.value.view.state.selection.$anchor.pos
  imageItems.forEach((item) => {
    const file = item.getAsFile()
    if (file) handleImageUpload(file, pos)
  })
}

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable ?? true, // 默认可编辑
  onUpdate: ({ editor }) => {
    currentCursorPos.value = editor.state.selection.$anchor.pos
    emit('update:model-value', editor.getHTML())
  },
  editorProps: {
    handleDOMEvents: {
      // drag/drop/paste 事件通过 Vue 模板 capture 阶段处理，见 handleDragOver/handleDrop/handlePaste
    },
  },
  extensions: [
    StarterKit,
    Annotation.configure({
      HTMLAttributes: {
        class: 'annotation-marker',
      },
    }).extend({
      addAttributes() {
        return {
          id: {
            default: null,
          },
        }
      }
    }
    ),
    Document,
    Paragraph,
    OrderedList,
    Text,
    Heading,
    BulletList,
    ListItem,
    HorizontalRule,
    Blockquote,
    CodeBlockLowlight.configure({
      lowlight, languageClassPrefix: 'language-',
      defaultLanguage: 'plaintext'

    }).extend({
      addNodeView() {
        return ({ node, editor, getPos, HTMLAttributes }) => {
          const div = document.createElement('div')
          const pre = document.createElement('pre')
          const code = document.createElement('code')
          const select = document.createElement('select')
          div.style.position = 'relative'
          div.style.paddingBottom = '0px'
          select.className = 'language-selector'
          select.innerHTML = `
            <option value="plaintext">Plain Text</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="json">JSON</option>
            <option value="bash">Shell / Bash</option>
          `
          select.value = node.attrs.language || 'plaintext'
          pre.dataset.language = node.attrs.language || 'plaintext'

          select.onchange = (e) => {
            e.stopPropagation()
            const lang = (e.target as HTMLSelectElement).value
            pre.dataset.language = lang
            const pos = typeof getPos === 'function' ? getPos() : null
            if (pos !== null) {
              editor.commands.command(({ tr, dispatch }) => {
                const nodeAtPos = editor.state.doc.nodeAt(pos)
                if (!nodeAtPos || nodeAtPos.type.name !== 'codeBlock') return false
                tr.setNodeMarkup(pos, undefined, { ...nodeAtPos.attrs, language: lang })
                if (dispatch) dispatch(tr)
                return true
              })
            }
          }

          select.style.position = 'absolute'
          select.style.right = '6px'
          select.style.bottom = '-18px'

          div.style.position = 'relative'
          pre.append(code)
          div.append(pre, select)
          return {
            dom: div,
            contentDOM: code,
            update(updatedNode) {
              if (updatedNode.type.name !== 'codeBlock') return false
              const newLang = updatedNode.attrs.language || 'plaintext'
              if (newLang !== pre.dataset.language) {
                pre.dataset.language = newLang
                select.value = newLang
              }
              return true
            }
          }
        }
      }
    }),
    Image.configure({
      allowBase64: false,
    }).extend({
      addAttributes() {
        return {
          src: {
            default: null,
          },
          // 添加服务器文件标识属性
          serverId: {
            default: null,
            parseHTML: element => element.getAttribute('data-server-id'),
            renderHTML: attributes => ({ 'data-server-id': attributes.serverId })
          }
        }
      },
      addNodeView() {
        return ({ node, getPos, editor }) => {
          // 当图片被删除时触发
          const handleDelete = () => {
            if (node.attrs.serverId) {
              deleteImage(node.attrs.serverId)
                .catch(() => ElMessage.error('图片删除失败'))
            }
            const pos = typeof getPos === 'function' ? getPos() : undefined
            if (pos !== undefined) {
              editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
            }
          }

          // 添加删除按钮
          const container = document.createElement('div')
          const img = document.createElement('img')
          const delBtn = document.createElement('button')

          img.src = node.attrs.src
          delBtn.innerHTML = '×'
          delBtn.style.cssText = `
        position: absolute;
        right: 5px;
        top: 5px;
        background: #c94848;
        color: #ffffff;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        border: none;
        cursor: pointer;
        display: ${props.editable ? 'block' : 'none'};
        font-size: 14px;
        line-height: 20px;
        text-align: center;
      `
          delBtn.onclick = handleDelete

          container.style.position = 'relative'
          container.style.display = 'inline-block'
          container.append(img, delBtn)
          return {
            dom: container,
            update: () => {
              // 动态更新删除按钮显示状态
              delBtn.style.display = props.editable ? 'block' : 'none'
              return true
            }
          }
        }
      }
    }),
    Table.configure(
      { resizable: true }
    ),
    TableRow,
    TableCell,
    TableHeader,
    Bold,
    Code,
    Highlight,
    Italic,
    Link.configure({ openOnClick: false }),
    Strike,
    Underline,

  ]
})

// 在onMounted生命周期中添加
onMounted(() => {
  editor.value?.view.dom.addEventListener('annotation-click', handleAnnotationClick)
  window.addEventListener('dragover', handleWindowDragOver, true)
  window.addEventListener('drop', handleWindowDrop, true)
  window.addEventListener('paste', handleWindowPaste, true)
})



// 添加编辑器销毁逻辑
onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value?.view.dom.removeEventListener('annotation-click', handleAnnotationClick)
  window.removeEventListener('dragover', handleWindowDragOver, true)
  window.removeEventListener('drop', handleWindowDrop, true)
  window.removeEventListener('paste', handleWindowPaste, true)
})

// 添加内容同步逻辑
let isUpdatingFromParent = false
watch(() => props.modelValue, (newValue) => {
  if (!editor.value || isUpdatingFromParent) return
  const currentHtml = editor.value.getHTML()
  if (newValue !== currentHtml) {
    isUpdatingFromParent = true
    editor.value.commands.setContent(newValue)
    isUpdatingFromParent = false
  }
})


defineExpose({
  currentCursorPos,
  insertAnnotation(noteId: string, pos: number) {
    editor.value?.chain().focus().insertContentAt(pos, {
      type: 'annotation',
      attrs: {
        id: noteId,
        class: 'annotation-marker'
      },
      text: `批注`
    }).run()
  },
  getContent() {
    return editor.value?.getHTML() || ''
  }
})


</script>

<style lang="css">
/* 新增全局样式 */
.tiptap {

  /* 基础样式 */
  :first-child {
    margin-top: 0;
  }

  strong {
    font-weight: 600;
  }

  p {
    font-size: 18px;
    /* 继承基础字号 */
    line-height: 1.5;
    margin: 1em 0;
  }

  /* 表格插件样式 */
  table {
    border-collapse: collapse;
    margin: 1.25rem 0;
    width: 100%;

    td,
    th {
      border: 1px solid var(--color-border);
      padding: 8px 12px;
      min-width: 60px;
    }

    th {
      background-color: var(--color-bg-page);
      font-weight: 600;
    }
  }

  /* 图片插件样式 */
  img {
    display: block;
    height: auto;
    margin: 1.5rem 0;
    max-width: 100%;

    &.ProseMirror-selectednode {
      outline: 3px solid var(--color-accent);
    }
  }

  /* 高亮插件样式 */
  mark {
    background-color: var(--color-warning-light-5);
    padding: 0.2em 0.4em;
    border-radius: var(--radius-sm);
  }

  /* 代码块插件样式 — 核心结构由全局 code-theme.css 控制，
     这里仅保留编辑器特有的覆盖 */
  pre {
    margin: 1.5rem 0;
    overflow-x: auto;
  }

  pre code {
    display: block;
    padding: 0;
    background: transparent;
    color: inherit;
    font-size: 14px;
    line-height: 1.6;
  }

    @media (max-width: 768px) {
      .language-selector {
        position: absolute;
        right: 10px;
        bottom: 10px;
        opacity: 0.8;
        transition: opacity 0.2s;
        background: #333;
        border: 1px solid #555;
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10;

        &:hover {
          opacity: 1;
        }
      }
    }

  /* 水平线插件样式 */
  hr {
    border: none;
    border-top: 2px solid var(--color-border-strong);
    margin: 2rem 0;
  }

  /* 列表插件样式 */
  ul,
  ol {
    padding: 0 1rem;
    margin: 1.25rem 1rem 1.25rem 0.4rem;

    li {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
  }

  /* 引用插件样式 */
  blockquote {
    border-left: 3px solid var(--color-accent);
    margin: 1.5rem 0;
    padding-left: 1rem;
    color: var(--color-text-secondary);
    font-style: italic;
  }

  /* 标题插件样式 */
  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: 20px;
    line-height: 1.1;
    margin-top: 2.5rem;
    text-wrap: pretty;
  }

  h1,
  h2 {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 2.8rem;
  }

  h2 {
    font-size: 2.3rem;
  }

  h3 {
    font-size: 1.8rem;
  }

  h4,
  h5,
  h6 {
    font-size: 1.4rem;
  }
}

.editor {
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.menu-bar {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border-strong);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  background: var(--color-bg-surface);
}

.mention {
  background-color: var(--color-accent-subtle);
  border-radius: var(--radius-sm);
  box-decoration-break: clone;
  color: var(--color-accent);
  padding: 0.1rem 0.3rem;
}

.editor-content {
  top: 4rem;
  display: flex;
  flex-direction: column;
  /* 垂直排列 */
  height: 100%;
  /* 使容器占满父元素 */
}

.menu-bar button {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast), border-color var(--duration-fast);
  color: var(--color-text-secondary);
}

.menu-bar button:hover {
  background: var(--color-bg-page);
  border-color: var(--color-border-strong);
}

.menu-bar button.active {
  background: var(--color-accent-subtle);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.annotation-marker {
  background-color: var(--color-warning-light-9);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-warning-light-5);
  transition: background-color var(--duration-fast);

  &:hover {
    background-color: var(--color-warning-light-7);
  }
}

.ProseMirror {
  top: 0.5rem;
  min-height: 400px;
  /* 根据需要调整高度 */
  padding: 1rem;
  /* 添加内边距以避免内容紧贴边缘 */
  -webkit-user-modify: read-write-plaintext-only;
  user-select: text;
  caret-color: auto;

}


.ProseMirror-focused {
  outline: none;
  /* 移除焦点时的默认轮廓 */
}
</style>
