import test from "node:test"
import assert from "node:assert/strict"
import { getSubAdminRedirect } from "@/lib/sub-admin-auth"

test("sub-admin approval status routes to correct screens", () => {
  assert.equal(getSubAdminRedirect("PENDING"), "/sub-admin/pending")
  assert.equal(getSubAdminRedirect("APPROVED"), "/sub-admin/dashboard")
  assert.equal(getSubAdminRedirect("REJECTED"), "/sub-admin/rejected")
})

