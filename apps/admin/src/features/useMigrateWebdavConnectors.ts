import { useMutation } from "@tanstack/react-query"
import type { AdminMigrateWebdavConnectorsResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export const useMigrateWebdavConnectors = () => {
  return useMutation({
    mutationFn: async (): Promise<AdminMigrateWebdavConnectorsResponse> => {
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
