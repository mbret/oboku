import { useQuery } from "@tanstack/react-query"
import { adminListUsers } from "@oboku/shared"
import { apiClient } from "../apiClient"

export const adminUsersQueryKey = ["admin", "users"] as const

export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: async () => {
      const { data } = await adminListUsers({ client: apiClient })

      return data
    },
  })
}
