import { useMutation } from "@tanstack/react-query"
import { authState } from "./states";

export const useMigrate = () => {
  return useMutation({
    mutationFn: async () =>
      {
        await fetch("http://localhost:3000/admin/migrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authState.value.access_token}`
          },
        })
      },
  })
}
