import type { FieldError } from "react-hook-form"

export const errorToHelperText = (
  error?: FieldError,
  messages?: {
    pattern?: string
  },
) => {
  if (!error?.type) return error?.message

  switch (error.type) {
    case "required":
      return "Required"
    case "pattern":
      return messages?.pattern ?? error.message ?? "Invalid value"
    case "minLength":
      return messages?.pattern ?? "Value too short"
    default:
      return error.message || "Invalid value"
  }
}
