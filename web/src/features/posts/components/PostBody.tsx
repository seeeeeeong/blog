import type { MDXComponents, MDXContent } from 'mdx/types'
import { CodeBlock } from '@/features/posts/components/CodeBlock'
import { ProseLink } from '@/features/posts/components/ProseLink'
import { ProseTable } from '@/features/posts/components/ProseTable'
import { CODE_BLOCK } from '@/features/posts/utils/highlight'

// What the renderer itself puts in a body, after the registry so a post cannot replace it.
const RENDERER: MDXComponents = {
  a: ProseLink,
  table: ProseTable,
  [CODE_BLOCK]: CodeBlock,
}

type Props = {
  /** The compiled body; null when it did not compile. */
  Content: MDXContent | null
  /** The components it was compiled to allow. */
  components: MDXComponents
}

export function PostBody({ Content, components }: Props) {
  if (!Content) return <p>본문을 표시하지 못했습니다.</p>
  return <Content components={{ ...components, ...RENDERER }} />
}
