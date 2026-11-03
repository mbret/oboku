import type {
  DataSourceDocTypeFor,
  WebdavConnectorDocType,
} from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { getDataSourceLabel } from "./getDataSourceLabel"

const dataSource: DataSourceDocTypeFor<"webdav"> = {
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

const connectorWithoutUrl: Omit<WebdavConnectorDocType, "url"> = {
  id: "connector",
  type: "webdav",
  username: "reader",
  passwordAsSecretId: "secret",
}

describe("getDataSourceLabel", () => {
  it.each([
    {
      form: "has a scheme",
      url: "https://nas.local:5005/dav",
      label: "webdav://reader@nas.local/books",
    },
    {
      form: "has no scheme",
      url: "192.168.1.10/dav",
      label: "webdav://reader@192.168.1.10/books",
    },
    {
      form: "is a host and port",
      url: "nas.local:5005/dav",
      label: "webdav://reader@nas.local/books",
    },
  ])(
    "labels a source whose connector URL $form with its host",
    ({ url, label }) => {
      expect(
        getDataSourceLabel(dataSource, { ...connectorWithoutUrl, url }),
      ).toBe(label)
    },
  )
})
