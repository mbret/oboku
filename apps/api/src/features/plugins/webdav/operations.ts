import { type createClient, type WebDAVClient } from "webdav"

// @important needs "node-domexception" which did not seem to be installed by default
export async function getWebdavModule(): Promise<{
  createClient: typeof createClient
}> {
  return await import("webdav")
}

export async function getFileMetadataFromWebdav(
  client: WebDAVClient,
  filePath: string,
) {
  const response = await client.stat(filePath, { details: true })

  if ("data" in response) {
    return {
      canDownload: true,
      contentType: response.data.mime,
      name: response.data.basename,
      modifiedAt: response.data.lastmod,
    }
  }

  throw new Error("File not found")
}

export async function getFolderMetadataFromWebdav(
  client: WebDAVClient,
  filePath: string,
) {
  const response = await client.stat(filePath, { details: true })

  if ("data" in response) {
    return {
      name: response.data.basename,
      modifiedAt: response.data.lastmod,
    }
  }

  throw new Error("Folder not found")
}

export async function downloadFromWebdav(
  client: WebDAVClient,
  filePath: string,
) {
  return {
    stream: client.createReadStream(filePath),
  }
}
