import { finalize, from, switchMap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { useReCreateDb } from "../rxdb"
import { completeAuthentication } from "./completeAuthentication"
import { getOrCreateAuthInstallationId } from "./installationId"

export const useCompleteMagicLink = () => {
  const { mutateAsync: reCreateDb } = useReCreateDb()

  return useMutation$({
    mutationFn: (data: { token: string }) => {
      lock("magic-link-complete")

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
        finalize(() => {
          unlock("magic-link-complete")
        }),
      )
    },
  })
}
