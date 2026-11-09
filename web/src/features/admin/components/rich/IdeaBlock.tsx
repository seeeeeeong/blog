'use client'

import { type JsxEditorProps, useMdastNodeUpdater } from '@mdxeditor/editor'
import { Icon } from '@/features/admin/components/Icon'
import { attributeOf, withAttribute } from '@/features/admin/utils/blocks'

/** `<WidgetIdea note>`: the owner's note for a figure to come, which readers never see. */
export function IdeaBlock({ mdastNode }: JsxEditorProps) {
  const update = useMdastNodeUpdater()
  return (
    <div className="ridea">
      <Icon name="idea" />
      <div className="ridea__body">
        <div className="ridea__head">
          그림 아이디어
          <span className="rhidden">
            <Icon name="hidden" />
            독자에게 안 보임
          </span>
        </div>
        <textarea
          className="ridea__note"
          aria-label="그림 아이디어"
          rows={1}
          value={attributeOf(mdastNode, 'note') ?? ''}
          onChange={(event) =>
            update({ attributes: withAttribute(mdastNode, 'note', event.target.value) })
          }
        />
      </div>
    </div>
  )
}
