import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query"
import { type HttpApiClientWeb, useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"

export const useNotificationMutation = <TData, TError, TVariables, TContext>(
  mutationOptions: (
    queryClient: QueryClient,
    httpClientApi: HttpApiClientWeb,
    profileId: string | undefined,
  ) => UseMutationOptions<TData, TError, TVariables, TContext>,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation(
    mutationOptions(queryClient, httpClientApi, activeProfileId),
  )
}
