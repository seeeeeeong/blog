import { type CompareBlock, changedWords, type WordPart } from '@/features/admin/utils/compare'

type Props = {
  blocks: CompareBlock[]
  taken: ReadonlySet<number>
  onToggle: (id: number) => void
}

type Change = Extract<CompareBlock, { kind: 'change' }>

/** The body now and the draft, change by change, each one the admin's to take or leave. */
export function DraftCompare({ blocks, taken, onToggle }: Props) {
  const only = blocks.length === 1 ? blocks[0] : undefined
  if (only?.kind === 'change' && only.before.length === 0) {
    return (
      <div className="mcompare">
        <pre className="mcompare__whole">{only.after.join('\n')}</pre>
      </div>
    )
  }
  return (
    <div className="mcompare">
      {blocks.map((block) =>
        block.kind === 'same' ? (
          <p className="mcompare__same" key={`same-${block.id}`}>
            {`같은 내용 ${block.lines.length}줄`}
          </p>
        ) : (
          <ChangeView
            key={block.id}
            block={block}
            taken={taken.has(block.id)}
            onToggle={() => onToggle(block.id)}
          />
        ),
      )}
    </div>
  )
}

type ChangeProps = {
  block: Change
  taken: boolean
  onToggle: () => void
}

function ChangeView({ block, taken, onToggle }: ChangeProps) {
  const words = changedWords(block.before.join('\n'), block.after.join('\n'))
  const removes = block.after.length === 0
  const adds = block.before.length === 0
  return (
    <section className="mcompare__change">
      <label>
        <input type="checkbox" checked={taken} onChange={onToggle} /> 이 변경 적용
      </label>
      <div className="mcompare__sides">
        {!adds && (
          <Side
            className="mcompare__before"
            caption={removes ? '지워지는 내용' : '지금 본문'}
            parts={words.before}
          />
        )}
        {!removes && (
          <Side
            className="mcompare__after"
            caption={adds ? '추가되는 내용' : '다듬은 글'}
            parts={words.after}
          />
        )}
      </div>
    </section>
  )
}

type SideProps = {
  className: string
  caption: string
  parts: WordPart[]
}

function Side({ className, caption, parts }: SideProps) {
  return (
    <figure className={className}>
      <figcaption>{caption}</figcaption>
      <pre>
        {parts.map((part) =>
          part.changed ? (
            <mark key={part.start}>{part.text}</mark>
          ) : (
            <span key={part.start}>{part.text}</span>
          ),
        )}
      </pre>
    </figure>
  )
}
