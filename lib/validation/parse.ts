import type { z, ZodTypeAny } from "zod"

type ParseSuccess<T> = {
  success: true
  data: T
}

type ParseFailure = {
  success: false
  message: string
  details: string[]
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure

function formatIssues(
  error: z.ZodError,
): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "body"
    return `${path}: ${issue.message}`
  })
}

export async function parseJsonBody<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<ParseResult<z.infer<TSchema>>> {
  const body = (await request.json().catch(() => null)) as unknown

  const result = schema.safeParse(body)
  if (!result.success) {
    const details = formatIssues(result.error)
    return {
      success: false,
      message: "Invalid request payload.",
      details,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

export function parseParams<TSchema extends ZodTypeAny>(
  params: unknown,
  schema: TSchema,
): ParseResult<z.infer<TSchema>> {
  const result = schema.safeParse(params)
  if (!result.success) {
    const details = formatIssues(result.error)
    return {
      success: false,
      message: "Invalid route params.",
      details,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

