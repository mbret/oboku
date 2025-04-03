import { useMutation } from "@tanstack/react-query"
import { authState } from "./states";
import { config } from "@/config";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (values: { login: string; password: string }) =>
      {
        const response = await fetch(`${config.apiUrl}/admin/signin`, {
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
