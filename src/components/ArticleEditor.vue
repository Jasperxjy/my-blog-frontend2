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
    <editor-content :editor="editor" class="editor-content" spellcheck="false"/>
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
import { watch, onBeforeUnmount, ref, onMounted } from 'vue'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
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

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable ?? true, // 默认可编辑
  onUpdate: ({ editor }) => {
    currentCursorPos.value = editor.state.selection.$anchor.pos
    emit('update:model-value', editor.getHTML())
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
        return ({ node, editor, HTMLAttributes }) => {
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
          `
          select.value = node.attrs.language || 'plaintext'

          select.onchange = (e) => {
            editor.commands.updateAttributes('codeBlock', {
              language: (e.target as HTMLSelectElement).value
            })
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
        background: red;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        border: none;
        cursor: pointer;
        display: ${props.editable ? 'block' : 'none'};
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
    FileHandler.configure({
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      onDrop: async (currentEditor, files, pos) => {
        for (const file of files) {
          try {
            const formData = new FormData()
            formData.append('image', file)
            // 上传图片到服务器
            const result = await uploadImage(file, props.essayId) as Result
            const data = result.data as typeImage
            // 插入图片链接
            currentEditor.chain().insertContentAt(pos, {
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
      },
      onPaste: async (currentEditor, files) => {
        const pos = currentEditor.state.selection.$anchor.pos
        for (const file of files) {
          try {
            const formData = new FormData()
            formData.append('image', file)
            // 上传图片到服务器
            const result = await uploadImage(file, props.essayId) as Result
            const data = result.data as typeImage
            // 插入图片链接
            currentEditor.chain().insertContentAt(pos, {
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
      }
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
    counter-reset: line;
    background: #1e1e1e;
    border-radius: 8px;
    color: #dcdcdc;
    font-family: 'Fira Code', monospace;
    margin: 1.5rem 0 ;
    padding: 2rem 1rem 1rem;
    /* 增加顶部内边距 */
    position: relative;
    overflow-x: auto;
    box-shadow: 0 4px 6px rgba(15, 15, 15, 0.1);
    line-height: 1.5;



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
      overflow-x: auto;
      padding: 1em;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 14px;
      line-height: 1.6;

      .line {
        display: block;
        counter-increment: line;

        &::before {
          content: counter(line);
        position: absolute;
          left: -3.5em;
          width: 3em;
        text-align: right;
        color: #666;
        user-select: none;
          padding-right: 0.5em;
      }
    }

    /* 优化语法高亮 */
      .hljs-attr,
      .hljs-attribute {
        color: #9cdcfe;
      }

      .hljs-function {
        .hljs-title {
          color: #dcdcaa;
        }
      }

      .hljs-comment {
        color: #6a9955;
        font-style: italic;
      }

    .hljs-quote {

      color: #57a64a;
      font-style: italic;
    }

    .hljs-keyword {
      color: #569cd6;
        font-weight: bold;
    }


      .hljs-built_in {
        color: #4ec9b0;
      }

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

        &,
        &.class_ {
      color: #dcdcaa;
    }
      }

    .hljs-params {
      color: #9cdcfe;
    }

    .hljs-variable,
    .hljs-meta {
      color: #9b9b9b;
    }
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
    font-size: 1.4rem;
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
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s;
  /* 添加过渡效果 */
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
