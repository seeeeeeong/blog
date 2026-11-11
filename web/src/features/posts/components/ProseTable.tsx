import type { ComponentProps } from 'react'

/** A table in a post, scrolling sideways on its own when it is wider than the column. */
export function ProseTable(props: ComponentProps<'table'>) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  )
}
