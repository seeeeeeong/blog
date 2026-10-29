import './admin.css'
import { GITHUB_LOGIN_PATH } from '@/features/admin/api/session'
import { Icon } from '@/features/admin/components/Icon'
import { loginErrorMessage } from '@/features/admin/utils/login'

/** The admin's way in; [error] is the code a failed sign-in came back with. */
export function LoginView({ error }: { error?: string }) {
  const message = loginErrorMessage(error)
  return (
    <main className="apage alogin">
      <header className="ahead">
        <p className="mono ahead__meta">Admin</p>
        <h1>Sign in</h1>
      </header>
      {message && (
        <p className="aerror" role="alert">
          {message}
        </p>
      )}
      {/* A plain link: the api answers it with a redirect to GitHub, not a page. */}
      <a className="pill pill--accent" href={GITHUB_LOGIN_PATH}>
        <Icon name="github" />
        Sign in with GitHub
      </a>
    </main>
  )
}
