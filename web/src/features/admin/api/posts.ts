import { adminGet, adminWrite } from '@/features/admin/api/client'
import { adminStream, type StreamEvent } from '@/features/admin/api/stream'
import type {
  AdminPost,
  AdminPostSummary,
  PostCreateRequest,
  PostDraft,
  PostSaveRequest,
  Topic,
} from '@/features/admin/api/types'

const POSTS = '/api/admin/posts'

const postPath = (id: string) => `${POSTS}/${encodeURIComponent(id)}`

export function listPosts(): Promise<AdminPostSummary[]> {
  return adminGet(POSTS)
}

export function listTopics(): Promise<Topic[]> {
  return adminGet('/api/topics')
}

export function getPost(id: string): Promise<AdminPost> {
  return adminGet(postPath(id))
}

export function createPost(request: PostCreateRequest): Promise<AdminPost> {
  return adminWrite('POST', POSTS, request)
}

/** Saves a draft in place; a published post answers `post.published_locked`. */
export function savePost(id: string, request: PostSaveRequest): Promise<AdminPost> {
  return adminWrite('PUT', postPath(id), request)
}

/** Publishes, or republishes, and keeps a revision of what readers will see. */
export function publishPost(id: string, request: PostSaveRequest): Promise<AdminPost> {
  return adminWrite('POST', `${postPath(id)}/publish`, request)
}

/** A draft's body from [memo], streamed as the model writes it; the api saves nothing. */
export function draftFromMemo(
  id: string,
  memo: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent<PostDraft>> {
  return adminStream(`${postPath(id)}/draft`, { memo }, signal)
}
