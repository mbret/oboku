import type { SignInWithGoogleRequest } from "@oboku/shared"
import { finalize, from, map, switchMap } from "rxjs"
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

      const signIn$ = data
        ? from(
            httpClientApi.signInWithEmail({
              ...data,
              installation_id: installationId,
            }),
          )
        : signInWithGooglePrompt().pipe(
            map(
              (authResponse): SignInWithGoogleRequest => ({
                token: authResponse.credential,
                installation_id: installationId,
              }),
            ),
            switchMap((credentials) =>
              from(httpClientApi.signInWithGoogle(credentials)),
            ),
          )

      return signIn$.pipe(
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
