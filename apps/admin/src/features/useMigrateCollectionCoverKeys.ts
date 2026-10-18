import { useMutation } from "@tanstack/react-query"
import type { AdminMigrateCollectionCoverKeysResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export const useMigrateCollectionCoverKeys = () => {
  return useMutation({
    mutationFn: async (): Promise<AdminMigrateCollectionCoverKeysResponse> => {
      const res = await authenticatedFetch(
        `${config.apiUrl}/admin/migrate-collection-cover-keys`,
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
