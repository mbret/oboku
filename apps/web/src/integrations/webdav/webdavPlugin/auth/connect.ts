import { AuthType, createClient } from "webdav"
import { isHttpUrl } from "@oboku/shared"

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
}) => {
  if (!isHttpUrl(url)) {
    throw new Error("The WebDAV address has to start with http:// or https://")
  }

  return createClient(url, {
    username,
    password,
    authType: AuthType.Auto,
  })
}
