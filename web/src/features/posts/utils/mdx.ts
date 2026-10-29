import { evaluate } from '@mdx-js/mdx'
import type { MDXContent } from 'mdx/types'
import * as runtime from 'react/jsx-runtime'
import { remarkHeadingIds } from '@/features/posts/utils/headings'
import { rehypeCodeBlocks } from '@/features/posts/utils/highlight'
import { remarkGuard } from '@/features/posts/utils/mdx-guard'

/**
 * A post's body as a component, compiled on the server for each request. Only the [allowed]
 * components can appear in it; null when the MDX does not parse.
 */
export async function compileMdx(
  source: string,
  allowed: readonly string[],
): Promise<MDXContent | null> {
  try {
    const { default: Content } = await evaluate(source, {
      ...runtime,
      remarkPlugins: [[remarkGuard, allowed], remarkHeadingIds],
      rehypePlugins: [rehypeCodeBlocks],
    })
    return Content
  } catch (error) {
    console.error('A post body did not compile', error)
    return null
  }
}
