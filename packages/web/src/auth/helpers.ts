import { useCallback, useState } from "react"
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil"
import { API_URI } from "../constants"
import { createServerError } from "../errors"
import { useLock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { authState } from "./authState"
import { useResetStore } from "../PersistedRecoilRoot"
import { Report } from "../report"

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

  return async ({ variables: { password }, onSuccess }: { variables: { password: string }, onSuccess: () => void }) => {
    try {
      lock('authorize')
      const response = await fetch(`${API_URI}/signin`, {
        method: 'POST',
        body: JSON.stringify({ email: auth?.email, password }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw await createServerError(response)
      }
      unlock('authorize')
      onSuccess()
    } catch (e) {
      Report.error(e)
      unlock('authorize')
    }
  }
}

export const useSignIn = () => {
  const resetLocalState = useResetStore()
  const reCreateDb = useReCreateDb()
  const [lock, unlock] = useLock()
  const [error, setError] = useState<Error | undefined>(undefined)
  const setAuthState = useSetRecoilState(authState)

  const getAuthAsync = useRecoilCallback(({ snapshot }) => () => {
    return snapshot.getPromise(authState)
  })

  const cb = useCallback(async (email: string, password: string) => {
    try {
      lock('authorize')
      const response = await fetch(`${API_URI}/signin`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw await createServerError(response)
      }
      const { token, userId, dbName } = (await response.json())
      const previousAuth = await getAuthAsync()
      if (previousAuth?.email !== email) {
        await resetLocalState()
        await reCreateDb()
      }
      setAuthState({ dbName, email, token, userId })
      console.log('setAuthState', { dbName, email, token, userId })
      unlock('authorize')
    } catch (e) {
      Report.error(e)
      setError(e)
      unlock('authorize')
    }
  }, [lock, unlock, reCreateDb, resetLocalState, getAuthAsync, setAuthState])

  const data = { error }

  return [cb, data] as [typeof cb, typeof data]
}

export const useSignUp = () => {
  const [lock, unlock] = useLock()
  const reCreateDb = useReCreateDb()
  const resetLocalState = useResetStore()
  const [error, setError] = useState<Error | undefined>(undefined)
  const setAuthState = useSetRecoilState(authState)

  const cb = useCallback(async (email: string, password: string, code) => {
    try {
      lock('authorize')
      const response = await fetch(`${API_URI}/signup`, {
        method: 'POST',
        body: JSON.stringify({ email, password, code }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw await createServerError(response)
      }
      const { token, userId, dbName } = (await response.json())
      await resetLocalState()
      await reCreateDb()
      setAuthState({ dbName, email, token, userId })
      unlock('authorize')
    } catch (e) {
      setError(e)
      unlock('authorize')
    }
  }, [lock, unlock, reCreateDb, resetLocalState, setAuthState])

  const data = { error }

  return [cb, data] as [typeof cb, typeof data]
}