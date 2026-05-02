import { isFileSupported } from "@oboku/shared"
import { type createClient, type WebDAVClient } from "webdav"

// @important needs "node-domexception" which did not seem to be installed by default
export async function getWebdavModule(): Promise<{
  createClient: typeof createClient
}> {
  return await import("webdav")
}

/**
 * Webdav's `lastmod` is an HTTP-date (RFC 1123, e.g.
 * "Wed, 21 Oct 2015 07:28:00 GMT") while the rest of the codebase — and
 * `LinkMetadata.modifiedAt` in particular — expects ISO 8601. Normalize
 * here so downstream consumers (cache fingerprinting, UI formatting)
 * see a single, comparable shape across providers. Falls back to the
 * raw value if the string can't be parsed, to preserve the
 * "stable provider-supplied timestamp" cache property rather than
 * synthesizing a `Date.now()`.
 */
const normalizeLastmod = (lastmod: string): string => {
  const parsed = new Date(lastmod)
  return Number.isNaN(parsed.getTime()) ? lastmod : parsed.toISOString()
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
          modifiedAt: normalizeLastmod(file.lastmod),
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
        modifiedAt: normalizeLastmod(file.lastmod),
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
      modifiedAt: normalizeLastmod(response.data.lastmod),
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
      modifiedAt: normalizeLastmod(response.data.lastmod),
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
