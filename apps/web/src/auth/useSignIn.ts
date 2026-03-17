import { finalize, from, map, type Observable, of, switchMap, tap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { authStateSignal } from "./states.web"
import { httpClientApi } from "../http/httpClientApi.web"
import { setProfile } from "../profile/currentProfile"
import { setUser } from "@sentry/react"
import { currentProfileSignal } from "../profile/currentProfile"
import { useMutation$ } from "reactjrx"
import { signInWithGooglePrompt } from "../google/auth"

export const useSignIn = () => {
  const { mutateAsync: reCreateDb } = useReCreateDb()

  return useMutation$({
    mutationFn: (data: { email: string; password: string } | undefined) => {
      lock("authentication")

      const credentials$: Observable<
        { email: string; password: string } | { token: string }
      > = data
        ? of(data)
        : signInWithGooglePrompt().pipe(
            map((authResponse) => ({ token: authResponse.credential })),
          )

      return credentials$.pipe(
        switchMap((credentials) => from(httpClientApi.signIn(credentials))),
        switchMap(
          ({ data: { dbName, email, accessToken, refreshToken, nameHex } }) => {
            const previousAuth = authStateSignal.value
            const waitForDbRecreation$ =
              previousAuth?.email !== email
                ? from(reCreateDb({ overwrite: true }))
                : of(null)

            return waitForDbRecreation$.pipe(
              tap(() => {
                authStateSignal.update({
                  dbName,
                  email,
                  accessToken,
                  refreshToken,
                  nameHex,
                })
                setUser({ email, id: nameHex })
                setProfile(nameHex)
                currentProfileSignal.update(nameHex)
              }),
            )
          },
        ),
        finalize(() => {
          unlock("authentication")
        }),
      )
    },
  })
}
