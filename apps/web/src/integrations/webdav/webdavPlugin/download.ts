import { createWebdavClient } from "./auth/connect"

export const downloadFromWebdavServer = async ({
  url,
  username,
  password,
  filePath,
  signal,
}: {
  url: string
  username: string
  password: string
  filePath: string
  signal: AbortSignal
}) => {
  const client = createWebdavClient({ url, username, password })
  const content = await client.getFileContents(filePath, {
    format: "binary",
    signal,
  })

  if (!(content instanceof ArrayBuffer)) {
    throw new Error("Unknown data type")
  }

  return new Blob([content])
}
