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

/** A read from a server component, straight to the api. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new ApiError(path, response.status)
  return (await response.json()) as T
}
