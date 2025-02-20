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
    </div>
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
declare global {
  interface HTMLElementEventMap {
    'annotation-click': CustomEvent<{ id: string; pos: DOMRect }>
  }
}
// 移除Options API的组件声明
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
import FileHandler from '@tiptap-pro/extension-file-handler'
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
import { watch, onBeforeUnmount ,ref,onMounted} from 'vue'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import {Annotation} from '@/extensions/annotation.ts'
import type { Note } from '@/types/essay'
import StarterKit from '@tiptap/starter-kit'

// 修改 props 定义
const props = defineProps<{
  modelValue: string
  editable?: boolean
  notes?: Note[] // 新增批注属性
}>()

const emit = defineEmits(['annotation-click'])
// 添加批注面板逻辑
const selectedAnnotation = ref<{ id: string; pos: DOMRect | null }>({
  id: '',
  pos: null
})

// 在编辑器配置中增强点击处理
const handleAnnotationClick = (event: CustomEvent) => {
  emit('annotation-click', event.detail) // 将事件传递给父组件
}

const lowlight = createLowlight()
lowlight.register('html', html)
lowlight.register('css', css)
lowlight.register('javascript', js)
lowlight.register('typescript', ts)
lowlight.register('python', python)
lowlight.register('java', java)
lowlight.register('cpp', cpp)

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable ?? true, // 默认可编辑
  extensions: [
    StarterKit,
    Annotation,
    Document,
    Paragraph,
    OrderedList,
    Text,
    Heading,
    BulletList,
    ListItem,
    HorizontalRule,
    Blockquote,
    CodeBlockLowlight.configure({ lowlight, languageClassPrefix: 'language-',defaultLanguage: 'plaintext' }),
    Image.configure({ allowBase64: true }),
    Table.configure({ resizable: true }),
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
    FileHandler.configure({
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      onDrop: (currentEditor, files, pos) => {
        files.forEach(file => {
          const fileReader = new FileReader()

          fileReader.readAsDataURL(file)
          fileReader.onload = () => {
            currentEditor.chain().insertContentAt(pos, {
              type: 'image',
              attrs: {
                src: fileReader.result,
              },
            }).focus().run()
          }
        })
      },
      onPaste: (currentEditor, files, htmlContent) => {
        files.forEach(file => {
          if (htmlContent) {
            // if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
            // you could extract the pasted file from this url string and upload it to a server for example
            console.log(htmlContent) // eslint-disable-line no-console
            return false
          }

          const fileReader = new FileReader()

          fileReader.readAsDataURL(file)
          fileReader.onload = () => {
            currentEditor.chain().insertContentAt(currentEditor.state.selection.anchor, {
              type: 'image',
              attrs: {
                src: fileReader.result,
              },
            }).focus().run()
          }
        })
      },
    }),
  ]
})

// 在onMounted生命周期中添加
onMounted(() => {
  editor.value?.view.dom.addEventListener('annotation-click', handleAnnotationClick)
})

// 添加编辑器销毁逻辑
onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value?.view.dom.removeEventListener('annotation-click', handleAnnotationClick)

})

// 添加内容同步逻辑
watch(() => props.modelValue, (newValue) => {
  if (newValue !== editor.value?.getHTML()) {
    editor.value?.commands.setContent(newValue)
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

  strong{
    font-weight: 600;
  }

  p {
    font-size: 18px; /* 继承基础字号 */
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
      border: 1px solid #ddd;
      padding: 8px 12px;
      min-width: 100px;
    }

    th {
      background-color: #f5f5f5;
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
      outline: 3px solid var(--purple);
    }
  }

  /* 高亮插件样式 */
  mark {
    background-color: #FAF594;
    padding: 0.2em 0.4em;
    border-radius: 0.25em;
  }

  /* 代码块插件样式 */
  pre {

    /* 行号 */
    counter-reset: line;
    background: #1e1e1e;
    border-radius: 8px;
    color: #dcdcdc;
    font-family: 'Fira Code', monospace;
    margin: 1.5rem 0;

    padding: 1.5rem 1rem;
    position: relative;
    overflow-x: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    &::before {
      content: attr(data-language);
      position: absolute;
      top: 0;
      right: 1rem;
      color: #7f7f7f;
      font-size: 0.8em;
      text-transform: uppercase;
    }



    code {
      display: block;
      position: relative;
      padding-left: 3.5em;

      /* 行号样式 */
      &::before {
        content: counter(line);
        counter-increment: line;
        position: absolute;
        left: -2.5em;
        width: 2.5em;
        text-align: right;
        color: #666;
        user-select: none;
      }
    }

    /* 优化语法高亮 */
    .hljs-comment,
    .hljs-quote {

      color: #57a64a;
      font-style: italic;
    }

    .hljs-keyword {
      color: #569cd6;
      font-weight: 600;
    }


    .hljs-built_in,
    .hljs-type {
      color: #4ec9b0;
    }


    .hljs-string {
      color: #d69d85;
    }

    .hljs-number {
      color: #b5cea8;
    }

    .hljs-title {
      color: #dcdcaa;
    }

    .hljs-params {
      color: #9cdcfe;
    }

    .hljs-variable,
    .hljs-meta {
      color: #9b9b9b;
    }
  }

  /* 水平线插件样式 */
  hr {
    border: none;
    border-top: 2px solid #ddd;
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
    border-left: 3px solid var(--gray-3);
    margin: 1.5rem 0;
    padding-left: 1rem;
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
    font-size: 1.2rem;
  }
}

.editor {
  border: 1px solid #ccc;
  border-radius: 4px;
}

.menu-bar {
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mention {
  background-color: var(--purple-light);
  border-radius: 0.4rem;
  box-decoration-break: clone;
  color: var(--purple);
  padding: 0.1rem 0.3rem;
}





.menu-bar button {
  padding: 0.3rem 0.6rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.menu-bar button:hover {
  background: #f5f5f5;
}

.menu-bar button.active {
  background: #e6f4ff;
  border-color: #1890ff;
  color: #1890ff;
}

.annotation-marker {
  background-color: #fff3d8;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid #ffd799;
  transition: background-color 0.2s;

  &:hover {
    background-color: #ffe6b3;
  }
}

:deep(.ProseMirror) {
  padding: 1rem;
  min-height: 300px;
  outline: none;
}
</style>
