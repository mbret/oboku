import { useMutation } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export const useMigrate = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/migrate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(response.statusText || "Migration failed")
      }
    },
  })
}
