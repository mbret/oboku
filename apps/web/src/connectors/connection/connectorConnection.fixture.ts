import type {
  ConnectorConnectionDto,
  WebdavConnectorDocType,
} from "@oboku/shared"

export const toWebdavConnector = (
  id: string,
  host: string,
): WebdavConnectorDocType => ({
  id,
  type: "webdav",
  url: `https://${host}/dav/`,
  username: "reader",
  passwordAsSecretId: `${id}-password`,
})

export const NAS = toWebdavConnector("nas", "nas.example.com")
export const OFFICE = toWebdavConnector("office", "office.example.com")
export const ARCHIVE = toWebdavConnector("archive", "archive.example.com")

export const toConnection = (
  connectorId: string,
  status: ConnectorConnectionDto["status"],
): ConnectorConnectionDto => ({
  connectorId,
  status,
  connectedAt: "2026-11-16T08:00:00.000Z",
})
