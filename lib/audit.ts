export type AuditLevel = "info" | "warn" | "error"

export type AuditPayload = {
  event: string
  level?: AuditLevel
  actorId?: string | null
  actorRole?: string | null
  requestId?: string | null
  metadata?: Record<string, unknown>
}

export function getRequestMetadata(request: Request): Record<string, unknown> {
  const headers = request.headers
  return {
    method: request.method,
    path: new URL(request.url).pathname,
    ip:
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers.get("x-real-ip") ??
      null,
    userAgent: headers.get("user-agent") ?? null,
  }
}

export function auditLog(payload: AuditPayload): void {
  const level = payload.level ?? "info"
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event: payload.event,
    actorId: payload.actorId ?? null,
    actorRole: payload.actorRole ?? null,
    requestId: payload.requestId ?? null,
    metadata: payload.metadata ?? {},
  }

  const serialized = JSON.stringify(entry)

  if (level === "error") {
    console.error(serialized)
    return
  }

  if (level === "warn") {
    console.warn(serialized)
    return
  }

  console.info(serialized)
}
