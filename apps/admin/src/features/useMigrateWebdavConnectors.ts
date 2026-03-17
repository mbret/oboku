import { useMutation } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export type WebdavMigrationResult = {
  usersMigrated: number
  connectorsCreated: number
}

export const useMigrateWebdavConnectors = () => {
  return useMutation({
    mutationFn: async (): Promise<WebdavMigrationResult> => {
      const res = await authenticatedFetch(
        `${config.apiUrl}/admin/migrate-webdav-connectors`,
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
