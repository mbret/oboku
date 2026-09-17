import { useMutation } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export type EnsureUserDbIndexesResult = {
  ranOnUsers: number
  indexesCreated: number
  indexesExisting: number
}

export const useEnsureUserDbIndexes = () => {
  return useMutation({
    mutationFn: async (): Promise<EnsureUserDbIndexesResult> => {
      const res = await authenticatedFetch(
        `${config.apiUrl}/admin/ensure-user-db-indexes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      if (!res.ok) {
        throw new Error(res.statusText || "Migration failed")
      }
      return res.json()
    },
  })
}
