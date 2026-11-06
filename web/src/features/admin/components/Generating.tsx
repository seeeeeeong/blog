const STEPS = 3

type Props = {
  /** The step the run is on, from 0; no steps for a run that has only one. */
  step?: number
  /** The step in words, read out but not shown. */
  label: string
}

/** What stands in for a draft while the model works: motion, and words for a screen reader only. */
export function Generating({ step, label }: Props) {
  return (
    <div className="mgen" role="status">
      <span className="sr-only">{label}</span>
      <div className="mgen__page" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      {step !== undefined && (
        <div className="mgen__steps" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: the steps are fixed and never move
              key={index}
              className="mgen__step"
              data-step={index < step ? 'done' : index === step ? 'current' : 'next'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
