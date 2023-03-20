import { FieldError } from "react-hook-form"

export const errorToHelperText = (
  error?: FieldError,
  messages?: {
    pattern?: string
  }
) => {
  if (!error?.type) return error?.message

  switch (error.type) {
    case "required":
      return "Required"
    case "pattern":
      return messages?.pattern ?? "Invalid value"
    default:
      return error.message
  }
}
