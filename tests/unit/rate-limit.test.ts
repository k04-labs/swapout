import test from "node:test"
import assert from "node:assert/strict"
import { checkRateLimit, clearRateLimits } from "@/lib/rate-limit"

test("rate limiter blocks after max attempts in a window", () => {
  clearRateLimits()
  const key = "super-admin-login:test-ip"
  const options = { max: 2, windowMs: 60_000 }

  const first = checkRateLimit(key, options)
  const second = checkRateLimit(key, options)
  const third = checkRateLimit(key, options)

  assert.equal(first.allowed, true)
  assert.equal(second.allowed, true)
  assert.equal(third.allowed, false)
  assert.equal(third.remaining, 0)
})

