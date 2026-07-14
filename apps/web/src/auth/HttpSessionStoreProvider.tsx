import { useQueryClient } from "@tanstack/react-query"
import { memo, type ReactNode, useState } from "react"
import { useHttpClientApi } from "../http"
import { fetchProfile } from "../profiles/active/activeProfileId"
import { ensureActiveProfile } from "../profiles/active/useActiveProfile"
import { usePutProfile } from "../profiles/usePutProfile"

/**
 * Teaches the HTTP client how to read the current auth token and persist
 * refreshed sessions, sourcing both from the active profile query. Configured
 * during render (once) so the store is in place before any child query effect
 * can fire an authenticated request.
 *
 * The active profile id is read from `getProfile()` (localStorage) rather than
 * the in-memory signal: localStorage is shared across tabs, so a sign-out in
 * one tab is seen here. Reading the per-tab signal would let a stale tab
 * re-persist a session — and resurrect a just-deleted profile row — on its
 * next refresh.
 */
export const HttpSessionStoreProvider = memo(function HttpSessionStoreProvider({
  children,
}: {
  children: ReactNode
}) {
  const httpClientApi = useHttpClientApi()
  const queryClient = useQueryClient()
  const { mutateAsync: putProfile } = usePutProfile()

  useState(function configureSessionStoreOnce() {
    httpClientApi.configureSessionStore({
      get: () => ensureActiveProfile(queryClient, fetchProfile()),
      set: async (session) => {
        const isStillActiveProfile = fetchProfile() === session.id

        if (!isStillActiveProfile) return

        await putProfile(session)
      },
    })
  })

  return <>{children}</>
})
