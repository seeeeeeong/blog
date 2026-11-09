import '@/features/widgets/iso/iso.css'
import '@/features/widgets/components/widget.css'
import '@/features/widgets/components/safepoint.css'
import { SafepointLive } from '@/features/widgets/components/SafepointLive'
import type { LegendKey } from '@/features/widgets/iso/iso-kit'
import { Dots, Line, Plate, Solid } from '@/features/widgets/iso/react/draw'
import {
  captionOf,
  PART_TITLES,
  type Part,
  partOf,
  readoutOf,
  restState,
} from '@/features/widgets/utils/safepoint'
import {
  BASE_ART,
  DIAL_ART,
  FLAG_ART,
  LANES,
  MAST_ART,
} from '@/features/widgets/utils/safepointGeometry'

const BASE = (
  <g key="base">
    <path className="iso-halo" d={BASE_ART.halo} />
    {BASE_ART.feet.map(({ flange, foot }) => (
      <g key={flange.outline}>
        <Solid paths={flange} tone="lo" />
        <Solid paths={foot} tone="mid" />
      </g>
    ))}
    <Solid paths={BASE_ART.slab} tone="mid" />
    <Line d={BASE_ART.groove} tone="lo" />
    <Line d={BASE_ART.screwRings} tone="lo" />
    <Dots points={BASE_ART.screws} size={0.5} />
    <Solid paths={BASE_ART.label} tone="lo" crease="none" />
    <Line d={BASE_ART.labelLine} tone="faint" />
    <Line d={BASE_ART.labelRule} tone="lo" free />
    <Dots points={BASE_ART.labelScrews} size={0.45} />
  </g>
)

type Stop = (typeof LANES)[number]['back']

const stopArt = (stop: Stop, key: string) => (
  <g key={key}>
    <Solid paths={stop.body} tone="mid" />
    <Line d={stop.line} tone="faint" />
    <Dots points={stop.screws} size={0.45} />
  </g>
)

const LANE_ART = LANES.map((lane) => ({
  id: lane.id,
  tier: (
    <g key={`${lane.id}-tier`}>
      <Solid paths={lane.tier.body} tone="mid" />
      <Line d={lane.tier.minor} tone="lo" />
      <Line d={lane.tier.major} tone="mid" />
      <Line d={lane.tier.zero} tone="hi" />
      <Dots points={lane.tier.screws} size={0.45} />
    </g>
  ),
  posts: (
    <g key={`${lane.id}-posts`}>
      {lane.posts.map((post) => (
        <g key={post.pad.outline}>
          <Solid paths={post.pad} tone="lo" />
          <Solid paths={post.column} tone="mid" crease="none" />
        </g>
      ))}
    </g>
  ),
  tags: lane.posts.map((post) => ({
    key: post.tag.outline,
    node: (
      <g key={post.tag.outline}>
        <Solid paths={post.tag} tone="mid" />
        <Dots points={[post.rivet]} size={0.4} />
      </g>
    ),
  })),
  back: stopArt(lane.back, `${lane.id}-back`),
  rail: (
    <g key={`${lane.id}-rail`}>
      <Solid paths={lane.rail.body} tone="mid" />
      <Line d={lane.rail.groove} tone="faint" />
    </g>
  ),
  car: (
    <g key={`${lane.id}-car`}>
      <Solid paths={lane.car.gib} tone="mid" crease="none" />
      <Solid paths={lane.car.body} tone="hi" />
      <Line d={lane.car.line} tone="lo" />
      <Dots points={lane.car.screws} size={0.45} />
      <Solid paths={lane.car.knob} tone="hi" />
      <Line d={lane.car.knobFace} tone="lo" />
    </g>
  ),
  front: stopArt(lane.front, `${lane.id}-front`),
  lamp: (
    <g key={`${lane.id}-lamp`}>
      <Solid paths={lane.lamp.body} tone="mid" />
      <Solid paths={lane.lamp.lens} tone="mid" />
    </g>
  ),
}))

const MAST = (
  <g key="mast">
    <Solid paths={MAST_ART.pad} tone="lo" />
    <Dots points={MAST_ART.padScrews} size={0.45} />
    <Solid paths={MAST_ART.column} tone="mid" crease="none" />
    <Solid paths={MAST_ART.collar} tone="mid" />
    <Solid paths={MAST_ART.guide} tone="mid" crease="none" />
    <Dots points={MAST_ART.guideCaps} size={0.4} />
  </g>
)

const FLAG = (
  <g key="flag">
    <Solid paths={FLAG_ART.carrier} tone="mid" />
    <Dots points={FLAG_ART.rivets} size={0.4} />
    <Solid paths={FLAG_ART.flag} tone="hi" />
    <Line d={FLAG_ART.stripe} tone="lo" />
  </g>
)

const HEAD = (
  <g key="head">
    <Solid paths={MAST_ART.head} tone="mid" inner={<Line d={MAST_ART.band} tone="faint" />} />
  </g>
)

const LENS = (
  <g key="lens">
    <Solid paths={MAST_ART.lens} tone="mid" />
  </g>
)

const DIAL = (
  <g key="dial">
    <Solid paths={DIAL_ART.stand} tone="lo" />
    <Dots points={DIAL_ART.standScrews} size={0.45} />
    <Solid paths={DIAL_ART.crown} tone="mid" />
    <Solid paths={DIAL_ART.crownCap} tone="mid" />
    <Solid paths={DIAL_ART.puck} tone="mid" inner={<Line d={DIAL_ART.band} tone="faint" />} />
    <Line d={DIAL_ART.knurl} tone="faint" />
    <Line d={DIAL_ART.bezel} tone="lo" />
    <Line d={DIAL_ART.face} tone="faint" />
    <Line d={DIAL_ART.minor} tone="lo" />
    <Line d={DIAL_ART.major} tone="mid" />
    <Line d={DIAL_ART.zero} tone="hi" />
    <Line d={DIAL_ART.hub} tone="mid" />
  </g>
)

const FIGS: Record<Part, string> = {
  why: 'Fig 1',
  poll: 'Fig 2',
  ttsp: 'Fig 3',
  handshake: 'Fig 4',
}

const HINTS: Record<Part, string> = {
  why: '멈춰 버튼',
  poll: '멈춰 버튼',
  ttsp: '요청 · VM 작업 슬라이더',
  handshake: '스레드 고르기',
}

const TICK_KEY: LegendKey = { mark: 'edge', label: '앞 눈금 한 칸이 1틱' }

const KEYS: Record<Part, LegendKey[]> = {
  why: [
    { mark: 'lit', label: '불이 켜진 표가 지도(OopMap)' },
    { mark: 'raised', label: '대차가 스레드, 레일 뒤 기둥이 검사 지점' },
    TICK_KEY,
  ],
  poll: [
    { mark: 'lit', label: '검사 지점에 멈춘 스레드' },
    { mark: 'raised', label: '기둥 간격이 검사 간격' },
    TICK_KEY,
  ],
  ttsp: [
    { mark: 'lit', label: '바늘이 멈춘 시간, 짧은 바늘이 TTSP' },
    { mark: 'raised', label: '깃발이 오르면 전역 요청' },
    TICK_KEY,
  ],
  handshake: [
    { mark: 'lit', label: '램프가 켜진 스레드에만 요청' },
    { mark: 'raised', label: '깃발은 전역 요청 때만 오름' },
    TICK_KEY,
  ],
}

const MACHINE =
  'JVM 세이프포인트를 레일 네 줄짜리 시험대로 그린 그림입니다. 레일 하나가 자바 스레드 하나이고, 그 위 대차가 코드를 실행하며 달리다 끝에서 처음으로 돌아갑니다. 레일 뒤 기둥이 메서드 반환과 루프 끝의 검사 지점입니다.'

const LABELS: Record<Part, string> = {
  why: `${MACHINE} 2번 레일의 대차만 달리고, 멈춰 요청을 받으면 그 자리에서 서지 않고 다음 기둥까지 달려 기둥의 표에 불이 켜진 채 멈춥니다.`,
  poll: `${MACHINE} 기둥 간격은 레일마다 다르고, 4번 레일은 긴 루프라 기둥이 하나뿐입니다. 요청이 오면 대차마다 다음 기둥에서 서고, 4번 대차가 가장 늦게 섭니다.`,
  ttsp: `${MACHINE} 오른쪽 기둥의 깃발이 오르면 전역 요청이고, 대차가 하나씩 기둥에서 섭니다. 앞의 스톱워치는 짧은 바늘로 마지막 대차가 설 때까지의 시간(TTSP)을, 긴 바늘로 VM 작업까지 합친 정지 시간을 가리킵니다.`,
  handshake: `${MACHINE} 고른 레일의 램프만 켜지고 그 대차만 다음 기둥에서 서서 작업을 받은 뒤 다시 달립니다. 다른 대차는 멈추지 않고, 오른쪽 기둥의 깃발도 오르지 않습니다.`,
}

/**
 * `<SafepointFigure part="why" />`: four rails, one per Java thread, whose carriages stop only at
 * their poll posts; `part` is `why`, `poll`, `ttsp` or `handshake`, the section it opens on.
 */
export function SafepointFigure({ part }: { part?: string }) {
  const chosen = partOf(part)
  return (
    <div className="iso safepoint-figure" data-theme="light" id={`safepoint-${chosen}`}>
      <Plate
        fig={FIGS[chosen]}
        title={PART_TITLES[chosen]}
        hint={HINTS[chosen]}
        readout={readoutOf(restState(chosen))}
        keys={KEYS[chosen]}
        caption={captionOf(chosen)}
      >
        <SafepointLive
          part={chosen}
          label={LABELS[chosen]}
          base={BASE}
          lanes={LANE_ART}
          mast={MAST}
          flag={FLAG}
          head={HEAD}
          lens={LENS}
          dial={DIAL}
        />
      </Plate>
    </div>
  )
}
