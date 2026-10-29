import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CmdPalette } from '@/features/cmd/views/CmdPalette'

describe('CmdPalette', () => {
  it('renders nothing on the server, where it is always closed', () => {
    expect(renderToStaticMarkup(<CmdPalette posts={[]} latestHref="/posts/tcp-handshake" />)).toBe(
      '',
    )
  })
})
