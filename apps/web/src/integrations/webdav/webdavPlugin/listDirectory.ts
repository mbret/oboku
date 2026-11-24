import {
  connectorsListWebdavDirectory,
  type WebdavDirectoryItemDto,
} from "@oboku/shared"
import type { FileStat, WebDAVClient } from "webdav"
import type { HttpApiClientWeb } from "../../../http"
import { createWebdavClient } from "./auth/connect"

export type WebdavConnection = {
  url: string
  username: string
  password: string
  allowSelfSigned?: boolean
}

const toWebdavDirectoryItem = (item: FileStat): WebdavDirectoryItemDto => ({
  filename: item.filename,
  basename: item.basename,
  type: item.type,
  mime: item.mime,
  etag: item.etag ?? undefined,
})

const listDirectoryThroughServerProxy = async ({
  httpClientApi,
  connection: { url, username, password, allowSelfSigned },
  path,
}: {
  httpClientApi: HttpApiClientWeb
  connection: WebdavConnection
  path: string
}) => {
  const { data } = await connectorsListWebdavDirectory({
    client: httpClientApi.sdkClient,
    body: {
      url,
      username,
      providerCredentials: { password },
      allowSelfSigned,
      path,
    },
  })

  return data.items
}

const listDirectoryFromWebdavServer = async ({
  client,
  path,
}: {
  client: WebDAVClient
  path: string
}) => {
  const items = await client.getDirectoryContents(path)

  return items.map(toWebdavDirectoryItem)
}

/** The browser lists every folder with one client, which remembers how the server signs in. */
export const createWebdavDirectoryLister = ({
  connection,
  isProxiedThroughServer,
  httpClientApi,
}: {
  connection: WebdavConnection
  isProxiedThroughServer: boolean
  httpClientApi: HttpApiClientWeb
}) => {
  if (isProxiedThroughServer) {
    return function listDirectoryThroughServer(path: string) {
      return listDirectoryThroughServerProxy({
        httpClientApi,
        connection,
        path,
      })
    }
  }

  const client = createWebdavClient({
    url: connection.url,
    username: connection.username,
    password: connection.password,
  })

  return function listDirectoryFromServer(path: string) {
    return listDirectoryFromWebdavServer({ client, path })
  }
}
