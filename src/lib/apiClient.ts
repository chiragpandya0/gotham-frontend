import { API_BASE_URL } from '../config/env'
import { metaBus } from './metaBus'
import { authStore } from '../state/authStore'
import { ApiError, type ApiErrorBody, type Envelope } from '../types/api'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Skip the global 401 -> sign-out handling (used by /api/me itself and /api/auth/login). */
  skipAuthRedirect?: boolean
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRedirect, headers, ...rest } = opts

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) {
    return undefined as T
  }

  let parsed: unknown
  try {
    parsed = await res.json()
  } catch {
    parsed = null
  }

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect) {
      authStore.signOut()
    }
    const errBody = parsed as Partial<ApiErrorBody> | null
    throw new ApiError(errBody?.error?.message ?? res.statusText, {
      code: errBody?.error?.code,
      detail: errBody?.error?.detail,
      retryable: errBody?.error?.retryable,
      status: res.status,
    })
  }

  const envelope = parsed as Envelope<T>
  if (envelope && typeof envelope === 'object' && 'meta' in envelope) {
    metaBus.emit(envelope.meta)
  }
  return (envelope as Envelope<T>).data
}

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: body ?? {} }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body: body ?? {} }),
}
