import { useMutation } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export type CollectionCoverKeysMigrationResult = {
  storageStrategy: "fs" | "s3"
  ranOnUsers: number
  renamed: number
  skippedDestinationExists: number
  skippedSourceMissing: number
}

export const useMigrateCollectionCoverKeys = () => {
  return useMutation({
    mutationFn: async (): Promise<CollectionCoverKeysMigrationResult> => {
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
