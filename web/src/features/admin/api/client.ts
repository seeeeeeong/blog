export const CSRF_COOKIE = 'XSRF-TOKEN'

export const CSRF_HEADER = 'X-XSRF-TOKEN'

const FALLBACK_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요'

/** The api's `{code, message}`; [message] is Korean and meant to be shown as is. */
export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** What to show for a failed call: the api's own message, or a fallback for anything else. */
export function messageOf(error: unknown): string {
  return error instanceof AdminApiError ? error.message : FALLBACK_MESSAGE
}

export function readCookie(cookies: string, name: string): string | undefined {
  const prefix = `${name}=`
  const found = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
  return found === undefined ? undefined : decodeURIComponent(found.slice(prefix.length))
}

async function errorOf(response: Response): Promise<AdminApiError> {
  try {
    const { code, message } = (await response.json()) as { code?: unknown; message?: unknown }
    if (typeof code === 'string' && typeof message === 'string') {
      return new AdminApiError(response.status, code, message)
    }
  } catch {}
  return new AdminApiError(response.status, 'common.unknown', FALLBACK_MESSAGE)
}

async function send<T>(method: string, path: string, headers: HeadersInit, body?: unknown) {
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
  })
  if (!response.ok) throw await errorOf(response)
  return (response.status === 204 ? undefined : await response.json()) as T
}

// The api checks the header against the cookie, so the cookie is read before every write: it is
// replaced at sign-in.
async function csrfToken(): Promise<string> {
  const token = readCookie(document.cookie, CSRF_COOKIE)
  if (token) return token
  return (await send<{ token: string }>('GET', '/api/auth/csrf', {})).token
}

/** A read from the browser, on its own origin with the admin's session cookie. */
export function adminGet<T>(path: string): Promise<T> {
  return send<T>('GET', path, {})
}

/** A write from the browser, carrying the CSRF token Spring Security asks for. */
export async function adminWrite<T>(method: 'POST' | 'PUT', path: string, body?: unknown) {
  const headers: Record<string, string> = { [CSRF_HEADER]: await csrfToken() }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  return send<T>(method, path, headers, body)
}
