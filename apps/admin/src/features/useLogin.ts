import { useMutation } from "@tanstack/react-query"
import { authState, persistAccessToken } from "./states"
import { config } from "@/config"

export const useLogin = () => {
  return useMutation({
    mutationFn: async (values: { login: string; password: string }) => {
      const response = await fetch(`${config.apiUrl}/admin/signin`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Invalid login or password"
            : "Unable to sign in",
        )
      }

      const data = await response.json()

      if (!data.access_token) {
        throw new Error("Unable to sign in")
      }

      persistAccessToken(data.access_token)
      authState.update({
        access_token: data.access_token,
      })
    },
  })
}
