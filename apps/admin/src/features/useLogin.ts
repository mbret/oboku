import { useMutation } from "@tanstack/react-query"
import { authState } from "./states";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (values: { login: string; password: string }) =>
      {
        const response = await fetch("http://localhost:3000/admin/signin", {
          method: "POST",
          body: JSON.stringify(values),
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        authState.update({
          access_token: data.access_token,
        })
      },
  })
}
