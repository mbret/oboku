import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"

type ServerSync = {
  enabled: boolean
}

const serverSyncQueryKey = ["admin", "server-sync"] as const

export const useServerSync = () => {
  return useQuery({
    queryKey: serverSyncQueryKey,
    queryFn: async (): Promise<ServerSync> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/server-sync`,
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not load server sync config",
          ),
        )
      }

      return response.json()
    },
  })
}

export const useUpdateServerSync = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { enabled: boolean }): Promise<ServerSync> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/server-sync`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not update server sync config",
          ),
        )
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverSyncQueryKey })
    },
  })
}
