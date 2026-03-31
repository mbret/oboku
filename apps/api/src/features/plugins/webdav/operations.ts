import { isFileSupported } from "@oboku/shared"
import { type createClient, type WebDAVClient } from "webdav"

// @important needs "node-domexception" which did not seem to be installed by default
export async function getWebdavModule(): Promise<{
  createClient: typeof createClient
}> {
  return await import("webdav")
}

export type DirectoryWalkItem = {
  type: "file" | "folder"
  name: string
  modifiedAt: string
  linkData: { connectorId: string; filePath: string }
  items?: DirectoryWalkItem[]
}

export async function walkDirectoryContents(
  client: WebDAVClient,
  directory: string,
  connectorId: string,
): Promise<DirectoryWalkItem[]> {
  const files = await client.getDirectoryContents(directory)

  if (!Array.isArray(files)) {
    return []
  }

  return await files.reduce(async (acc: Promise<DirectoryWalkItem[]>, file) => {
    if (file.type === "file") {
      if (
        !isFileSupported({
          mimeType: file.mime,
          name: file.basename,
        })
      ) {
        return await acc
      }

      return [
        ...(await acc),
        {
          type: file.type,
          modifiedAt: file.lastmod,
          name: file.basename,
          linkData: { connectorId, filePath: file.filename },
        },
      ]
    }

    const childItems = await walkDirectoryContents(
      client,
      file.filename,
      connectorId,
    )

    return [
      ...(await acc),
      {
        type: "folder" as const,
        modifiedAt: file.lastmod,
        name: file.basename,
        linkData: { connectorId, filePath: file.filename },
        items: childItems,
      },
    ]
  }, Promise.resolve([]))
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
