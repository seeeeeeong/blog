type Props = {
  questions: string[]
  answers: string[]
  onAnswer: (index: number, value: string) => void
}

/** The model's questions about the memo, each with a line for the admin's answer; a blank one is skipped. */
export function MemoQuestions({ questions, answers, onAnswer }: Props) {
  if (questions.length === 0) return null
  return (
    <ol className="mquestions" aria-label="보충 질문">
      {questions.map((question, index) => (
        <li key={question}>
          <label>
            <span>{question}</span>
            <textarea
              rows={2}
              value={answers[index] ?? ''}
              onChange={(event) => onAnswer(index, event.target.value)}
            />
          </label>
        </li>
      ))}
    </ol>
  )
}
