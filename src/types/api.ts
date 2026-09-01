export interface Meta {
  query: string
  rows: number
  ms: number
  generated_at: string
  // present on summary_cache-backed endpoints (coverage/gaps, health/overview, departments)
  computed_at?: string
  freshness_str?: string
}

export interface Envelope<T> {
  data: T
  meta: Meta
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    detail?: string
    retryable?: boolean
  }
}

export class ApiError extends Error {
  code?: string
  detail?: string
  retryable?: boolean
  status: number

  constructor(
    message: string,
    opts: { code?: string; detail?: string; retryable?: boolean; status: number },
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = opts.code
    this.detail = opts.detail
    this.retryable = opts.retryable
    this.status = opts.status
  }
}
