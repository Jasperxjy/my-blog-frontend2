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
    return {
      HTMLAttributes: {},
    }
  },

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          return { 'data-annotation-id': attributes.id }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'annotation',
        getAttrs: element => {
          if (typeof element === 'string') return false
          return {
            id: element.getAttribute('id'),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(
      this.options.HTMLAttributes,
      { 'data-annotation-id': HTMLAttributes.id },
      { class: 'annotation-marker' }
    ), '📝']
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
    return [
      new Plugin({
        key: new PluginKey('annotation'),
        props: {
          handleClick(view, pos, event) {
            const node = view.state.doc.nodeAt(pos)
            if (node?.type.name === 'annotation') {
              // 触发自定义事件
              const customEvent = new CustomEvent('annotation-click', {
                detail: { id: node.attrs.id, pos },
                bubbles: true,
              })
              view.dom.dispatchEvent(customEvent)
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})
