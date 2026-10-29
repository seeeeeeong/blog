import type { MDXComponents } from 'mdx/types'
import { HandshakeWidget } from '@/features/widgets/components/HandshakeWidget'
import { ScenarioLink } from '@/features/widgets/components/ScenarioLink'
import { Seek } from '@/features/widgets/components/Seek'
import { WidgetIdea } from '@/features/widgets/components/WidgetIdea'

/** Every widget a post may use by name, with the links that drive them. Nothing else runs. */
export const WIDGETS = { HandshakeWidget, ScenarioLink, Seek, WidgetIdea } satisfies MDXComponents
