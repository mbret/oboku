/** Whether a value has fields to read, as a parsed JSON object or an error does. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null
