import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LoginView } from '@/features/admin/views/LoginView'

describe('LoginView', () => {
  it('signs in through GitHub on the api', () => {
    const out = renderToStaticMarkup(<LoginView />)

    expect(out).toContain('<h1>Sign in</h1>')
    expect(out).toMatch(
      /<a class="pill pill--accent" href="\/api\/auth\/github">.*Sign in with GitHub<\/a>/,
    )
    expect(out).not.toContain('role="alert"')
  })

  it('says why a sign-in came back', () => {
    const out = renderToStaticMarkup(<LoginView error="auth.not_admin" />)

    expect(out).toContain(
      '<p class="aerror" role="alert">관리자 계정으로만 로그인할 수 있습니다</p>',
    )
  })

  it('shows nothing for a code it does not know', () => {
    const out = renderToStaticMarkup(<LoginView error="anything" />)

    expect(out).not.toContain('role="alert"')
  })
})
