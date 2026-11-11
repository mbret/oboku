import {
  type OpdsServersCreateResponse,
  opdsServersCreate,
} from "@oboku/shared"
import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { opdsServersQueryKey } from "./queryKeys"

export const useCreateOpdsServer = (
  options?: Pick<
    UseMutationOptions<OpdsServersCreateResponse, DefaultError, void>,
    "onSuccess"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useMutation({
    mutationFn: async function createOpdsServer() {
      const { data } = await opdsServersCreate({
        client: httpClientApi.sdkClient,
      })

      return data
    },
    onSuccess: async function refreshOpdsServersThenNotifyCaller(...args) {
      await queryClient.invalidateQueries({
        queryKey: opdsServersQueryKey(activeProfileId),
      })

      return options?.onSuccess?.(...args)
    },
  })
}
