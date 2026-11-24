import {
  connectorsListWebdavDirectory,
  type WebdavDirectoryItemDto,
} from "@oboku/shared"
import type { FileStat, WebDAVClient } from "webdav"
import type { HttpApiClientWeb } from "../../../http"

const toWebdavDirectoryItem = (item: FileStat): WebdavDirectoryItemDto => ({
  filename: item.filename,
  basename: item.basename,
  type: item.type,
  mime: item.mime,
  etag: item.etag ?? undefined,
})

export const listDirectoryThroughServerProxy = async ({
  httpClientApi,
  connectorId,
  password,
  path,
}: {
  httpClientApi: HttpApiClientWeb
  connectorId: string
  password: string
  path: string
}) => {
  const { data } = await connectorsListWebdavDirectory({
    client: httpClientApi.sdkClient,
    body: { connectorId, path, providerCredentials: { password } },
  })

  return data.items
}

export const listDirectoryFromWebdavServer = async ({
  client,
  path,
}: {
  client: WebDAVClient
  path: string
}) => {
  const items = await client.getDirectoryContents(path)

  return items.map(toWebdavDirectoryItem)
}
