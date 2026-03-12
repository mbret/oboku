import { useMutation } from "@tanstack/react-query"
import { authState } from "./states"
import { config } from "@/config"

export type WebdavMigrationResult = {
  usersMigrated: number
  connectorsCreated: number
}

export const useMigrateWebdavConnectors = () => {
  return useMutation({
    mutationFn: async (): Promise<WebdavMigrationResult> => {
      const res = await fetch(
        `${config.apiUrl}/admin/migrate-webdav-connectors`,
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
