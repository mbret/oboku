// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render } from "@testing-library/react"
import { SIGNAL_RESET } from "reactjrx"
import { afterEach, describe, expect, it, vi } from "vitest"

const { putProfile } = vi.hoisted(() => ({ putProfile: vi.fn() }))

vi.mock("../profiles/usePutProfile", () => ({
  usePutProfile: () => ({ mutateAsync: putProfile }),
}))

import type { HttpApiClientWeb, SessionStore } from "../http/HttpClientApi.web"
import { HttpClientApiContext } from "../http"
import { activeProfileIdSignal } from "../profiles/active/activeProfileId"
import type { Profile } from "../profiles/types"
import { HttpSessionStoreProvider } from "./HttpSessionStoreProvider"

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  email: "reader@example.com",
  nameHex: "reader",
  dbName: "reader-db",
  needsRelogin: false,
  ...overrides,
})

const renderProviderAndCaptureStore = () => {
  let store: SessionStore | undefined

  // test double: only configureSessionStore is exercised by these tests
  const client = {
    configureSessionStore: (nextStore: SessionStore) => {
      store = nextStore
    },
  } as unknown as HttpApiClientWeb

  render(
    <QueryClientProvider client={new QueryClient()}>
      <HttpClientApiContext.Provider value={client}>
        <HttpSessionStoreProvider>
          <div />
        </HttpSessionStoreProvider>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )

  if (!store) throw new Error("session store was not configured")

  return store
}

describe("HttpSessionStoreProvider session store", () => {
  afterEach(() => {
    cleanup()
    putProfile.mockClear()
    activeProfileIdSignal.update(SIGNAL_RESET)
  })

  it("persists a refreshed session for the active profile", async () => {
    activeProfileIdSignal.update("reader")

    const store = renderProviderAndCaptureStore()

    await store.set(createProfile())

    expect(putProfile).toHaveBeenCalledWith(createProfile())
  })

  it("does not re-persist a session once the active profile is cleared", async () => {
    activeProfileIdSignal.update("reader")

    const store = renderProviderAndCaptureStore()

    activeProfileIdSignal.update(SIGNAL_RESET)

    await store.set(createProfile())

    expect(putProfile).not.toHaveBeenCalled()
  })

  it("does not persist a session belonging to a different profile", async () => {
    activeProfileIdSignal.update("other")

    const store = renderProviderAndCaptureStore()

    await store.set(createProfile())

    expect(putProfile).not.toHaveBeenCalled()
  })
})
