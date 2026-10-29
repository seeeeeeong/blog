'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/app/_components/ThemeToggle'
import { Logo } from '@/components/ui/Logo'
import { messageOf } from '@/features/admin/api/client'
import { LOGIN_PATH, signOut } from '@/features/admin/api/session'

const ADMIN_HOME = '/admin'

async function leave() {
  try {
    await signOut()
    location.assign(LOGIN_PATH)
  } catch (error) {
    alert(messageOf(error))
  }
}

/**
 * The admin's dock, in the reader's dock's look. Its links are plain, so leaving an editor with
 * unsaved changes asks first. Signed out, it has only the logo and the theme.
 */
export function AdminDock({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname()
  return (
    <header className="dock">
      <nav className="dock__bar" aria-label="관리자">
        <a className="dock__logo" href={ADMIN_HOME} aria-label="관리자 홈">
          <Logo />
        </a>
        <span className="dock__tag mono">Admin</span>
        <span className="dock__divider" aria-hidden="true" />
        <div className="dock__links">
          {signedIn && (
            <a
              className="dock__item"
              href={ADMIN_HOME}
              aria-current={pathname === ADMIN_HOME ? 'page' : undefined}
            >
              Posts
            </a>
          )}
          <a className="dock__item" href="/">
            Site
          </a>
          {signedIn && (
            <button className="dock__item" type="button" onClick={() => void leave()}>
              Sign out
            </button>
          )}
        </div>
        <ThemeToggle />
      </nav>
    </header>
  )
}
