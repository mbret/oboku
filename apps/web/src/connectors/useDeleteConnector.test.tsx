import type { SettingsConnectorType } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { of } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { HttpClientApiContext } from "../http"
import type { HttpApiClientWeb } from "../http/HttpClientApi.web"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../profiles/active/activeProfileId"

const mocks = vi.hoisted(function createDeleteConnectorMocks() {
  return {
    deleteConnector: vi.fn(),
    disconnect: vi.fn(),
  }
})

vi.mock("../rxdb/RxDbProvider", function mockRxDbProvider() {
  return {
    getLatestDatabase: function getFakeDatabase() {
      return of({ settings: { deleteConnector: mocks.deleteConnector } })
    },
  }
})

import { useDeleteConnector } from "./useDeleteConnector"

const CONNECTOR_ID = "webdav-connector"

function renderUseDeleteConnector({
  type = "webdav",
}: {
  type?: SettingsConnectorType
} = {}) {
  // test double: the hook only calls the generated client's `delete`
  const client = {
    sdkClient: { delete: mocks.disconnect },
  } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <HttpClientApiContext.Provider value={client}>
          {children}
        </HttpClientApiContext.Provider>
      </QueryClientProvider>
    )
  }

  const { result } = renderHook(useDeleteConnector, { wrapper: Wrapper })

  act(function deleteFakeConnector() {
    result.current.mutate({ id: CONNECTOR_ID, type, profileId: "profile" })
  })

  return result
}

describe("useDeleteConnector", () => {
  beforeEach(() => {
    setActiveProfileId("profile")
    mocks.deleteConnector.mockResolvedValue({})
  })

  afterEach(() => {
    clearActiveProfileId()
    vi.clearAllMocks()
  })

  it("asks oboku's server to forget the deleted connector's connection", async () => {
    mocks.disconnect.mockResolvedValue({ data: { ok: true } })

    renderUseDeleteConnector()

    await waitFor(() => {
      expect(mocks.disconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/provider-connections/connectors/{connectorId}",
          path: { connectorId: CONNECTOR_ID },
        }),
      )
    })
    expect(mocks.deleteConnector).toHaveBeenCalledWith(CONNECTOR_ID)
  })

  it("deletes the connector even when oboku's server cannot be reached", async () => {
    mocks.disconnect.mockRejectedValue(new Error("offline"))

    const result = renderUseDeleteConnector()

    await waitFor(() => {
      expect(mocks.disconnect).toHaveBeenCalled()
    })
    expect(result.current.isSuccess).toBe(true)
    expect(mocks.deleteConnector).toHaveBeenCalledWith(CONNECTOR_ID)
  })

  it("sends no request for a connector type that cannot be connected", async () => {
    const result = renderUseDeleteConnector({ type: "synology-drive" })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mocks.deleteConnector).toHaveBeenCalledWith(CONNECTOR_ID)
    expect(mocks.disconnect).not.toHaveBeenCalled()
  })

  it("keeps the connection when the connector could not be deleted", async () => {
    mocks.deleteConnector.mockRejectedValue(new Error("Settings not found"))

    const result = renderUseDeleteConnector()

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(mocks.disconnect).not.toHaveBeenCalled()
  })
})
