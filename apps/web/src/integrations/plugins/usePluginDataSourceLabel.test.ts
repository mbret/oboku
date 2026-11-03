import { renderHook } from "@testing-library/react"
import type { DataSourceDocType, SettingsConnectorDocType } from "@oboku/shared"
import { afterEach, describe, expect, it, vi } from "vitest"

const { useSettings } = vi.hoisted(function createSettingsMocks() {
  return { useSettings: vi.fn() }
})

vi.mock("../../settings/useSettings", function mockSettings() {
  return { useSettings }
})

import { usePluginDataSourceLabel } from "./usePluginDataSourceLabel"

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

const serverDataSource: DataSourceDocType = {
  ...dataSourceBase,
  type: "server",
  data_v2: { connectorId: "connector" },
}

const dropboxDataSource: DataSourceDocType = {
  ...dataSourceBase,
  type: "dropbox",
  data_v2: { folderName: "Books" },
}

const serverConnector: SettingsConnectorDocType = {
  id: "connector",
  type: "server",
  username: "reader",
  passwordAsSecretId: "secret",
}

function renderDataSourceLabel(
  dataSource: DataSourceDocType,
  connectors: SettingsConnectorDocType[],
) {
  useSettings.mockReturnValue({ data: { connectors } })

  return renderHook(function renderPluginDataSourceLabel() {
    return usePluginDataSourceLabel(dataSource)
  }).result.current
}

describe("usePluginDataSourceLabel", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("labels a data source with the connector it names", () => {
    expect(renderDataSourceLabel(serverDataSource, [serverConnector])).toBe(
      "server://reader",
    )
    expect(useSettings).toHaveBeenCalledWith({ enabled: true })
  })

  it("ignores a connector of another type that has the same id", () => {
    expect(
      renderDataSourceLabel(serverDataSource, [
        { ...serverConnector, type: "webdav", url: "https://nas.local" },
      ]),
    ).toBeUndefined()
  })

  it("labels nothing without a data source", () => {
    useSettings.mockReturnValue({ data: undefined })

    const { result } = renderHook(function renderMissingDataSourceLabel() {
      return usePluginDataSourceLabel(undefined)
    })

    expect(result.current).toBeUndefined()
    expect(useSettings).toHaveBeenCalledWith({ enabled: false })
  })

  it("labels a data source without a connector and does not read the settings", () => {
    expect(renderDataSourceLabel(dropboxDataSource, [serverConnector])).toBe(
      "Dropbox/Books",
    )
    expect(useSettings).toHaveBeenCalledWith({ enabled: false })
  })
})
