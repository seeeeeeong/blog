import { API_URL } from '@/lib/api-url'

// A hung api fails the read, not the page waiting on it.
const TIMEOUT_MS = 3000

/** A read from a server component, straight to the api. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`)
  return (await response.json()) as T
}
