type RateLimitRecord = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  max: number
  windowMs: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

const buckets = new Map<string, RateLimitRecord>()

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs
    buckets.set(key, {
      count: 1,
      resetAt,
    })

    return {
      allowed: true,
      remaining: Math.max(options.max - 1, 0),
      retryAfterSec: Math.ceil(options.windowMs / 1000),
    }
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
    }
  }

  existing.count += 1
  buckets.set(key, existing)

  return {
    allowed: true,
    remaining: Math.max(options.max - existing.count, 0),
    retryAfterSec: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
  }
}

export function getClientIdentifier(request: Request): string {
  const headers = request.headers

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = headers.get("x-real-ip")?.trim()

  return forwarded || realIp || "unknown"
}

export function clearRateLimits(): void {
  buckets.clear()
}
