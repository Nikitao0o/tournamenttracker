export interface ValidationErrorItem {
  loc?: (string | number)[]
  msg?: string
  type?: string
}

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function parseFastApiDetail(detail: unknown): string {
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: ValidationErrorItem) => {
        if (!item) return ''
        const field =
          Array.isArray(item.loc) && item.loc.length > 1
            ? String(item.loc[item.loc.length - 1])
            : ''
        const msg = item.msg || 'Invalid field'
        return field ? `${field}: ${msg}` : msg
      })
      .filter(Boolean)
    if (messages.length > 0) {
      return messages.join(', ')
    }
  }
  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail)
    } catch {
      return 'An error occurred'
    }
  }
  return 'An error occurred'
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred'

  if (error instanceof ApiError) {
    if (error.status === 401) return 'Session expired. Please sign in again.'
    if (error.status === 403) return 'Access denied. Administrator privileges required.'
    if (error.status === 404) return error.message || 'Resource not found.'
    if (error.status === 409) return error.message || 'Resource already exists.'
    if (error.status === 422) return error.message || 'Validation error. Please check your input.'
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>
    if (errObj.detail) {
      return parseFastApiDetail(errObj.detail)
    }
    if (typeof errObj.message === 'string') {
      return errObj.message
    }
  }

  return 'An unexpected error occurred'
}
