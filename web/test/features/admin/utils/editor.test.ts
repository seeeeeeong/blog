import { describe, expect, it } from 'vitest'
import type { AdminPost } from '@/features/admin/api/types'
import {
  draftOf,
  editorMeta,
  editorReducer,
  initialEditor,
  isDirty,
  saveLabel,
  saveRequest,
} from '@/features/admin/utils/editor'

const network = { slug: 'network', title: '네트워크', position: 2 }
const os = { slug: 'os', title: '운영체제', position: 1 }

function post(overrides: Partial<AdminPost> = {}): AdminPost {
  return {
    id: '0199-a',
    version: 3,
    slug: 'tcp-handshake',
    title: 'TCP 3-way handshake',
    status: 'DRAFT',
    topic: network,
    position: 1,
    number: '2.1',
    summary: '',
    bodyMdx: '본문',
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-21T00:00:00Z',
    publishedAt: null,
    ...overrides,
  }
}

describe('the editor state', () => {
  it('is clean as loaded, and dirty once a field differs from what was loaded', () => {
    const loaded = initialEditor(post())

    const edited = editorReducer(loaded, { type: 'edit', patch: { title: 'TCP' } })
    const undone = editorReducer(edited, { type: 'edit', patch: { title: 'TCP 3-way handshake' } })

    expect(isDirty(loaded)).toBe(false)
    expect(isDirty(edited)).toBe(true)
    expect(isDirty(undone)).toBe(false)
  })

  it('sends the fields with the version it loaded', () => {
    const state = editorReducer(initialEditor(post()), { type: 'edit', patch: { summary: '요약' } })

    expect(saveRequest(state)).toEqual({
      version: 3,
      title: 'TCP 3-way handshake',
      slug: 'tcp-handshake',
      topicSlug: 'network',
      position: 1,
      summary: '요약',
      bodyMdx: '본문',
    })
  })

  it('takes the new version from the answer to a save, and is clean again', () => {
    const edited = editorReducer(initialEditor(post()), {
      type: 'edit',
      patch: { summary: '요약' },
    })
    const sent = edited.draft

    const saved = editorReducer(edited, {
      type: 'saved',
      post: post({ version: 4, summary: '요약' }),
      sent,
    })

    expect(saveRequest(saved).version).toBe(4)
    expect(isDirty(saved)).toBe(false)
  })

  it('keeps an edit made while the save was on its way, still dirty', () => {
    const edited = editorReducer(initialEditor(post()), {
      type: 'edit',
      patch: { summary: '요약' },
    })
    const sent = edited.draft
    const typing = editorReducer(edited, { type: 'edit', patch: { bodyMdx: '본문, 더' } })

    const saved = editorReducer(typing, {
      type: 'saved',
      post: post({ version: 4, summary: '요약' }),
      sent,
    })

    expect(saved.draft.bodyMdx).toBe('본문, 더')
    expect(saveRequest(saved).version).toBe(4)
    expect(isDirty(saved)).toBe(true)
  })

  it('follows a publish to the published status', () => {
    const state = initialEditor(post())

    const published = editorReducer(state, {
      type: 'saved',
      post: post({ version: 4, status: 'PUBLISHED', publishedAt: '2026-10-21T01:00:00Z' }),
      sent: draftOf(post()),
    })

    expect(published.post.status).toBe('PUBLISHED')
    expect(editorMeta(published, [network])).toBe('Published OCT 21 / 2.1 network')
  })
})

describe('editorMeta', () => {
  it('numbers the post after the topic and order in the fields', () => {
    const state = editorReducer(initialEditor(post()), {
      type: 'edit',
      patch: { topicSlug: 'os', position: 4 },
    })

    expect(editorMeta(initialEditor(post()), [os, network])).toBe('Draft / 2.1 network')
    expect(editorMeta(state, [os, network])).toBe('Draft / 1.4 os')
  })
})

describe('saveLabel', () => {
  it('says what is being sent, then whether the fields are saved', () => {
    expect(saveLabel(true, 'save', null)).toBe('Saving…')
    expect(saveLabel(true, 'publish', null)).toBe('Publishing…')
    expect(saveLabel(true, null, null)).toBe('Unsaved')
    expect(saveLabel(false, null, null)).toBe('Saved')
    expect(saveLabel(false, null, new Date(2026, 9, 21, 9, 5))).toBe('Saved 09:05')
  })
})
