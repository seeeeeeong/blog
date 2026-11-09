import '@/features/widgets/iso/iso.css'
import '@/features/widgets/components/widget.css'
import '@/features/widgets/components/hashTable.css'
import { Fragment } from 'react'
import { HashTableLive } from '@/features/widgets/components/HashTableLive'
import type { LegendKey } from '@/features/widgets/iso/iso-kit'
import { Dots, Line, Plate, Solid } from '@/features/widgets/iso/react/draw'
import {
  captionOf,
  PART_TITLES,
  type Part,
  partOf,
  REST_COUNT,
  readoutOf,
  SLOTS,
  stateOf,
} from '@/features/widgets/utils/hashTable'
import {
  ARM_ART,
  BASE_ART,
  BED_ART,
  boreClipOf,
  CARRIAGE_ART,
  DIAL_ART,
  FEEDER_ART,
  GANTRY_ART,
  PUCK_ART,
  RULER_ART,
  SEATS,
} from '@/features/widgets/utils/hashTableGeometry'

const RISEN = SLOTS / 2
const BUCKETS = Array.from({ length: SLOTS }, (_, bucket) => bucket)
const LOWER = BUCKETS.filter((bucket) => bucket < RISEN)
const UPPER = BUCKETS.filter((bucket) => bucket >= RISEN)

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

const GANTRY = (
  <g key="gantry">
    {GANTRY_ART.feet.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="lo" />
    ))}
    <Dots points={GANTRY_ART.footScrews} size={0.45} />
    {GANTRY_ART.posts.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="mid" />
    ))}
    <Line d={GANTRY_ART.postSeams} tone="faint" />
    <Solid paths={GANTRY_ART.rail} tone="mid" />
    <Line d={GANTRY_ART.railLine} tone="faint" />
    <Dots points={GANTRY_ART.railScrews} size={0.5} />
    {GANTRY_ART.stops.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="mid" />
    ))}
  </g>
)

const CARRIAGE = (
  <g key="carriage">
    <Solid paths={CARRIAGE_ART.block} tone="mid" />
    <Line d={CARRIAGE_ART.line} tone="faint" />
    <Dots points={CARRIAGE_ART.screws} size={0.45} />
    <Solid paths={CARRIAGE_ART.knob} tone="mid" />
    <Line d={CARRIAGE_ART.knurl} tone="lo" />
    <Line d={CARRIAGE_ART.knobFace} tone="faint" />
  </g>
)

const FEEDER = (
  <g key="feeder">
    <Solid paths={FEEDER_ART.pad} tone="lo" />
    <Dots points={FEEDER_ART.padScrews} size={0.45} />
    <Solid paths={FEEDER_ART.block} tone="mid" />
    <Solid paths={FEEDER_ART.guide} tone="mid" crease="none" />
    <Dots points={[FEEDER_ART.guideCap]} size={0.45} />
    <Solid paths={FEEDER_ART.seat} tone="mid" />
    <Line d={FEEDER_ART.face} tone="faint" />
    <Solid paths={FEEDER_ART.pin} tone="mid" crease="none" />
  </g>
)

const BED = (
  <g key="bed">
    <Solid paths={BED_ART.slab} tone="mid" />
    <Line d={BED_ART.seam} tone="faint" />
    <Dots points={BED_ART.screws} size={0.5} />
    <Line d={BED_ART.bores} tone="lo" />
    <Solid paths={BED_ART.comb} tone="mid" />
    {BED_ART.guides.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="mid" crease="none" />
    ))}
    <Dots points={BED_ART.guideCaps} size={0.45} />
  </g>
)

function seatArt(bucket: number) {
  const seat = SEATS[bucket]
  if (!seat) return null
  return (
    <Fragment key={`seat-${bucket}`}>
      <Solid paths={seat.body} tone="mid" inner={<Line d={seat.seam} tone="faint" />} />
      <Line d={seat.face} tone="faint" />
      <Solid paths={seat.pin} tone="mid" crease="none" />
    </Fragment>
  )
}

const FIXED_SEATS = <g key="seats">{LOWER.map(seatArt)}</g>

const RISERS = UPPER.map((bucket) => <g key={`riser-${bucket}`}>{seatArt(bucket)}</g>)

const CLIPS = UPPER.map(boreClipOf)

const RULER = (
  <g key="ruler">
    <Solid paths={RULER_ART.strip} tone="lo" crease="none" />
    <Line d={RULER_ART.minor} tone="lo" />
    <Line d={RULER_ART.major} tone="mid" />
    <Line d={RULER_ART.zero} tone="hi" />
    <Dots points={RULER_ART.screws} size={0.45} />
  </g>
)

const PUCK = (
  <g key="puck">
    <Solid paths={PUCK_ART.body} tone="hi" inner={<Line d={PUCK_ART.seam} tone="lo" />} />
    <Line d={PUCK_ART.groove} tone="lo" />
    <Line d={PUCK_ART.hole} tone="mid" />
  </g>
)

const ARM = (
  <g key="arm">
    <Solid paths={ARM_ART.pad} tone="mid" />
    <Solid paths={ARM_ART.quill} tone="mid" crease="none" />
    <Solid paths={ARM_ART.collar} tone="mid" />
    <Solid paths={ARM_ART.arm} tone="mid" />
    <Line d={ARM_ART.line} tone="faint" />
    <Dots points={ARM_ART.screws} size={0.45} />
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
    <Dots points={DIAL_ART.limit} size={0.6} tone="hi" />
    <Line d={DIAL_ART.hub} tone="mid" />
  </g>
)

const FIGS: Record<Part, string> = { chaining: 'Fig 1', probing: 'Fig 2', load: 'Fig 3' }

const KEYS: Record<Part, LegendKey[]> = {
  chaining: [
    { mark: 'lit', label: '방금 넣은 키' },
    { mark: 'raised', label: '한 칸에 쌓인 원반이 체인' },
    { mark: 'edge', label: '앞 눈금이 칸, 진한 눈금이 0번' },
  ],
  probing: [
    { mark: 'lit', label: '방금 넣은 키' },
    { mark: 'raised', label: '한 칸에 원반 하나' },
    { mark: 'edge', label: '앞 눈금이 칸, 진한 눈금이 0번' },
  ],
  load: [
    { mark: 'lit', label: '바늘이 적재율, 점이 0.75' },
    { mark: 'raised', label: '올라온 받침만 쓰는 칸' },
    { mark: 'edge', label: '앞 눈금이 칸, 진한 눈금이 0번' },
  ],
}

const LABELS: Record<Part, string> = {
  chaining:
    '해시 테이블을 원반 정리대로 그린 그림입니다. 왼쪽 공급대의 원반 하나가 키 하나이고, 레일 위 헤드가 원반을 집어 해시로 구한 칸의 받침 위에 내려놓습니다. 같은 칸에 온 원반은 위로 쌓여 체인이 되고, 오른쪽 다이얼은 적재율을 가리킵니다.',
  probing:
    '해시 테이블을 원반 정리대로 그린 그림입니다. 칸마다 원반을 하나만 둘 수 있어, 헤드는 해시로 구한 칸이 차 있으면 오른쪽 칸으로 한 칸씩 옮겨 가며 빈 칸을 찾습니다. 오른쪽 다이얼은 적재율을 가리킵니다.',
  load: '해시 테이블을 원반 정리대로 그린 그림입니다. 처음에는 받침 네 개만 올라와 있고, 적재율이 0.75를 넘으면 나머지 받침 네 개가 올라오며 칸이 여덟 개가 됩니다. 헤드는 칸이 바뀐 원반만 새 칸으로 옮기고, 오른쪽 다이얼 바늘이 적재율을 가리킵니다.',
}

/**
 * `<HashTableFigure part="chaining" />`: a rack of eight seats where a head drops each key's puck
 * on the seat its hash picks; `part` is `chaining`, `probing` or `load`, the section it opens on.
 */
export function HashTableFigure({ part }: { part?: string }) {
  const chosen = partOf(part)
  return (
    <div className="iso hash-figure" data-theme="light" id={`hash-table-${chosen}`}>
      <Plate
        fig={FIGS[chosen]}
        title={PART_TITLES[chosen]}
        hint="키 넣기 · 슬라이더"
        readout={readoutOf(stateOf(chosen, REST_COUNT[chosen]))}
        keys={KEYS[chosen]}
        caption={captionOf(chosen)}
      >
        <HashTableLive
          part={chosen}
          label={LABELS[chosen]}
          base={BASE}
          gantry={GANTRY}
          carriage={CARRIAGE}
          feeder={FEEDER}
          bed={BED}
          seats={FIXED_SEATS}
          risers={RISERS}
          clips={CLIPS}
          ruler={RULER}
          puck={PUCK}
          arm={ARM}
          dial={DIAL}
        />
      </Plate>
    </div>
  )
}
