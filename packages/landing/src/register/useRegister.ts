import { useMutation } from "react-query"
import { API_URI } from "../constants"

export const useRegister = () =>
  useMutation(({ email }: { email: string }) =>
    fetch(`${API_URI}/requestaccess`, {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json"
      }
    })
  )
