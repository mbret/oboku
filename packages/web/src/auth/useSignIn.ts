import axios from "axios"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { useCallback } from "react"
import { catchError, finalize, from, of, switchMap, tap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { API_URI } from "../constants"
import { CancelError } from "../errors"
import { useReCreateDb } from "../rxdb"
import { authStateSignal } from "./authState"
import { resetSignalEntriesToPersist } from "../storage"

const provider = new GoogleAuthProvider()

const auth = getAuth()

export const useSignIn = () => {
  const reCreateDb = useReCreateDb()

  const signIn = useCallback(() => {
    lock("authentication")

    return from(signInWithPopup(auth, provider)).pipe(
      catchError((e) => {
        if (e.code === "auth/popup-closed-by-user") throw new CancelError()

        throw e
      }),
      switchMap((authResponse) => authResponse.user.getIdToken()),
      switchMap((token) =>
        from(
          axios.post(
            `${API_URI}/signin`,
            {
              token
            },
            {
              headers: {
                "Content-Type": "application/json"
              }
            }
          )
        )
      ),
      switchMap(({ data: { dbName, email, token, nameHex } }) =>
        of(authStateSignal.getValue()).pipe(
          switchMap((previousAuth) =>
            previousAuth?.email !== email
              ? from(Promise.all([resetSignalEntriesToPersist(), reCreateDb()]))
              : of(previousAuth)
          ),
          tap(() => {
            authStateSignal.setValue({ dbName, email, token, nameHex })
          })
        )
      ),
      finalize(() => {
        unlock("authentication")
      })
    )
  }, [reCreateDb])

  return { signIn }
}
