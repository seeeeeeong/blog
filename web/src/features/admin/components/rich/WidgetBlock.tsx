import type { JsxEditorProps } from '@mdxeditor/editor'
import { Icon } from '@/features/admin/components/Icon'

const HINTS: Record<string, string> = {
  HandshakeWidget: 'TCP 연결 애니메이션',
  HashTableFigure: '해시 테이블 그림',
  SafepointFigure: 'JVM 세이프포인트 그림',
}

/** A widget, which plays only on the post; here it is a card that says which one it is. */
export function WidgetBlock({ mdastNode }: JsxEditorProps) {
  const name = mdastNode.name ?? ''
  return (
    <div className="rwidget">
      <Icon name="widget" />
      <span className="rwidget__name">{name}</span>
      <span className="rwidget__hint">{HINTS[name]}</span>
    </div>
  )
}
