import type { CompareBlock } from '@/features/admin/utils/compare'

type Props = {
  blocks: CompareBlock[]
  taken: ReadonlySet<number>
  onToggle: (id: number) => void
}

/** The body now and the draft, change by change, each one the admin's to take or leave. */
export function DraftCompare({ blocks, taken, onToggle }: Props) {
  return (
    <div className="mcompare">
      {blocks.map((block) =>
        block.kind === 'same' ? (
          <p className="mcompare__same" key={`same-${block.lines.join('\n')}`}>
            같은 내용 {block.lines.length}줄
          </p>
        ) : (
          <section className="mcompare__change" key={block.id}>
            <label>
              <input
                type="checkbox"
                checked={taken.has(block.id)}
                onChange={() => onToggle(block.id)}
              />{' '}
              이 변경 적용
            </label>
            <div className="mcompare__sides">
              <figure>
                <figcaption>지금 본문</figcaption>
                <pre>{block.before.join('\n')}</pre>
              </figure>
              <figure>
                <figcaption>다듬은 글</figcaption>
                <pre>{block.after.join('\n')}</pre>
              </figure>
            </div>
          </section>
        ),
      )}
    </div>
  )
}
