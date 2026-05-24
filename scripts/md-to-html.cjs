const fs = require('fs')
const { JSDOM } = require('jsdom')
const { Editor } = require('@tiptap/core')
const StarterKit = require('@tiptap/starter-kit').default
const Table = require('@tiptap/extension-table').default
const TableRow = require('@tiptap/extension-table-row').default
const TableCell = require('@tiptap/extension-table-cell').default
const TableHeader = require('@tiptap/extension-table-header').default
const Image = require('@tiptap/extension-image').default
const Link = require('@tiptap/extension-link').default
const Underline = require('@tiptap/extension-underline').default
const Highlight = require('@tiptap/extension-highlight').default
const markdownit = require('markdown-it')

const mdFilePath = process.argv[2]
if (!mdFilePath) {
  console.error('Usage: node md-to-html.js <markdown-file>')
  process.exit(1)
}

const mdContent = fs.readFileSync(mdFilePath, 'utf-8')
const md = markdownit({ html: true })
const htmlFromMd = md.render(mdContent)

const dom = new JSDOM('<!DOCTYPE html>')
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator

const editor = new Editor({
  extensions: [
    StarterKit,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Image.configure({ allowBase64: false }),
    Link.configure({ openOnClick: false }),
    Underline,
    Highlight,
  ],
  content: htmlFromMd,
})

console.log(editor.getHTML())
