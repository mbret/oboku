import { useMutation } from "@tanstack/react-query"
import { authState } from "./states"
import { config } from "@/config"

export type WebdavResourceIdMigrationResult = {
  usersMigrated: number
  linksUpdated: number
  collectionsUpdated: number
}

export const useMigrateWebdavResourceIds = () => {
  return useMutation({
    mutationFn: async (): Promise<WebdavResourceIdMigrationResult> => {
      const res = await fetch(
        `${config.apiUrl}/admin/migrate-webdav-resource-ids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.value.access_token}`,
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
