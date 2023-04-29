import { useCallback, useState } from "react"
import { API_URI } from "../constants"
import { useLock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { Report } from "../debug/report.shared"
import { createServerError } from "../errors"
import { setAuthState, useAuthState } from "./authState"
import { SIGNAL_RESET, usePersistSignalsContext } from "reactjrx"

export const useIsAuthenticated = () => !!useAuthState()?.token

export const useSignOut = () => {
  return useCallback(() => {
    setAuthState(SIGNAL_RESET)
  }, [])
}

export const useAuthorize = () => {
  const [lock, unlock] = useLock()
  const auth = useAuthState()

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
  const { resetSignals: resetLocalState } = usePersistSignalsContext()
  const [error, setError] = useState<Error | undefined>(undefined)

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
    [lock, unlock, reCreateDb, resetLocalState]
  )

  const data = { error }

  return [cb, data] as [typeof cb, typeof data]
}
