import {
  type OpdsServersRegeneratePasswordData,
  opdsServersRegeneratePassword,
} from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { useHttpClientApi } from "../../http"

export const useRegenerateOpdsServerPassword = () => {
  const httpClientApi = useHttpClientApi()

  return useMutation({
    mutationFn: async function regenerateOpdsServerPassword(
      id: OpdsServersRegeneratePasswordData["path"]["id"],
    ) {
      const { data } = await opdsServersRegeneratePassword({
        client: httpClientApi.sdkClient,
        path: { id },
      })

      return data
    },
  })
}
