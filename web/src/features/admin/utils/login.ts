// The api sends only the code to the sign-in page; these are its messages for them.
const MESSAGES: Record<string, string> = {
  'auth.not_admin': '관리자 계정으로만 로그인할 수 있습니다',
  'auth.login_failed': 'GitHub 로그인에 실패했습니다. 다시 시도해 주세요',
}

/** The message for a `?error=` code the sign-in came back with; nothing for any other value. */
export function loginErrorMessage(code: string | undefined): string | undefined {
  return code === undefined ? undefined : MESSAGES[code]
}
