import {
  AuthType,
  createClient,
  type FileStat,
  type WebDAVClient,
} from "webdav"

export const createWebdavClient = ({
  password,
  url,
  username,
}: {
  password: string
  url: string
  username: string
}) =>
  createClient(url, {
    username,
    password,
    authType: AuthType.Auto,
  })

export const connectWebdav = async ({
  password,
  path = "/",
  url,
  username,
}: {
  password: string
  path?: string
  url: string
  username: string
}): Promise<{ client: WebDAVClient; items: FileStat[] }> => {
  const client = createWebdavClient({ url, username, password })
  const items = await client.getDirectoryContents(path)
  return { client, items }
}
