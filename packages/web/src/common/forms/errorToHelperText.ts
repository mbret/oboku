import { FieldError } from "react-hook-form"

export const errorToHelperText = (error?: FieldError) => {
  if (!error?.type) return error?.message

  switch (error.type) {
    case "required":
      return "Required"
    default:
      return error.message
  }
}
