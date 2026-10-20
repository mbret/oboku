import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type AdminSetWebDavCredentialsData,
  type AdminUpdateServerSyncData,
  adminGetServerSync,
  adminSetWebDavCredentials,
  adminUpdateServerSync,
} from "@oboku/shared"
import { apiClient } from "../apiClient"

const serverSyncQueryKey = ["admin", "server-sync"] as const

export const useServerSync = () => {
  return useQuery({
    queryKey: serverSyncQueryKey,
    queryFn: async () => {
      const { data } = await adminGetServerSync({ client: apiClient })

      return data
    },
  })
}

export const useUpdateServerSync = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AdminUpdateServerSyncData["body"]) => {
      const { data } = await adminUpdateServerSync({
        client: apiClient,
        body: input,
      })

      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverSyncQueryKey })
    },
  })
}

export const useSetWebDavCredentials = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AdminSetWebDavCredentialsData["body"]) => {
      const { data } = await adminSetWebDavCredentials({
        client: apiClient,
        body: input,
      })

      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverSyncQueryKey })
    },
  })
}
