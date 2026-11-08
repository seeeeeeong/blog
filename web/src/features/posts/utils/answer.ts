const ENDING = /(입니다|이에요|예요|이요|이다|요|임|은|는|이|가|을|를)$/
const NUMBER = /-?\d+(\.\d+)?/
const WHOLE_NUMBER = new RegExp(`^${NUMBER.source}$`)

/** How a typed answer fares; `needs-number` is not a wrong answer, only one in the wrong form. */
export type Verdict = 'empty' | 'right' | 'wrong' | 'needs-number'

/** The accepted answers in `answers="10|열"`, the first being the one the solution names. */
export function answerList(answers: string | undefined): string[] {
  return (answers ?? '')
    .split('|')
    .map((answer) => answer.trim())
    .filter((answer) => answer.length > 0)
}

/** An answer as compared: width, case, spacing and closing punctuation do not count. */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/−/g, '-')
    .toLowerCase()
    .replace(/[\s​]+/g, '')
    .replace(/[.。!?]+$/, '')
}

/**
 * Checks [input] against the accepted [answers]. A particle or an ending after the answer is
 * fine, and against a numeric answer only the first number typed counts, so "10개" is 10.
 */
export function judge(input: string, answers: readonly string[]): Verdict {
  const guess = normalizeAnswer(input)
  if (guess.length === 0) return 'empty'
  const accepted = answers.map(normalizeAnswer)
  if (accepted.includes(guess) || accepted.includes(guess.replace(ENDING, ''))) return 'right'
  const numbers = accepted
    .map((answer) => answer.replace(/,/g, ''))
    .filter((answer) => WHOLE_NUMBER.test(answer))
    .map(Number)
  if (numbers.length === 0) return 'wrong'
  const typed = guess.replace(/,/g, '').match(NUMBER)?.[0]
  if (typed === undefined) return numbers.length === accepted.length ? 'needs-number' : 'wrong'
  return numbers.includes(Number(typed)) ? 'right' : 'wrong'
}
