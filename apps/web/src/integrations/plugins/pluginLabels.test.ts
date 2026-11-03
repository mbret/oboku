import type { DataSourceDocTypeFor } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { pluginsByType } from "./configure"
import { getPluginLinkLabel } from "./getPluginLinkLabel"

describe("getPluginLinkLabel", () => {
  it.each([
    {
      link: { type: "DRIVE", data: { fileId: "drive-file" } },
      label: "ID: drive-file",
    },
    {
      link: { type: "webdav", data: { filePath: "/books/a.epub" } },
      label: "/books/a.epub",
    },
    {
      link: { type: "URI", data: { url: "https://example.com/books/a.epub" } },
      label: "a.epub",
    },
    {
      link: { type: "URI", data: { url: "https://example.com/" } },
      label: "https://example.com/",
    },
    {
      link: { type: "file", data: { filename: "a.epub" } },
      label: "Local file",
    },
  ] as const)(
    "labels a $link.type link with its plugin's label",
    ({ link, label }) => {
      expect(getPluginLinkLabel(link)).toBe(label)
    },
  )
})

describe("Synology Drive getDataSourceLabel", () => {
  const dataSource: DataSourceDocTypeFor<"synology-drive"> = {
    _id: "data-source",
    _rev: "1-data-source",
    rxdbMeta: { lwt: 0 },
    rx_model: "datasource",
    type: "synology-drive",
    createdAt: "2026-01-01T00:00:00.000Z",
    modifiedAt: null,
    lastSyncedAt: null,
    syncStatus: null,
    data_v2: { connectorId: "connector", items: ["a", "b"] },
  }
  const connector = {
    id: "connector",
    type: "synology-drive",
    url: "nas.local:5001",
    username: "reader",
    passwordAsSecretId: "secret",
  } as const
  const { getDataSourceLabel } = pluginsByType["synology-drive"]

  it("names the connector's user and host", () => {
    expect(getDataSourceLabel(dataSource, connector)).toBe(
      "synology://reader@nas.local (2 items)",
    )
  })

  it("falls back to the plugin name without a connector or a host", () => {
    expect(getDataSourceLabel(dataSource, undefined)).toBe(
      "Synology Drive (2 items)",
    )
    expect(getDataSourceLabel(dataSource, { ...connector, url: " " })).toBe(
      "Synology Drive (2 items)",
    )
  })
})
