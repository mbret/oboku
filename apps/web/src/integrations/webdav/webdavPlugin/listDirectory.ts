import {
  connectorsListWebdavDirectory,
  type WebdavDirectoryItemDto,
} from "@oboku/shared"
import type { FileStat } from "webdav"
import type { HttpApiClientWeb } from "../../../http"
import { createWebdavClient } from "./auth/connect"

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
  url,
  username,
  password,
  path,
}: {
  url: string
  username: string
  password: string
  path: string
}) => {
  const client = createWebdavClient({ url, username, password })
  const items = await client.getDirectoryContents(path)

  return items.map(toWebdavDirectoryItem)
}
