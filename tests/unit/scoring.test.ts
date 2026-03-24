import test from "node:test"
import assert from "node:assert/strict"
import { computeRemark, computeTrend, roundToTwo } from "@/lib/scoring"

test("computeRemark maps score bands correctly", () => {
  assert.deepEqual(computeRemark(0.5).remarkScore, 1)
  assert.deepEqual(computeRemark(1.7).remarkScore, 2)
  assert.deepEqual(computeRemark(2.8).remarkScore, 3)
  assert.deepEqual(computeRemark(3.6).remarkScore, 4)
  assert.deepEqual(computeRemark(4.7).remarkScore, 5)
})

test("computeTrend identifies improving and declining changes", () => {
  assert.equal(computeTrend([2.0, 2.4, 2.6, 3.8, 4.0, 4.2]), "improving")
  assert.equal(computeTrend([4.4, 4.1, 3.9, 2.8, 2.7, 2.5]), "declining")
  assert.equal(computeTrend([3.0, 3.1]), "stable")
})

test("roundToTwo rounds to two decimal places", () => {
  assert.equal(roundToTwo(3.456), 3.46)
  assert.equal(roundToTwo(2.341), 2.34)
})

