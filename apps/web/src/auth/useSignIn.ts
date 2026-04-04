import type { SignInRequest } from "@oboku/shared"
import { finalize, from, map, type Observable, of, switchMap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { signInWithGooglePrompt } from "../google/auth"
import { completeAuthentication } from "./completeAuthentication"
import { getOrCreateAuthInstallationId } from "./installationId"

export const useSignIn = () => {
  const { mutateAsync: reCreateDb } = useReCreateDb()

  return useMutation$({
    mutationFn: (data: { email: string; password: string } | undefined) => {
      lock("authentication")
      const installationId = getOrCreateAuthInstallationId()

      const credentials$: Observable<SignInRequest> = data
        ? of({
            ...data,
            installation_id: installationId,
          })
        : signInWithGooglePrompt().pipe(
            map((authResponse) => ({
              token: authResponse.credential,
              installation_id: installationId,
            })),
          )

      return credentials$.pipe(
        switchMap((credentials) => from(httpClientApi.signIn(credentials))),
        switchMap(({ data }) =>
          completeAuthentication({
            reCreateDb,
            auth: data,
          }),
        ),
        finalize(() => {
          unlock("authentication")
        }),
      )
    },
  })
}
