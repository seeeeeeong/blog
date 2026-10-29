'use client'

import { type ReactNode, useEffect } from 'react'
import { AdminApiError } from '@/features/admin/api/client'
import { LOGIN_PATH, loadAdmin } from '@/features/admin/api/session'
import { useLoad } from '@/features/admin/hooks/useLoad'

/** Shows the admin's pages only to a signed-in admin; without a session, on to the sign-in. */
export function AdminGate({ children }: { children: ReactNode }) {
  const admin = useLoad(loadAdmin)
  const signedOut =
    admin.state === 'failed' && admin.error instanceof AdminApiError && admin.error.status === 401

  useEffect(() => {
    if (signedOut) location.replace(LOGIN_PATH)
  }, [signedOut])

  if (admin.state === 'ready') return children
  if (admin.state === 'failed' && !signedOut) {
    return (
      <main className="apage">
        <p className="empty">{admin.message}</p>
      </main>
    )
  }
  return null
}
