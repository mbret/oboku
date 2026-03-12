import {
  AuthType,
  createClient,
  type FileStat,
  type WebDAVClient,
} from "webdav"

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
  const client = createClient(url, {
    username,
    password,
    authType: AuthType.Auto,
  })
  const items = await client.getDirectoryContents(path)
  return { client, items }
}
