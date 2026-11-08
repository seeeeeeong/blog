import type { MDXComponents } from 'mdx/types'
import { Callout } from '@/features/posts/components/Callout'
import { Explanation } from '@/features/posts/components/Explanation'
import { Mark } from '@/features/posts/components/Mark'
import { Quiz } from '@/features/posts/components/Quiz'
import { Tone } from '@/features/posts/components/Tone'

/** The prose components a post may use by name; a route adds the widgets it registers. */
export const PROSE_COMPONENTS = { Callout, Explanation, Mark, Quiz, Tone } satisfies MDXComponents
