import { finalize, from, map, of, switchMap, tap, withLatestFrom } from "rxjs"
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
    mutationFn: () => {
      lock("authentication")

      return signInWithGooglePrompt().pipe(
        map((authResponse) => authResponse.credential),
        switchMap((token) => from(httpClient.signIn(token))),
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
