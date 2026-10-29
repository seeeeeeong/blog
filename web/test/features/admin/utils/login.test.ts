import { describe, expect, it } from 'vitest'
import { loginErrorMessage } from '@/features/admin/utils/login'

describe('loginErrorMessage', () => {
  it('says why the sign-in came back', () => {
    expect(loginErrorMessage('auth.not_admin')).toBe('관리자 계정으로만 로그인할 수 있습니다')
    expect(loginErrorMessage('auth.login_failed')).toBe(
      'GitHub 로그인에 실패했습니다. 다시 시도해 주세요',
    )
  })

  it('says nothing without a code, or for one it does not know', () => {
    expect(loginErrorMessage(undefined)).toBeUndefined()
    expect(loginErrorMessage('<script>')).toBeUndefined()
  })
})
