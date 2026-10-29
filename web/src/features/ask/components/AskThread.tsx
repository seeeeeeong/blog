import Link from 'next/link'
import { type Exchange, sourceHref } from '@/features/ask/utils/conversation'

function Answer({ exchange }: { exchange: Exchange }) {
  const { answer, sources, status, error } = exchange
  const general = exchange.grounded === false ? ' ask__bubble--general' : ''
  return (
    <li
      className={`ask__bubble ask__bubble--bot${general}`}
      aria-busy={status === 'waiting' || status === 'streaming'}
    >
      {status === 'waiting' && (
        <span className="ask__thinking" role="img" aria-label="답변 생성 중">
          <span />
          <span />
          <span />
        </span>
      )}
      {answer && <p className="ask__text">{answer}</p>}
      {error && <p className="ask__error">{error}</p>}
      {sources.length > 0 && (
        <ul className="ask__sources" aria-label="출처">
          {sources.map((source) => (
            <li key={source.slug}>
              <Link href={sourceHref(source)}>{source.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * The questions and their answers, oldest first. An answer is plain text, its line breaks kept;
 * one that does not come from the posts is set apart.
 */
export function AskThread({ exchanges }: { exchanges: readonly Exchange[] }) {
  return (
    <ol className="ask__thread" aria-live="polite">
      {exchanges.flatMap((exchange) => [
        <li key={`q${exchange.id}`} className="ask__bubble ask__bubble--user">
          {exchange.question}
        </li>,
        <Answer key={`a${exchange.id}`} exchange={exchange} />,
      ])}
    </ol>
  )
}
