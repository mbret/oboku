import { useMutation } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export type ResourceIdToLinkDataMigrationResult = {
  usersMigrated: number
  linksUpdated: number
  collectionsUpdated: number
}

export const useMigrateResourceIdToLinkData = () => {
  return useMutation({
    mutationFn: async (): Promise<ResourceIdToLinkDataMigrationResult> => {
      const res = await authenticatedFetch(
        `${config.apiUrl}/admin/migrate-resource-id-to-link-data`,
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
