import { useMutation } from "@tanstack/react-query"
import type { AdminMigrateWebdavResourceIdsResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export const useMigrateWebdavResourceIds = () => {
  return useMutation({
    mutationFn: async (): Promise<AdminMigrateWebdavResourceIdsResponse> => {
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
