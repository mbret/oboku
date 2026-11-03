import { cleanup, render } from "@testing-library/react"
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query"
import type { DataSourceDocTypeFor } from "@oboku/shared"
import { StrictMode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const { synchronize, refreshMetadata, createRequestPopupDialog } = vi.hoisted(
  function createPluginMocks() {
    return {
      synchronize: vi.fn(),
      refreshMetadata: vi.fn(),
      createRequestPopupDialog: vi.fn(
        function createMockRequestPopupDialog(_options: { name: string }) {
          return async function requestPopup() {
            return true
          }
        },
      ),
    }
  },
)

vi.mock("../useCreateRequestPopupDialog", function mockRequestPopupDialog() {
  return {
    useCreateRequestPopupDialog: function useMockCreateRequestPopupDialog() {
      return createRequestPopupDialog
    },
  }
})

vi.mock("../configure", async function mockRegistry() {
  const { registerPlugin } = await import("./registerPlugin")
  const { default: webdav } = await import("../../webdav/webdavPlugin")
  const registeredWebdav = registerPlugin({
    ...webdav,
    useSynchronize: function useMockSynchronize() {
      return useMutation({ mutationFn: synchronize })
    },
    useRefreshMetadata: function useMockRefreshMetadata({ meta }) {
      return useMutation({ meta, mutationFn: refreshMetadata })
    },
  })
  const pluginsByType = { webdav: registeredWebdav }

  return {
    pluginsByType,
    plugins: [registeredWebdav],
    getPluginByType: function getMockPluginByType() {
      return registeredWebdav
    },
    isPluginType: function isMockPluginType(type: string | undefined) {
      return type === "webdav"
    },
  }
})

import {
  pluginRequestsSignal,
  refreshMetadataWithPlugin,
  synchronizeWithPlugin,
} from "./pluginRequests"
import { PluginRequestsHost } from "./PluginRequestsHost"

const webdavDataSource: DataSourceDocTypeFor<"webdav"> = {
  _id: "data-source",
  _rev: "1-data-source",
  rxdbMeta: { lwt: 0 },
  rx_model: "datasource",
  type: "webdav",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  lastSyncedAt: null,
  syncStatus: null,
  data_v2: { connectorId: "connector", directory: "/books" },
}

const credentials = { providerCredentials: { password: "secret" } }

function renderHost() {
  const queryClient = new QueryClient()

  render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <PluginRequestsHost />
      </QueryClientProvider>
    </StrictMode>,
  )

  return queryClient
}

describe("PluginRequestsHost", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("gets the credentials from the plugin of the data source's type once, with a popup named after the plugin", async () => {
    synchronize.mockResolvedValue(credentials)
    renderHost()

    await expect(synchronizeWithPlugin(webdavDataSource)).resolves.toEqual(
      credentials,
    )
    expect(synchronize).toHaveBeenCalledTimes(1)
    expect(synchronize.mock.calls[0]?.[0]).toEqual(webdavDataSource)
    expect(createRequestPopupDialog).toHaveBeenCalledWith({ name: "WebDAV" })
    expect(pluginRequestsSignal.getValue()).toEqual([])
  })

  it("rejects with the plugin's error and drops the request", async () => {
    const connectorError = new Error("connector not configured")
    synchronize.mockRejectedValue(connectorError)
    renderHost()

    await expect(synchronizeWithPlugin(webdavDataSource)).rejects.toBe(
      connectorError,
    )
    expect(pluginRequestsSignal.getValue()).toEqual([])
  })

  it("refreshes metadata with a mutation that carries the caller's meta", async () => {
    const meta = { suppressGlobalErrorToast: true }
    const variables = {
      linkType: "webdav" as const,
      linkData: { connectorId: "connector", filePath: "/books/a.epub" },
    }
    refreshMetadata.mockResolvedValue(credentials)
    const queryClient = renderHost()

    await expect(
      refreshMetadataWithPlugin(variables, { meta }),
    ).resolves.toEqual(credentials)
    expect(refreshMetadata).toHaveBeenCalledTimes(1)
    expect(refreshMetadata.mock.calls[0]?.[0]).toEqual(variables)
    expect(queryClient.getMutationCache().getAll()[0]?.meta).toBe(meta)
  })

  it("rejects a data source whose type no plugin has, without a request", async () => {
    renderHost()

    await expect(
      synchronizeWithPlugin({
        ...webdavDataSource,
        type: "dropbox",
        data_v2: {},
      }),
    ).rejects.toThrow("Unsupported data source type: dropbox")
    expect(synchronize).not.toHaveBeenCalled()
  })
})
