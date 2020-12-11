import { useCallback, useState } from "react"
import { useRecoilValue } from "recoil"
import { API_URI } from "../constants"
import { AuthDocType, useRxMutation, useRxQuery } from "../rxdb"
import { createServerError } from "../errors"
import { useLock } from "../lockState"
import { useReCreateDb, useDatabase } from "../rxdb/databases"
import { authState } from "./authState"
import { useResetStore } from "../PersistedRecoilRoot"

export const useAuth = () =>
  useRxQuery(db => db.auth.findOne().where('id').equals('auth'))

export const useUpdateAuth = () =>
  useRxMutation(
    (db, variables: Partial<AuthDocType>) =>
      db.auth.safeUpdate({ $set: variables }, collection => collection.findOne())
  )

export const useIsAuthenticated = () => !!useAuth()?.token

export const useSignOut = () =>
  useRxMutation(db =>
    db.auth.findOne()
      .where('id')
      .equals('auth')
      .update({ $set: { token: null } })
  )

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
      console.error(e)
      unlock('authorize')
    }
  }
}

export const useSignIn = () => {
  const db = useDatabase()
  const resetLocalState = useResetStore()
  const reCreateDb = useReCreateDb()
  const [lock, unlock] = useLock()
  const [error, setError] = useState<Error | undefined>(undefined)

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
      const { token, userId } = (await response.json())
      const previousAuth = await db?.auth.findOne().exec()
      let newDb = db
      if (previousAuth?.email !== email) {
        await resetLocalState()
        newDb = await reCreateDb()
      }
      await newDb?.auth.safeUpdate({ $set: { token, email, userId } }, auth => auth.findOne())
      unlock('authorize')
    } catch (e) {
      console.error(e)
      setError(e)
      unlock('authorize')
    }
  }, [db, lock, unlock, reCreateDb, resetLocalState])

  const data = { error }

  return [cb, data] as [typeof cb, typeof data]
}

export const useSignUp = () => {
  const [lock, unlock] = useLock()
  const reCreateDb = useReCreateDb()
  const resetLocalState = useResetStore()
  const [error, setError] = useState<Error | undefined>(undefined)

  const cb = useCallback(async (email: string, password: string) => {
    try {
      lock('authorize')
      const response = await fetch(`${API_URI}/signup`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw await createServerError(response)
      }
      const { token, userId } = (await response.json())
      await resetLocalState()
      const newDb = await reCreateDb()
      await newDb?.auth.safeUpdate({ $set: { token, email, userId } }, auth => auth.findOne())
      unlock('authorize')
    } catch (e) {
      setError(e)
      unlock('authorize')
    }
  }, [lock, unlock, reCreateDb, resetLocalState])

  const data = { error }

  return [cb, data] as [typeof cb, typeof data]
}