import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  GetServerSyncResponse,
  SetWebDavCredentialsResponse,
  UpdateServerSyncResponse,
} from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "../authenticatedFetch"
import { readResponseErrorMessage } from "../readResponseErrorMessage"

const serverSyncQueryKey = ["admin", "server-sync"] as const

export const useServerSync = () => {
  return useQuery({
    queryKey: serverSyncQueryKey,
    queryFn: async (): Promise<GetServerSyncResponse> => {
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
    mutationFn: async (input: {
      enabled: boolean
    }): Promise<UpdateServerSyncResponse> => {
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

export const useSetWebDavCredentials = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      username: string
      password: string
    }): Promise<SetWebDavCredentialsResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/server-sync/credentials`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      )

      if (!response.ok) {
        throw new Error(
          await readResponseErrorMessage(
            response,
            "Could not save WebDAV credentials",
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
