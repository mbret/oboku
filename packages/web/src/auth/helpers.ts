import { useCallback, useState } from "react"
import { API_URI } from "../constants"
import { useLock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { createServerError } from "../errors"
import { authStateSignal } from "./authState"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import { resetSignalEntriesToPersist } from "../storage"

export const useIsAuthenticated = () => !!useSignalValue(authStateSignal)?.token

export const useSignOut = () => {
  return useCallback(() => {
    authStateSignal.setValue(SIGNAL_RESET)
  }, [])
}

export const useSignUp = () => {
  const [lock, unlock] = useLock()
  const reCreateDb = useReCreateDb()
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
        await resetSignalEntriesToPersist()
        await reCreateDb()
        authStateSignal.setValue({ dbName, email, token, nameHex })
        unlock("authorize")
      } catch (e) {
        setError(e as any)
        unlock("authorize")
      }
    },
    [lock, unlock, reCreateDb]
  )

  const data = { error }

  return [cb, data] as [typeof cb, typeof data]
}
