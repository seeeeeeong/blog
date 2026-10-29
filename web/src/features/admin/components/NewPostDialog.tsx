'use client'

import { type FormEvent, useState } from 'react'
import { messageOf } from '@/features/admin/api/client'
import { createPost } from '@/features/admin/api/posts'
import type { Topic } from '@/features/admin/api/types'
import { Modal } from '@/features/admin/components/Modal'
import { postEditHref } from '@/features/admin/utils/list'

type Props = {
  open: boolean
  topics: readonly Topic[]
  onClose: () => void
}

/** A new draft from its title and topic; the api makes the slug when none is given. */
export function NewPostDialog({ open, topics, onClose }: Props) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (form: HTMLFormElement) => {
    const fields = new FormData(form)
    const slug = String(fields.get('slug') ?? '').trim()
    setCreating(true)
    setError(null)
    try {
      const post = await createPost({
        title: String(fields.get('title') ?? '').trim(),
        topicSlug: String(fields.get('topic') ?? ''),
        ...(slug && { slug }),
      })
      location.assign(postEditHref(post.id))
    } catch (failure) {
      setError(messageOf(failure))
      setCreating(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void create(event.currentTarget)
  }

  return (
    <Modal open={open} eyebrow="New post" title="새 글" onClose={onClose}>
      <form className="aform" onSubmit={submit}>
        <label className="afield">
          <span className="mono">Title</span>
          <input className="ainput" name="title" required maxLength={200} autoComplete="off" />
        </label>
        <label className="afield">
          <span className="mono">Topic</span>
          <select className="ainput" name="topic" required>
            {topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topic.title}
              </option>
            ))}
          </select>
        </label>
        <label className="afield">
          <span className="mono">Slug</span>
          <input
            className="ainput mono"
            name="slug"
            spellCheck={false}
            autoComplete="off"
            placeholder="optional"
          />
        </label>
        {error && (
          <p className="aerror" role="alert">
            {error}
          </p>
        )}
        <div className="modal__foot">
          <button className="pill" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="pill pill--accent" type="submit" disabled={creating}>
            Create
          </button>
        </div>
      </form>
    </Modal>
  )
}
