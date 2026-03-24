import test from "node:test"
import assert from "node:assert/strict"
import { assessmentSubmitSchema, employeeCreateSchema, superAdminLoginSchema } from "@/lib/validation/schemas"

test("super admin login schema enforces username and password", () => {
  const valid = superAdminLoginSchema.safeParse({
    username: "superadmin",
    password: "secure-password",
  })
  const invalid = superAdminLoginSchema.safeParse({
    username: "",
    password: "",
  })

  assert.equal(valid.success, true)
  assert.equal(invalid.success, false)
})

test("employee create schema rejects missing required fields", () => {
  const invalid = employeeCreateSchema.safeParse({
    fullName: "John",
    department: "",
    jobRole: "Operator",
    phoneNumber: "9999999999",
    site: "Plant A",
  })

  assert.equal(invalid.success, false)
})

test("assessment submit schema validates responses payload", () => {
  const valid = assessmentSubmitSchema.safeParse({
    responses: [{ questionId: "q1", optionId: "o1" }],
  })
  const invalid = assessmentSubmitSchema.safeParse({
    responses: [],
  })

  assert.equal(valid.success, true)
  assert.equal(invalid.success, false)
})

