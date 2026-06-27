import { useQuery } from "@tanstack/react-query"
import type { GetAdminUsersResponse } from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"

export const adminUsersQueryKey = ["admin", "users"] as const

export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: async (): Promise<GetAdminUsersResponse> => {
      const response = await authenticatedFetch(`${config.apiUrl}/admin/users`)

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(response, "Could not load users"),
        )
      }

      return response.json()
    },
  })
}
