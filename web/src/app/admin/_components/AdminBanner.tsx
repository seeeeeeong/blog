'use client'

import { usePathname } from 'next/navigation'
import { messageOf } from '@/features/admin/api/client'
import { LOGIN_PATH, signOut } from '@/features/admin/api/session'

const ADMIN_HOME = '/admin'

const current = (on: boolean) => (on ? 'page' : undefined)

async function leave() {
  try {
    await signOut()
    location.assign(LOGIN_PATH)
  } catch (error) {
    alert(messageOf(error))
  }
}

/**
 * The admin's band, in the reader's banner's look. Its links are plain, so leaving an editor with
 * unsaved changes asks first. Signed out, it links only the site.
 */
export function AdminBanner({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname()
  return (
    <header className="banner">
      <div className="banner__wrapper">
        <div className="banner__title">
          <a href={ADMIN_HOME}>Admin</a>
        </div>
        <nav className="banner__nav" aria-label="관리자">
          {signedIn && (
            <a href={ADMIN_HOME} aria-current={current(pathname === ADMIN_HOME)}>
              Posts
            </a>
          )}
          <a href="/">Site</a>
          {signedIn && (
            <button type="button" onClick={() => void leave()}>
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
