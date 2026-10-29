'use client'

import './widget.css'
import { type CSSProperties, useRef, useState } from 'react'
import { HandshakeDrawing } from '@/features/widgets/components/HandshakeDrawing'
import { PlayButton } from '@/features/widgets/components/PlayButton'
import { useFontScale } from '@/features/widgets/hooks/useFontScale'
import { useTimeline } from '@/features/widgets/hooks/useTimeline'
import { useWidgetCommands } from '@/features/widgets/hooks/useWidgetCommands'
import {
  HANDSHAKE,
  isScenario,
  SCENARIO_LABELS,
  SCENARIOS,
  type Scenario,
  STEPS,
} from '@/features/widgets/utils/handshake'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const SCENARIO_ORDER: readonly Scenario[] = ['normal', 'loss']

/**
 * `<HandshakeWidget />`: TCP's three-way handshake on a timeline the reader plays, scrubs, or
 * moves from `<Seek>` and `<ScenarioLink>` in the text.
 */
export function HandshakeWidget() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<SVGSVGElement>(null)
  const still = useReducedMotion()
  const scale = useFontScale(canvas)
  const [scenario, setScenario] = useState<Scenario>('normal')
  const { step, playing, toggle, pause, scrub, seek, setStep } = useTimeline(still)

  const choose = (next: Scenario) => {
    setScenario(next)
    if (playing) setStep(0)
  }

  useWidgetCommands(HANDSHAKE, (command) => {
    root.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' })
    if (command.type === 'seek') {
      seek(command.to)
    } else if (isScenario(command.scenario)) {
      setScenario(command.scenario)
      setStep(0)
      seek(1)
    }
  })

  const t = step / STEPS
  return (
    <div className="widget" id={HANDSHAKE} ref={root}>
      <div className="widget__stage">
        <HandshakeDrawing ref={canvas} packets={SCENARIOS[scenario]} t={t} scale={scale} />
      </div>
      <div className="widget__controls">
        <fieldset className="segmented" aria-label="시나리오">
          {SCENARIO_ORDER.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={scenario === name}
              onClick={() => choose(name)}
            >
              {SCENARIO_LABELS[name]}
            </button>
          ))}
        </fieldset>
        <PlayButton playing={playing} onToggle={toggle} />
        <label className="slider" style={{ '--value': `${t * 100}%` } as CSSProperties}>
          <span className="mono">Time</span>
          <input
            type="range"
            min={0}
            max={STEPS}
            value={step}
            aria-label="시간"
            onChange={(event) => scrub(Number(event.target.value))}
            onPointerDown={pause}
            onKeyDown={pause}
          />
        </label>
      </div>
    </div>
  )
}
