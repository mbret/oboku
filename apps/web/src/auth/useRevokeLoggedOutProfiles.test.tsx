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
import { profilesQueryKey } from "../profiles"
import { useRevokeLoggedOutProfiles } from "./useRevokeLoggedOutProfiles"

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  accessToken: "access-token",
  refreshToken: "refresh-token",
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
  })

  it("revokes logged out profiles and deletes their local tombstone", async () => {
    profilesStore.set("active-reader", createProfile({ id: "active-reader" }))
    profilesStore.set(
      "gone-reader",
      createProfile({
        id: "gone-reader",
        refreshToken: "gone-refresh-token",
        status: "loggedOut",
      }),
    )

    const logout = vi.fn().mockResolvedValue({ data: {} })
    const { result } = renderRevokeHook(logout)

    await result.current.mutateAsync()

    expect(logout).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledWith({
      refresh_token: "gone-refresh-token",
    })
    expect(profilesStore.has("gone-reader")).toBe(false)
    expect(profilesStore.has("active-reader")).toBe(true)
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

  it("revokes independently so one failure does not block other tombstones", async () => {
    profilesStore.set(
      "gone-reader",
      createProfile({
        id: "gone-reader",
        refreshToken: "gone-refresh-token",
        status: "loggedOut",
      }),
    )
    profilesStore.set(
      "stuck-reader",
      createProfile({
        id: "stuck-reader",
        refreshToken: "stuck-refresh-token",
        status: "loggedOut",
      }),
    )

    const logout = vi
      .fn()
      .mockImplementation(
        async ({ refresh_token }: { refresh_token: string }) => {
          if (refresh_token === "stuck-refresh-token") {
            throw new Error("offline")
          }

          return { data: {} }
        },
      )
    const { result } = renderRevokeHook(logout)

    await result.current.mutateAsync()

    expect(profilesStore.has("gone-reader")).toBe(false)
    expect(profilesStore.has("stuck-reader")).toBe(true)
  })

  it("leaves a row overwritten by a re-login while its logout call is in flight", async () => {
    profilesStore.set(
      "reader",
      createProfile({
        id: "reader",
        refreshToken: "old-refresh-token",
        status: "loggedOut",
      }),
    )

    const queryClient = new QueryClient()
    const freshProfile = createProfile({
      id: "reader",
      refreshToken: "new-refresh-token",
    })
    const logout = vi
      .fn()
      .mockImplementation(async function reloginWhileLogoutInFlight() {
        profilesStore.set("reader", freshProfile)
        queryClient.setQueryData(profilesQueryKey, [freshProfile])

        return { data: {} }
      })
    const { result } = renderRevokeHook(logout, queryClient)

    await result.current.mutateAsync()

    expect(logout).toHaveBeenCalledWith({
      refresh_token: "old-refresh-token",
    })
    expect(profilesStore.get("reader")?.refreshToken).toBe("new-refresh-token")
  })
})
