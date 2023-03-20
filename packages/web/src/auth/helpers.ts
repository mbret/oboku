import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { API_URI } from "../constants"
import { useLock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { authState } from "./authState"
import { useResetStore } from "../PersistedRecoilRoot"
import { Report } from "../debug/report.shared"
import { createServerError } from "../errors"

export const useIsAuthenticated = () => !!useRecoilValue(authState)?.token

export const useSignOut = () => {
  const setAuthState = useSetRecoilState(authState)

  return useCallback(async () => {
    setAuthState(undefined)
  }, [setAuthState])
}

export const useAuthorize = () => {
  const [lock, unlock] = useLock()
  const auth = useRecoilValue(authState)

  return async ({
    variables: { password },
    onSuccess
  }: {
    variables: { password: string }
    onSuccess: () => void
  }) => {
    try {
      lock("authorize")
      const response = await fetch(`${API_URI}/signin`, {
        method: "POST",
        body: JSON.stringify({ email: auth?.email, password }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw await createServerError(response)
      }
      unlock("authorize")
      onSuccess()
    } catch (e) {
      Report.error(e)
      unlock("authorize")
    }
  }
}

export const useSignUp = () => {
  const [lock, unlock] = useLock()
  const reCreateDb = useReCreateDb()
  const resetLocalState = useResetStore()
  const [error, setError] = useState<Error | undefined>(undefined)
  const setAuthState = useSetRecoilState(authState)

  const cb = useCallback(
    async (email: string, password: string, code) => {
      try {
        lock("authorize")
        const response = await fetch(`${API_URI}/signup`, {
          method: "POST",
          body: JSON.stringify({ email, password, code }),
          headers: {
            "Content-Type": "application/json"
          }
        })
        if (!response.ok) {
          throw await createServerError(response)
        }
        const { token, nameHex, dbName } = await response.json()
        await resetLocalState()
        await reCreateDb()
        setAuthState({ dbName, email, token, nameHex })
        unlock("authorize")
      } catch (e) {
        setError(e as any)
        unlock("authorize")
      }
    },
    [lock, unlock, reCreateDb, resetLocalState, setAuthState]
  )

  const data = { error }

  return [cb, data] as [typeof cb, typeof data]
}
