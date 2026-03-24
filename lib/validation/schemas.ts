import { z } from "zod"

const trimmedString = z
  .string()
  .trim()
  .min(1, { message: "Field is required." })

export const idParamSchema = z.object({
  id: trimmedString,
})

export const sessionIdParamSchema = z.object({
  sessionId: trimmedString,
})

export const superAdminLoginSchema = z.object({
  username: trimmedString.max(64),
  password: trimmedString.max(256),
})

export const employeeCreateSchema = z.object({
  fullName: trimmedString.max(120),
  department: trimmedString.max(120),
  jobRole: trimmedString.max(120),
  phoneNumber: trimmedString.max(32),
  site: trimmedString.max(120),
})

export const employeeUpdateSchema = z
  .object({
    fullName: trimmedString.max(120).optional(),
    department: trimmedString.max(120).optional(),
    jobRole: trimmedString.max(120).optional(),
    phoneNumber: trimmedString.max(32).optional(),
    site: trimmedString.max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some((entry) => entry !== undefined),
    {
      message: "At least one field must be provided.",
    },
  )

export const assessmentStartSchema = z.object({
  employeeId: trimmedString,
})

export const assessmentSubmitSchema = z.object({
  responses: z
    .array(
      z.object({
        questionId: trimmedString,
        optionId: trimmedString,
      }),
    )
    .min(1, { message: "At least one response is required." }),
})

export const questionOptionSchema = z.object({
  text: trimmedString.max(300),
  score: z.number().min(0).max(5),
  weightLabel: trimmedString.max(80),
})

export const questionCreateSchema = z.object({
  text: trimmedString.max(1000),
  category: z.enum([
    "HAZARD_RECOGNITION",
    "INCIDENT_RESPONSE",
    "COMPLIANCE_AWARENESS",
    "RISK_ASSESSMENT",
    "BEHAVIORAL_ACCOUNTABILITY",
  ]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  isActive: z.boolean().optional(),
  options: z
    .array(questionOptionSchema)
    .min(2, { message: "At least two options are required." }),
})

export const questionUpdateSchema = z
  .object({
    text: trimmedString.max(1000).optional(),
    category: z
      .enum([
        "HAZARD_RECOGNITION",
        "INCIDENT_RESPONSE",
        "COMPLIANCE_AWARENESS",
        "RISK_ASSESSMENT",
        "BEHAVIORAL_ACCOUNTABILITY",
      ])
      .optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    isActive: z.boolean().optional(),
    options: z.array(questionOptionSchema).min(2).optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some((entry) => entry !== undefined),
    {
      message: "At least one field must be provided.",
    },
  )

