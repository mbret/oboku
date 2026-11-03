import { cleanup, render } from "@testing-library/react"
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query"
import type { DataSourceDocTypeFor, DataSourceType } from "@oboku/shared"
import { StrictMode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type {
  ProviderCredentialsResult,
  UseRefreshMetadataVariables,
} from "../types"

const mocks = vi.hoisted(function createPluginMocks() {
  function createPluginMock<T extends DataSourceType>() {
    return {
      synchronize:
        vi.fn<
          (
            dataSource: DataSourceDocTypeFor<T>,
          ) => Promise<ProviderCredentialsResult<T>>
        >(),
      refreshMetadata:
        vi.fn<
          (
            variables: UseRefreshMetadataVariables<T>,
          ) => Promise<ProviderCredentialsResult<T>>
        >(),
      synchronizeOptions: vi.fn(),
      refreshMetadataOptions: vi.fn(),
    }
  }
  const popupByName = new Map<string, () => Promise<boolean>>()

  return {
    webdav: createPluginMock<"webdav">(),
    server: createPluginMock<"server">(),
    getPopup(name: string) {
      const popup =
        popupByName.get(name) ??
        async function requestPopup() {
          return true
        }
      popupByName.set(name, popup)

      return popup
    },
  }
})

vi.mock("../useRequestPopupDialog", function mockRequestPopupDialog() {
  return {
    useRequestPopupDialog: function useMockRequestPopupDialog(name: string) {
      return mocks.getPopup(name)
    },
  }
})

vi.mock("../configure", async function mockRegistry() {
  const { registerPlugin } = await import("./registerPlugin")
  const { default: webdav } = await import("../../webdav/webdavPlugin")
  const { plugin: server } = await import("../../server/serverPlugin")

  const pluginsByType = {
    webdav: registerPlugin(
      Object.assign({}, webdav, {
        useSynchronize: function useMockWebdavSynchronize(
          options: Parameters<typeof webdav.useSynchronize>[0],
        ) {
          mocks.webdav.synchronizeOptions(options)

          return useMutation({ mutationFn: mocks.webdav.synchronize })
        },
        useRefreshMetadata: function useMockWebdavRefreshMetadata(
          options: Parameters<typeof webdav.useRefreshMetadata>[0],
        ) {
          mocks.webdav.refreshMetadataOptions(options)

          return useMutation({
            meta: options.meta,
            mutationFn: mocks.webdav.refreshMetadata,
          })
        },
      }),
    ),
    server: registerPlugin(
      Object.assign({}, server, {
        useSynchronize: function useMockServerSynchronize(
          options: Parameters<typeof server.useSynchronize>[0],
        ) {
          mocks.server.synchronizeOptions(options)

          return useMutation({ mutationFn: mocks.server.synchronize })
        },
        useRefreshMetadata: function useMockServerRefreshMetadata(
          options: Parameters<typeof server.useRefreshMetadata>[0],
        ) {
          mocks.server.refreshMetadataOptions(options)

          return useMutation({
            meta: options.meta,
            mutationFn: mocks.server.refreshMetadata,
          })
        },
      }),
    ),
  }

  return {
    pluginsByType,
    plugins: Object.values(pluginsByType),
    getPluginByType: function getMockPluginByType(
      type: keyof typeof pluginsByType,
    ) {
      return pluginsByType[type]
    },
    isPluginType: function isMockPluginType(type: string | undefined) {
      return type !== undefined && Object.hasOwn(pluginsByType, type)
    },
  }
})

import {
  pluginRequestsSignal,
  refreshMetadataWithPlugin,
  synchronizeWithPlugin,
} from "./pluginRequests"
import { PluginRequestsHost } from "./PluginRequestsHost"

const dataSourceBase = {
  _id: "data-source",
  _rev: "1-data-source",
  rxdbMeta: { lwt: 0 },
  rx_model: "datasource",
  createdAt: "2026-01-01T00:00:00.000Z",
  modifiedAt: null,
  lastSyncedAt: null,
  syncStatus: null,
} as const

const webdavDataSource: DataSourceDocTypeFor<"webdav"> = {
  ...dataSourceBase,
  type: "webdav",
  data_v2: { connectorId: "webdav-connector", directory: "/books" },
}

const serverDataSource: DataSourceDocTypeFor<"server"> = {
  ...dataSourceBase,
  type: "server",
  data_v2: { connectorId: "server-connector" },
}

const webdavCredentials = { providerCredentials: { password: "webdav" } }
const serverCredentials = { providerCredentials: { password: "server" } }

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

  it("syncs each data source once through the plugin of its type, with a popup named after it", async () => {
    mocks.webdav.synchronize.mockResolvedValue(webdavCredentials)
    mocks.server.synchronize.mockResolvedValue(serverCredentials)
    renderHost()

    await expect(
      Promise.all([
        synchronizeWithPlugin(webdavDataSource),
        synchronizeWithPlugin(serverDataSource),
      ]),
    ).resolves.toEqual([webdavCredentials, serverCredentials])
    expect(mocks.webdav.synchronize).toHaveBeenCalledTimes(1)
    expect(mocks.webdav.synchronize.mock.calls[0]?.[0]).toEqual(
      webdavDataSource,
    )
    expect(mocks.server.synchronize).toHaveBeenCalledTimes(1)
    expect(mocks.server.synchronize.mock.calls[0]?.[0]).toEqual(
      serverDataSource,
    )
    expect(mocks.webdav.synchronizeOptions).toHaveBeenCalledWith({
      requestPopup: mocks.getPopup("WebDAV"),
    })
    expect(mocks.server.synchronizeOptions).toHaveBeenCalledWith({
      requestPopup: mocks.getPopup("Server"),
    })
    expect(pluginRequestsSignal.getValue()).toEqual([])
  })

  it("rejects with the plugin's error and drops the request", async () => {
    const connectorError = new Error("connector not configured")
    mocks.webdav.synchronize.mockRejectedValue(connectorError)
    renderHost()

    await expect(synchronizeWithPlugin(webdavDataSource)).rejects.toBe(
      connectorError,
    )
    expect(pluginRequestsSignal.getValue()).toEqual([])
  })

  it("refreshes metadata through the plugin of the link's type, with the caller's meta", async () => {
    const meta = { suppressGlobalErrorToast: true }
    const variables = {
      linkType: "server",
      linkData: { connectorId: "server-connector", filePath: "/a.epub" },
    } as const
    mocks.server.refreshMetadata.mockResolvedValue(serverCredentials)
    const queryClient = renderHost()

    await expect(
      refreshMetadataWithPlugin(variables, { meta }),
    ).resolves.toEqual(serverCredentials)
    expect(mocks.server.refreshMetadata).toHaveBeenCalledTimes(1)
    expect(mocks.server.refreshMetadata.mock.calls[0]?.[0]).toEqual(variables)
    expect(mocks.webdav.refreshMetadata).not.toHaveBeenCalled()
    expect(mocks.server.refreshMetadataOptions).toHaveBeenCalledWith({
      requestPopup: mocks.getPopup("Server"),
      meta,
    })
    expect(queryClient.getMutationCache().getAll()[0]?.meta).toBe(meta)
  })

  it("refreshes metadata without meta when the caller sets none", async () => {
    mocks.webdav.refreshMetadata.mockResolvedValue(webdavCredentials)
    renderHost()

    await refreshMetadataWithPlugin({ linkType: "webdav", linkData: {} })

    expect(mocks.webdav.refreshMetadataOptions).toHaveBeenCalledWith({
      requestPopup: mocks.getPopup("WebDAV"),
      meta: undefined,
    })
  })

  it("rejects a data source whose type no plugin has, without a request", async () => {
    renderHost()

    await expect(
      synchronizeWithPlugin({
        ...dataSourceBase,
        type: "dropbox",
        data_v2: {},
      }),
    ).rejects.toThrow("Unsupported data source type: dropbox")
    expect(mocks.webdav.synchronize).not.toHaveBeenCalled()
    expect(mocks.server.synchronize).not.toHaveBeenCalled()
  })

  it("rejects a link whose type no plugin has, without a request", async () => {
    renderHost()

    await expect(
      refreshMetadataWithPlugin({ linkType: "dropbox", linkData: {} }),
    ).rejects.toThrow("Unsupported link type: dropbox")
    expect(mocks.webdav.refreshMetadata).not.toHaveBeenCalled()
    expect(mocks.server.refreshMetadata).not.toHaveBeenCalled()
  })
})
