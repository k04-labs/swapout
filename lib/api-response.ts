import { NextResponse } from "next/server"
import { auditLog } from "@/lib/audit"

type ApiErrorOptions = {
  code?: string
  details?: unknown
  request?: Request
}

export function apiError(status: number, message: string, options: ApiErrorOptions = {}) {
  if (status >= 500) {
    auditLog({
      level: "error",
      event: options.code ?? "api_error",
      metadata: {
        message,
        ...(options.request
          ? {
              path: new URL(options.request.url).pathname,
              method: options.request.method,
            }
          : {}),
        details: options.details ?? null,
      },
    })
  }

  return NextResponse.json(
    {
      message,
      error: {
        code: options.code ?? "request_error",
        status,
        details: options.details ?? null,
      },
    },
    { status },
  )
}

export function apiValidationError(message: string, details?: unknown) {
  return apiError(400, message, {
    code: "validation_error",
    details,
  })
}

export function handleApiError(
  error: unknown,
  fallbackMessage: string,
  request?: Request,
) {
  if (error instanceof Error && "status" in error) {
    const status = Number((error as { status: number }).status)
    return apiError(status, error.message, {
      code: "http_error",
      request,
    })
  }

  if (error instanceof Error) {
    return apiError(500, fallbackMessage, {
      code: "unhandled_error",
      request,
      details: {
        reason: error.message,
      },
    })
  }

  return apiError(500, fallbackMessage, {
    code: "unknown_error",
    request,
  })
}
