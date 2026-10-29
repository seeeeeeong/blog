import type { CSSProperties, Ref } from 'react'
import {
  clientState,
  LIFELINE,
  type Packet,
  packetFrame,
  type Side,
  serverState,
  timeoutFrame,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  yOf,
} from '@/features/widgets/utils/handshake'

type Props = {
  packets: readonly Packet[]
  /** Time on the timeline, 0 to 1. */
  t: number
  /** How much larger the text is drawn, so it stays readable on a narrow screen. */
  scale: number
  ref?: Ref<SVGSVGElement>
}

const NAMES: Record<Side, string> = { client: '클라이언트', server: '서버' }

const stroke = (color: string): CSSProperties => ({ stroke: `var(${color})` })

function Lifeline({ side, state, scale }: { side: Side; state: string; scale: number }) {
  const x = LIFELINE[side]
  return (
    <g>
      <text x={x} y={26} textAnchor="middle" className="hs-name">
        {NAMES[side]}
      </text>
      <text x={x} y={26 + 22 * scale} textAnchor="middle" className="hs-state">
        {state}
      </text>
      <line
        x1={x}
        y1={yOf(0) - 10}
        x2={x}
        y2={yOf(1) + 6}
        className="hs-lifeline"
        strokeWidth={2}
      />
    </g>
  )
}

function PacketLine({ packet, t }: { packet: Packet; t: number }) {
  const frame = packetFrame(packet, t)
  if (!frame) return null
  const { x0, y0, x, y, head, label } = frame
  return (
    <g>
      <line
        x1={x0}
        y1={y0}
        x2={x}
        y2={y}
        style={stroke(packet.color)}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {head === 'dot' && <circle cx={x} cy={y} r={6} style={{ fill: `var(${packet.color})` }} />}
      {head === 'cross' && (
        <>
          <path
            d={`M${x - 7} ${y - 7}L${x + 7} ${y + 7}M${x + 7} ${y - 7}L${x - 7} ${y + 7}`}
            style={stroke(packet.color)}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text x={x} y={y + 24} textAnchor="middle" className="hs-note">
            유실
          </text>
        </>
      )}
      {label && (
        <text
          x={label.x}
          y={label.y - 8}
          textAnchor="middle"
          className="hs-label"
          style={{ fill: `var(${packet.color})` }}
          transform={`rotate(${label.angle} ${label.x} ${label.y})`}
        >
          {packet.label}
        </text>
      )}
    </g>
  )
}

/** The timeline at [t]: both ends' states, the packets so far, and the line time has reached. */
export function HandshakeDrawing({ packets, t, scale, ref }: Props) {
  const timeout = timeoutFrame(packets, t)
  return (
    <svg
      ref={ref}
      className="widget__canvas"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="TCP 연결 수립 타임라인"
      style={{ '--hs-scale': scale } as CSSProperties}
    >
      <Lifeline side="client" state={clientState(packets, t)} scale={scale} />
      <Lifeline side="server" state={serverState(packets, t)} scale={scale} />
      {timeout && (
        <g>
          <line
            x1={timeout.x}
            y1={timeout.y0}
            x2={timeout.x}
            y2={timeout.y1}
            className="hs-muted"
            strokeWidth={2}
            strokeDasharray="3 4"
          />
          {timeout.labelled && (
            <text
              x={timeout.x - 8}
              y={(timeout.y0 + timeout.y1) / 2 + 4}
              textAnchor="end"
              className="hs-note"
            >
              RTO
            </text>
          )}
        </g>
      )}
      {packets.map((packet) => (
        <PacketLine key={`${packet.label}-${packet.start}`} packet={packet} t={t} />
      ))}
      <line
        x1={20}
        y1={yOf(t)}
        x2={VIEW_WIDTH - 20}
        y2={yOf(t)}
        className="hs-muted"
        strokeWidth={1}
        strokeDasharray="2 5"
        opacity={0.6}
      />
    </svg>
  )
}
