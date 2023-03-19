import axios from "axios"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { useCallback } from "react"
import { useRecoilCallback, useSetRecoilState } from "recoil"
import { catchError, finalize, from, of, switchMap, tap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { API_URI } from "../constants"
import { CancelError } from "../errors"
import { useResetStore } from "../PersistedRecoilRoot"
import { useReCreateDb } from "../rxdb"
import { authState } from "./authState"

const provider = new GoogleAuthProvider()

const auth = getAuth()

export const useSignIn = () => {
  const resetLocalState = useResetStore()
  const reCreateDb = useReCreateDb()
  const setAuthState = useSetRecoilState(authState)

  const getAuthAsync = useRecoilCallback(({ snapshot }) => () => {
    return snapshot.getPromise(authState)
  })

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
        from(getAuthAsync()).pipe(
          switchMap((previousAuth) =>
            previousAuth?.email !== email
              ? from(Promise.all([resetLocalState(), reCreateDb()]))
              : of(previousAuth)
          ),
          tap(() => {
            setAuthState({ dbName, email, token, nameHex })
          })
        )
      ),
      finalize(() => {
        unlock("authentication")
      })
    )
  }, [reCreateDb, resetLocalState, getAuthAsync, setAuthState])

  return { signIn }
}
