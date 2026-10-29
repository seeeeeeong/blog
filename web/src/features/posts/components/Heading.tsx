import type { ComponentProps } from 'react'

type Props = ComponentProps<'h2'>

function anchored(Tag: 'h2' | 'h3') {
  return function Heading({ id, children }: Props) {
    return (
      <Tag id={id} className="anchor">
        {children}
        {id && (
          <a href={`#${id}`} aria-label="이 섹션 링크">
            #
          </a>
        )}
      </Tag>
    )
  }
}

/** A section heading with a `#` that links to it, shown on hover. */
export const H2 = anchored('h2')

export const H3 = anchored('h3')
