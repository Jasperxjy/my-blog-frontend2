import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotation: {
      setAnnotation: (annotationId: string) => ReturnType
    }
  }
}

export interface AnnotationOptions {
  HTMLAttributes: Record<string, string>
}

export const Annotation = Node.create<AnnotationOptions>({
  name: 'annotation',

  addOptions() {
    console.log('批注组件: 初始化选项')
    return {
      HTMLAttributes: {},
    }
  },

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addAttributes() {
    console.log('批注组件: 添加属性')
    return {
      id: {
        default: null,
        parseHTML: element => {
          const id = element.getAttribute('id')
          console.log('批注组件: 解析HTML属性', { id })
          return id
        },
        renderHTML: attributes => {
          console.log('批注组件: 渲染HTML属性', attributes)
          return { 'id': attributes.id }
        },
      },
    }
  },

  parseHTML() {
    console.log('批注组件: 解析HTML')
    return [
      {
        tag: 'annotation',
        getAttrs: element => {
          console.log('批注组件: 获取属性', element)
          if (typeof element === 'string') return false
          return {
            id: element.getAttribute('id'),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    console.log('批注组件: 渲染HTML', HTMLAttributes)
    return ['annotation',
      mergeAttributes(
        this.options.HTMLAttributes,
        {
          id: HTMLAttributes.id,
          class: 'annotation-marker',
          style: 'cursor: pointer;'
        }
      ),
      '📌']
  },

  addCommands() {
    return {
      setAnnotation:
        (annotationId: string) =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: { id: annotationId },
            })
          },
    }
  },

  addProseMirrorPlugins() {
    console.log('批注组件: 添加插件')
    return [
      new Plugin({
        key: new PluginKey('annotation'),
        props: {
          handleClick(view, pos, event) {
            // 添加事件类型检查
            if (!(event instanceof MouseEvent)) return false
            // 获取精确的DOM位置
            const coordinates = view.posAtCoords({ left: event.clientX + 5, top: event.clientY + 5 })
            if (!coordinates) return false

            const resolvedPos = view.state.doc.resolve(coordinates?.pos || pos)
            const node = view.state.doc.nodeAt(coordinates.pos)
            const isAnnotationNode = node?.type.name === this.spec.view?.name

            // 调试日志
            console.log('点击坐标:', coordinates, '节点类型:', node?.type.name)
            // 精确检测点击目标
            const target = (event.target as HTMLElement).closest('.annotation-marker')
            if (target && isAnnotationNode) {
              const id = target.id
              const rect = target.getBoundingClientRect()
              //检测是否点击了批注组件
              console.log('检测到批注点击:', id)

              // 添加边界检查
              if (!view.dom.isConnected) return false

              // 触发自定义事件
              const customEvent = new CustomEvent('annotation-click', {
                detail: { id: id, pos: target.getBoundingClientRect() },
                bubbles: true,
                composed: true
              })
              // 添加事件派发结果检查
              const success = view.dom.dispatchEvent(customEvent)
              console.log('事件派发结果:', success)
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})
