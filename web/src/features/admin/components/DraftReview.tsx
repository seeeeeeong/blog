import type { PostDraft } from '@/features/admin/api/types'
import { checkLabel } from '@/features/admin/utils/memo'

type Props = {
  draft: PostDraft
}

/** What the review and the machine checks found in a draft, most urgent first; empty groups do not show. */
export function DraftReview({ draft }: Props) {
  const { review, checks, revised } = draft
  return (
    <div className="mreview">
      {revised && <p>검토에서 나온 치명적 문제를 고쳐 한 번 다시 썼습니다.</p>}
      {review === null && (
        <p className="aerror" role="alert">
          검토를 받지 못했습니다. 사실을 직접 확인해 주세요.
        </p>
      )}
      <Group
        title="꼭 고칠 점"
        items={review?.critical.map((item) => [
          item.problem,
          `"${item.quote}"`,
          `고칠 방법: ${item.fix}`,
        ])}
      />
      <Group
        title="지어낸 경험"
        items={review?.invented.map((item) => [`"${item.quote}"`, item.reason])}
      />
      <Group
        title="메모와 다르게 쓴 사실"
        items={review?.corrections.map((item) => [
          `메모: ${item.memo}`,
          `글: ${item.draft}`,
          item.reason,
        ])}
      />
      <Group title="빠진 내용" items={review?.dropped.map((item) => [item])} />
      <Group
        title="기계 점검"
        items={checks.map((check) => [`${checkLabel(check.kind)}: ${check.detail}`])}
      />
      <Group
        title="메모에 없이 추가된 사실"
        items={review?.addedFacts.map((fact) => [
          `${fact.confidence === 'LOW' ? '[확실하지 않음] ' : ''}${fact.claim}`,
        ])}
      />
    </div>
  )
}

/** The model quotes MDX; its marks only get in the way of reading here. */
function plain(line: string): string {
  return line.replaceAll('**', '').replaceAll('`', '')
}

function Group({ title, items }: { title: string; items?: string[][] }) {
  if (!items || items.length === 0) return null
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {items.map((lines) => (
          <li key={lines.join('\n')}>
            {lines.map((line) => (
              <span className="mreview__line" key={line}>
                {plain(line)}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </section>
  )
}
