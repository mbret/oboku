import { useMutation } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export type WebdavResourceIdMigrationResult = {
  usersMigrated: number
  linksUpdated: number
  collectionsUpdated: number
}

export const useMigrateWebdavResourceIds = () => {
  return useMutation({
    mutationFn: async (): Promise<WebdavResourceIdMigrationResult> => {
      const res = await authenticatedFetch(
        `${config.apiUrl}/admin/migrate-webdav-resource-ids`,
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
