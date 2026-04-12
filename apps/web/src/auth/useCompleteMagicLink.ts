import { from, switchMap } from "rxjs"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { useReCreateDb } from "../rxdb"
import { completeAuthentication } from "./completeAuthentication"
import { getOrCreateAuthInstallationId } from "./installationId"
import { withLock } from "../common/locks/utils"

export const useCompleteMagicLink = () => {
  const { mutateAsync: reCreateDb } = useReCreateDb()

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
          }),
        ),
        withLock("magic-link-complete"),
      )
    },
  })
}
