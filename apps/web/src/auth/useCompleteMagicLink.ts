import { finalize, from, switchMap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { useReCreateDb } from "../rxdb"
import { completeAuthentication } from "./completeAuthentication"

export const useCompleteMagicLink = () => {
  const { mutateAsync: reCreateDb } = useReCreateDb()

  return useMutation$({
    mutationFn: (data: { token: string }) => {
      lock("magic-link-complete")

      return from(httpClientApi.authWithMagicLink(data)).pipe(
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
