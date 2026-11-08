import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Explanation } from '@/features/posts/components/Explanation'
import { QuizForm } from '@/features/posts/components/QuizForm'
import { answerList } from '@/features/posts/utils/answer'

type Props = { answers?: string; children?: ReactNode }

function isExplanation(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement(node) && node.type === Explanation
}

/**
 * `<Quiz answers="10|열">` around a question, with its solution in `<Explanation>`: the reader
 * types an answer, checked against the `|`-separated ones, and can open the solution at any time.
 */
export function Quiz({ answers, children }: Props) {
  const parts = Children.toArray(children)
  return (
    <QuizForm
      answers={answerList(answers)}
      question={parts.filter((part) => !isExplanation(part))}
      explanation={parts.find(isExplanation)?.props.children}
    />
  )
}
