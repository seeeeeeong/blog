import { API_URL } from '@/lib/api-url'

// A hung api fails the read, not the page waiting on it.
const TIMEOUT_MS = 3000

/** The api answered, but not with success; [status] tells a missing post from a failure. */
export class ApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`GET ${path} answered ${status}`)
  }
}

/** A read from the server, straight to the api; [headers] can carry the browser's cookie on. */
export async function apiGet<T>(path: string, headers?: HeadersInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new ApiError(path, response.status)
  return (await response.json()) as T
}
