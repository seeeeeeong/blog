import type { JsxEditorProps } from '@mdxeditor/editor'
import { Icon } from '@/features/admin/components/Icon'
import { tagSource } from '@/features/admin/utils/blocks'

/** A tag the editor does not know: kept as written, and named as one readers will not see. */
export function RawBlock({ mdastNode }: JsxEditorProps) {
  return (
    <div className="rraw">
      <div className="rraw__head">
        모르는 태그
        <span className="rhidden">
          <Icon name="hidden" />
          독자에게 안 보임
        </span>
      </div>
      <code className="rraw__source">{tagSource(mdastNode)}</code>
    </div>
  )
}
