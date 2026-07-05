// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  act,
  cleanup,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ProfileWithLegacyTokens } from "../profiles/types"

const { profilesStore } = vi.hoisted(() => ({
  profilesStore: new Map<string, ProfileWithLegacyTokens>(),
}))

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    profiles: {
      toArray: async () => [...profilesStore.values()],
      update: async (
        profileId: string,
        patch: Partial<ProfileWithLegacyTokens>,
      ) => {
        const profile = profilesStore.get(profileId)

        if (!profile) return 0

        profilesStore.set(profileId, { ...profile, ...patch })

        return 1
      },
      delete: async (profileId: string) => {
        profilesStore.delete(profileId)
      },
    },
  },
}))

import type { HttpApiClientWeb } from "../http/HttpClientApi.web"
import { HttpClientApiContext } from "../http"
import { usePatchProfile } from "../profiles"
import { RevokeLoggedOutProfiles } from "./RevokeLoggedOutProfiles"

let onLine = true

Object.defineProperty(window.navigator, "onLine", {
  configurable: true,
  get: () => onLine,
})

const goOffline = () => {
  onLine = false
  act(() => {
    window.dispatchEvent(new Event("offline"))
  })
}

const goOnline = () => {
  onLine = true
  act(() => {
    window.dispatchEvent(new Event("online"))
  })
}

const createProfile = (
  overrides: Partial<ProfileWithLegacyTokens> = {},
): ProfileWithLegacyTokens => ({
  id: "reader",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
  ...overrides,
})

const createProvidersWrapper = (logout: ReturnType<typeof vi.fn>) => {
  // test double: only logout is exercised by the sweep
  const client = { logout } as unknown as HttpApiClientWeb

  return function ProvidersWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={new QueryClient()}>
        <HttpClientApiContext.Provider value={client}>
          {children}
        </HttpClientApiContext.Provider>
      </QueryClientProvider>
    )
  }
}

describe("RevokeLoggedOutProfiles", () => {
  afterEach(() => {
    cleanup()
    profilesStore.clear()
    localStorage.clear()
    onLine = true
  })

  it("sweeps on boot when online with a logged out tombstone", async () => {
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

    render(<RevokeLoggedOutProfiles />, {
      wrapper: createProvidersWrapper(logout),
    })

    await waitFor(() => {
      expect(profilesStore.has("gone-reader")).toBe(false)
    })

    expect(logout).toHaveBeenCalledWith({
      refresh_token: "gone-refresh-token",
    })
    expect(profilesStore.has("active-reader")).toBe(true)
  })

  it("waits for the network to come back before sweeping", async () => {
    profilesStore.set(
      "gone-reader",
      createProfile({ id: "gone-reader", status: "loggedOut" }),
    )

    const logout = vi.fn().mockResolvedValue({ data: {} })

    goOffline()

    render(<RevokeLoggedOutProfiles />, {
      wrapper: createProvidersWrapper(logout),
    })

    await act(async () => {})

    expect(logout).not.toHaveBeenCalled()
    expect(profilesStore.has("gone-reader")).toBe(true)

    goOnline()

    await waitFor(() => {
      expect(profilesStore.has("gone-reader")).toBe(false)
    })
    expect(logout).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledWith()
  })

  it("sweeps once sign out flags the profile as logged out", async () => {
    profilesStore.set(
      "active-reader",
      createProfile({
        id: "active-reader",
      }),
    )

    const logout = vi.fn().mockResolvedValue({ data: {} })
    const ProvidersWrapper = createProvidersWrapper(logout)

    const { result } = renderHook(() => usePatchProfile(), {
      wrapper: function ProvidersWithSweeperWrapper({
        children,
      }: {
        children: ReactNode
      }) {
        return (
          <ProvidersWrapper>
            <RevokeLoggedOutProfiles />
            {children}
          </ProvidersWrapper>
        )
      },
    })

    await act(async () => {})

    expect(logout).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.mutateAsync({
        id: "active-reader",
        status: "loggedOut",
      })
    })

    await waitFor(() => {
      expect(profilesStore.has("active-reader")).toBe(false)
    })
    expect(logout).toHaveBeenCalledWith()
  })
})
