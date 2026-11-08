/// <reference types="remark-parse" />
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import type { Processor } from 'unified'

/**
 * GFM tables and nothing else of GFM: its single-tilde strikethrough would cut through a Korean
 * range such as "1~10 사이, 20~30", and its footnotes and bare-URL links are not part of a post.
 */
export function remarkTables(this: Processor) {
  const data = this.data()
  data.micromarkExtensions = [...(data.micromarkExtensions ?? []), gfmTable()]
  data.fromMarkdownExtensions = [...(data.fromMarkdownExtensions ?? []), gfmTableFromMarkdown()]
}
