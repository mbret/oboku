// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Profile } from "../profiles/types"

const { profilesStore } = vi.hoisted(() => ({
  profilesStore: new Map<string, Profile>(),
}))

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    profiles: {
      toArray: async () => [...profilesStore.values()],
      delete: async (profileId: string) => {
        profilesStore.delete(profileId)
      },
    },
  },
}))

import type { HttpApiClientWeb } from "../http/HttpClientApi.web"
import { HttpClientApiContext } from "../http"
import { profilesQueryKey, setProfile } from "../profiles"
import { useRevokeLoggedOutProfiles } from "./useRevokeLoggedOutProfiles"

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
  ...overrides,
})

const renderRevokeHook = (
  logout: ReturnType<typeof vi.fn>,
  queryClient = new QueryClient(),
) => {
  // test double: only logout is exercised by the sweep
  const client = { logout } as unknown as HttpApiClientWeb

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        {children}
      </HttpClientApiContext.Provider>
    </QueryClientProvider>
  )

  return renderHook(() => useRevokeLoggedOutProfiles(), { wrapper })
}

describe("useRevokeLoggedOutProfiles", () => {
  afterEach(() => {
    cleanup()
    profilesStore.clear()
    localStorage.clear()
  })

  it("revokes a cookie-session tombstone through the refresh cookie and deletes it", async () => {
    profilesStore.set(
      "gone-reader",
      createProfile({ id: "gone-reader", status: "loggedOut" }),
    )

    const logout = vi.fn().mockResolvedValue({ data: {} })
    const { result } = renderRevokeHook(logout)

    await result.current.mutateAsync()

    expect(logout).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledWith()
    expect(profilesStore.has("gone-reader")).toBe(false)
  })

  it("keeps the tombstone for a later sweep when revocation fails", async () => {
    profilesStore.set(
      "gone-reader",
      createProfile({ id: "gone-reader", status: "loggedOut" }),
    )

    const logout = vi.fn().mockRejectedValue(new Error("offline"))
    const { result } = renderRevokeHook(logout)

    await expect(result.current.mutateAsync()).resolves.toBeUndefined()

    expect(profilesStore.has("gone-reader")).toBe(true)
  })

  it("drops an unrevocable tombstone once a newer sign-in owns the cookies", async () => {
    setProfile("active-reader")
    profilesStore.set("active-reader", createProfile({ id: "active-reader" }))
    profilesStore.set(
      "gone-reader",
      createProfile({ id: "gone-reader", status: "loggedOut" }),
    )

    const logout = vi.fn().mockResolvedValue({ data: {} })
    const { result } = renderRevokeHook(logout)

    await result.current.mutateAsync()

    expect(logout).not.toHaveBeenCalled()
    expect(profilesStore.has("gone-reader")).toBe(false)
    expect(profilesStore.has("active-reader")).toBe(true)
  })

  it("leaves a row overwritten by a re-login while its logout call is in flight", async () => {
    profilesStore.set(
      "reader",
      createProfile({
        id: "reader",
        status: "loggedOut",
      }),
    )

    const queryClient = new QueryClient()
    const freshProfile = createProfile({ id: "reader" })
    const logout = vi
      .fn()
      .mockImplementation(async function reloginWhileLogoutInFlight() {
        profilesStore.set("reader", freshProfile)
        queryClient.setQueryData(profilesQueryKey, [freshProfile])

        return { data: {} }
      })
    const { result } = renderRevokeHook(logout, queryClient)

    await result.current.mutateAsync()

    expect(logout).toHaveBeenCalledTimes(1)
    expect(profilesStore.get("reader")).toEqual(freshProfile)
  })
})
