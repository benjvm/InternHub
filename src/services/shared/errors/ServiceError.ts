export class ServiceError extends Error {
  code: string
  cause?: unknown

  constructor(message: string, code = 'service_error', cause?: unknown) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.cause = cause
  }
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

export function wrapServiceError(error: unknown, fallbackMessage: string, code = 'service_error') {
  if (error instanceof ServiceError) {
    return error
  }

  return new ServiceError(getErrorMessage(error, fallbackMessage), code, error)
}
