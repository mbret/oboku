import {
  finalize,
  from,
  map,
  type Observable,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { authStateSignal } from "./authState"
import { httpClient } from "../http/httpClient"
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
        switchMap((credentials) => from(httpClient.signIn(credentials))),
        withLatestFrom(authStateSignal.subject),
        switchMap(
          ([
            {
              data: { dbName, email, token, nameHex },
            },
            previousAuth,
          ]) => {
            const waitForDbRecreation$ =
              previousAuth?.email !== email
                ? from(reCreateDb({ overwrite: true }))
                : of(null)

            return waitForDbRecreation$.pipe(
              tap(() => {
                authStateSignal.setValue({ dbName, email, token, nameHex })
                setUser({ email, id: nameHex })
                setProfile(nameHex)
                currentProfileSignal.setValue(nameHex)
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
