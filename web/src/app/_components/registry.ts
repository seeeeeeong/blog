import { PROSE_COMPONENTS } from '@/features/posts/components/registry'
import { WIDGETS } from '@/features/widgets/components/registry'

/** Everything a post's MDX may name; any other element in a body is dropped before it compiles. */
export const POST_COMPONENTS = { ...PROSE_COMPONENTS, ...WIDGETS }
