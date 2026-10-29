import { adminGet, adminWrite } from '@/features/admin/api/client'
import type { Admin } from '@/features/admin/api/types'

export const LOGIN_PATH = '/admin/login'

/** Where the sign-in starts; the api sends the browser on to GitHub. */
export const GITHUB_LOGIN_PATH = '/api/auth/github'

/** The signed-in admin; 401 `common.unauthorized` without a session. */
export function loadAdmin(): Promise<Admin> {
  return adminGet('/api/admin/me')
}

export function signOut(): Promise<void> {
  return adminWrite('POST', '/api/auth/logout')
}
