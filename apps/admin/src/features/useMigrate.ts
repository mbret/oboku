import { useMutation } from "@tanstack/react-query"
import { authState } from "./states"
import { config } from "@/config"

export const useMigrate = () => {
  return useMutation({
    mutationFn: async () => {
      await fetch(`${config.apiUrl}/admin/migrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.value.access_token}`,
        },
      })
    },
  })
}
