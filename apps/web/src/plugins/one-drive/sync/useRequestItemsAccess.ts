import { useMutation, useQueryClient } from "@tanstack/react-query"
import { requestMicrosoftAccessToken } from "../auth/auth"
import { ONE_DRIVE_GRAPH_SCOPES } from "../constants"
import { oneDriveDatasourceItemQueryKey } from "./useDataSourceItem"

export function useRequestItemsAccess({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await requestMicrosoftAccessToken({
        interaction: "interactive-only",
        requestPopup,
        scopes: ONE_DRIVE_GRAPH_SCOPES,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: oneDriveDatasourceItemQueryKey,
      })
    },
  })
}
