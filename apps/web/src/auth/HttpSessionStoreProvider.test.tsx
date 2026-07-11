// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const { putProfile } = vi.hoisted(() => ({ putProfile: vi.fn() }))

vi.mock("../profiles/usePutProfile", () => ({
  usePutProfile: () => ({ mutateAsync: putProfile }),
}))

import type { HttpApiClientWeb, SessionStore } from "../http/HttpClientApi.web"
import { HttpClientApiContext } from "../http"
import {
  clearActiveProfileId,
  removeProfile,
  setActiveProfileId,
} from "../profiles/active/activeProfileId"
import type { Profile } from "../profiles/types"
import { HttpSessionStoreProvider } from "./HttpSessionStoreProvider"

const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "reader",
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
    clearActiveProfileId()
  })

  it("persists a refreshed session for the active profile", async () => {
    setActiveProfileId("reader")

    const store = renderProviderAndCaptureStore()

    await store.set(createProfile())

    expect(putProfile).toHaveBeenCalledWith(createProfile())
  })

  it("does not re-persist a session once the active profile is cleared", async () => {
    setActiveProfileId("reader")

    const store = renderProviderAndCaptureStore()

    clearActiveProfileId()

    await store.set(createProfile())

    expect(putProfile).not.toHaveBeenCalled()
  })

  it("does not persist a session once another tab has cleared localStorage", async () => {
    setActiveProfileId("reader")

    const store = renderProviderAndCaptureStore()

    // another tab signed out: localStorage is cleared but this tab's in-memory
    // signal still holds "reader"
    removeProfile()

    await store.set(createProfile())

    expect(putProfile).not.toHaveBeenCalled()
  })

  it("does not persist a session belonging to a different profile", async () => {
    setActiveProfileId("other")

    const store = renderProviderAndCaptureStore()

    await store.set(createProfile())

    expect(putProfile).not.toHaveBeenCalled()
  })
})
