'use server'

import { headers } from 'next/headers'
import { POST_COMPONENTS } from '@/app/_components/registry'
import { PostBody } from '@/features/posts/components/PostBody'
import { compileMdx } from '@/features/posts/utils/mdx'
import { ApiError, apiGet } from '@/lib/api'

// A server action answers any caller, so the api is asked whether the session is the admin's.
async function isAdmin(): Promise<boolean> {
  const cookie = (await headers()).get('cookie') ?? ''
  try {
    await apiGet('/api/admin/me', { cookie })
    return true
  } catch (error) {
    if (error instanceof ApiError) return false
    throw error
  }
}

/** MDX as readers would see it: the post page's allow list, widgets and renderer. */
export async function previewMdx(source: string) {
  if (!(await isAdmin())) return <p className="empty">로그인이 필요합니다.</p>
  const Content = await compileMdx(source, Object.keys(POST_COMPONENTS))
  return <PostBody Content={Content} components={POST_COMPONENTS} />
}
