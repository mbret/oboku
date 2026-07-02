import { from, switchMap } from "rxjs"
import { useHttpClientApi } from "../http"
import { useMutation$ } from "reactjrx"
import { useReCreateDb } from "../rxdb"
import { completeAuthentication } from "./completeAuthentication"
import { getOrCreateAuthInstallationId } from "./installationId"
import { withLock } from "../common/locks/utils"
import { useQueryClient } from "@tanstack/react-query"

export const useCompleteMagicLink = () => {
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: reCreateDb } = useReCreateDb()
  const queryClient = useQueryClient()

  return useMutation$({
    mutationFn: (data: { token: string }) => {
      return from(
        httpClientApi.authWithMagicLink({
          ...data,
          installation_id: getOrCreateAuthInstallationId(),
        }),
      ).pipe(
        switchMap(({ data }) =>
          completeAuthentication({
            reCreateDb,
            auth: data,
            queryClient,
          }),
        ),
        withLock("magic-link-complete"),
      )
    },
  })
}
