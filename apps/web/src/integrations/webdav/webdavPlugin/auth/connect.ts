import { AuthType, createClient } from "webdav"

export const resolveWebdavUrl = ({
  connectorUrl,
  webdavUrl,
}: {
  connectorUrl: string | undefined
  webdavUrl: string | undefined
}) => {
  const url = webdavUrl ?? connectorUrl

  if (!url) {
    throw new Error("No WebDAV URL available")
  }

  return url
}

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
