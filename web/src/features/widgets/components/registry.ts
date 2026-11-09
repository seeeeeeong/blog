import type { MDXComponents } from 'mdx/types'
import { HandshakeWidget } from '@/features/widgets/components/HandshakeWidget'
import { HashTableFigure } from '@/features/widgets/components/HashTableFigure'
import { SafepointFigure } from '@/features/widgets/components/SafepointFigure'
import { ScenarioLink } from '@/features/widgets/components/ScenarioLink'
import { Seek } from '@/features/widgets/components/Seek'
import { WidgetIdea } from '@/features/widgets/components/WidgetIdea'

/** Every widget a post may use by name, with the links that drive them. Nothing else runs. */
export const WIDGETS = {
  HandshakeWidget,
  HashTableFigure,
  SafepointFigure,
  ScenarioLink,
  Seek,
  WidgetIdea,
} satisfies MDXComponents
