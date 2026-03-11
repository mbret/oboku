import { generateSynologyDriveResourceId } from "@oboku/shared"
import {
  buildApiUrls,
  buildSynologyDriveGetItemParams,
  buildSynologyDriveListFolderParams,
  buildSynologyDriveListTeamFoldersParams,
  buildSynologyDriveLoginParams,
  buildSynologyDriveRootBrowseItems,
  getSynologyDriveDownloadUrls,
  getSynologyDriveItemFileId,
  getSynologyDriveItemName,
  getSynologyDriveItemType,
  mapSynologyDriveItemToBrowseItem,
  mapSynologyDriveItemToMetadata,
  parseSynologyDriveDownloadErrorPayload,
  parseSynologyDriveGetItemPayload,
  parseSynologyDriveListItemsPayload,
  parseSynologyDriveLoginPayload,
  type SynologyDriveApiCredentials,
  type SynologyDriveBrowseNodeId,
  type SynologyDriveItem,
  type SynologyDriveSession,
  type SynologyDriveSessionAuth,
} from "@oboku/synology"
import { Readable } from "node:stream"
import type { ReadableStream as NodeReadableStream } from "node:stream/web"
import type { SynchronizeAbleItem } from "src/lib/plugins/types"

const requestJson = async <T>({
  baseUrl,
  endpoint = "entry.cgi",
  params,
  parse,
}: {
  baseUrl: string
  endpoint?: "auth.cgi" | "entry.cgi"
  params: URLSearchParams
  parse: (payload: unknown) => T
}) => {
  const urls = buildApiUrls(baseUrl, endpoint)
  let lastResponse: Response | undefined

  for (const url of urls) {
    url.search = params.toString()

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })

    lastResponse = response

    if (response.ok) {
      return parse(await response.json())
    }

    if (response.status !== 404) {
      throw new Error(
        `Synology Drive request failed with status ${response.status}`,
      )
    }
  }

  throw new Error(
    `Synology Drive request failed with status ${lastResponse?.status ?? "unknown"}`,
  )
}

const toSessionAuth = (
  credentials: SynologyDriveApiCredentials,
  connector: { url: string; username: string },
): SynologyDriveSessionAuth => ({
  ...credentials,
  baseUrl: connector.url,
  username: connector.username,
})

export const signInSynologyDrive = async (
  auth: SynologyDriveSessionAuth,
): Promise<SynologyDriveSession> => {
  const { sid } = await requestJson({
    baseUrl: auth.baseUrl,
    endpoint: "auth.cgi",
    params: buildSynologyDriveLoginParams(auth),
    parse: parseSynologyDriveLoginPayload,
  })

  return {
    auth,
    sid,
  }
}

export const getSynologyDriveSession = async ({
  connector,
  providerCredentials,
}: {
  connector: { url: string; username: string }
  providerCredentials: SynologyDriveApiCredentials
}) => signInSynologyDrive(toSessionAuth(providerCredentials, connector))

const listFolderItems = async ({
  path,
  session,
}: {
  path: string
  session: SynologyDriveSession
}) =>
  requestJson({
    baseUrl: session.auth.baseUrl,
    params: buildSynologyDriveListFolderParams({
      path,
      session,
    }),
    parse: parseSynologyDriveListItemsPayload,
  })

const listTeamFolderItems = async ({
  session,
}: {
  session: SynologyDriveSession
}) =>
  requestJson({
    baseUrl: session.auth.baseUrl,
    params: buildSynologyDriveListTeamFoldersParams({
      session,
    }),
    parse: parseSynologyDriveListItemsPayload,
  })

export const browseSynologyDrive = async ({
  nodeId,
  session,
}: {
  nodeId?: SynologyDriveBrowseNodeId
  session: SynologyDriveSession
}) => {
  if (!nodeId) {
    const teamFolders = await listTeamFolderItems({
      session,
    }).catch(() => [])

    return {
      items: buildSynologyDriveRootBrowseItems({
        hasTeamFolders: teamFolders.length > 0,
      }),
    }
  }

  if (nodeId === "root:my-drive") {
    return {
      items: (
        await listFolderItems({
          path: "/mydrive/",
          session,
        })
      ).map(mapSynologyDriveItemToBrowseItem),
    }
  }

  if (nodeId === "root:team-folders") {
    return {
      items: (await listTeamFolderItems({ session })).map(
        mapSynologyDriveItemToBrowseItem,
      ),
    }
  }

  if (nodeId.startsWith("folder:")) {
    return {
      items: (
        await listFolderItems({
          path: `id:${nodeId.replace("folder:", "")}`,
          session,
        })
      ).map(mapSynologyDriveItemToBrowseItem),
    }
  }

  return {
    items: [],
  }
}

const getSynologyDriveItem = async ({
  fileId,
  session,
}: {
  fileId: string
  session: SynologyDriveSession
}) =>
  requestJson({
    baseUrl: session.auth.baseUrl,
    params: buildSynologyDriveGetItemParams({
      fileId,
      session,
    }),
    parse: parseSynologyDriveGetItemPayload,
  })

export const getSynologyDriveItemMetadata = async ({
  fileId,
  session,
}: {
  fileId: string
  session: SynologyDriveSession
}) =>
  mapSynologyDriveItemToMetadata(
    await getSynologyDriveItem({
      fileId,
      session,
    }),
  )

const isJsonContentType = (contentType: string | null | undefined) =>
  !!contentType && contentType.toLowerCase().includes("json")

const throwDownloadError = async (response: Response) => {
  const payload = parseSynologyDriveDownloadErrorPayload(await response.json())

  if (payload.success === false) {
    throw new Error(
      payload.error?.code
        ? `synology_drive_download_failed:${payload.error.code}`
        : "synology_drive_download_failed",
    )
  }

  throw new Error("synology_drive_download_failed")
}

export const downloadSynologyDriveStream = async ({
  fileId,
  session,
}: {
  fileId: string
  session: SynologyDriveSession
}) => {
  const urls = getSynologyDriveDownloadUrls({
    fileId,
    session,
  })

  let lastResponse: Response | undefined

  for (const url of urls) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/octet-stream",
      },
    })

    lastResponse = response

    if (!response.ok) {
      if (response.status === 404) {
        continue
      }

      throw new Error(
        `Synology Drive download failed with status ${response.status}`,
      )
    }

    if (isJsonContentType(response.headers.get("content-type"))) {
      await throwDownloadError(response)
    }

    if (!response.body) {
      throw new Error("synology_drive_download_empty_response")
    }

    return {
      // Node's fetch body is runtime-compatible with Readable.fromWeb, but the
      // DOM and node stream typings do not line up cleanly.
      stream: Readable.fromWeb(response.body as NodeReadableStream),
    }
  }

  throw new Error(
    `Synology Drive download failed with status ${lastResponse?.status ?? "unknown"}`,
  )
}

const toSynchronizeAbleItem = async ({
  connectorId,
  item,
  session,
}: {
  connectorId: string
  item: SynologyDriveItem
  session: SynologyDriveSession
}): Promise<SynchronizeAbleItem<"synology-drive"> | null> => {
  const fileId = getSynologyDriveItemFileId(item)

  if (!fileId) {
    return null
  }

  const metadata = mapSynologyDriveItemToMetadata(item)
  const modifiedAt = metadata.modifiedAt ?? new Date().toISOString()

  if (getSynologyDriveItemType(item) === "file") {
    return {
      linkData: {
        connectorId,
      },
      modifiedAt,
      name: getSynologyDriveItemName(item),
      resourceId: generateSynologyDriveResourceId({
        fileId,
      }),
      type: "file",
    }
  }

  const children = await listFolderItems({
    path: `id:${fileId}`,
    session,
  })
  const childItems = (
    await Promise.all(
      children.map((child) =>
        toSynchronizeAbleItem({
          connectorId,
          item: child,
          session,
        }),
      ),
    )
  ).filter(
    (child): child is SynchronizeAbleItem<"synology-drive"> => child !== null,
  )

  return {
    items: childItems,
    linkData: {
      connectorId,
    },
    modifiedAt,
    name: getSynologyDriveItemName(item),
    resourceId: generateSynologyDriveResourceId({
      fileId,
    }),
    type: "folder",
  }
}

export const getSynchronizeAbleDataSourceFromItems = async ({
  connectorId,
  items,
  session,
}: {
  connectorId: string
  items: readonly string[]
  session: SynologyDriveSession
}) => {
  const uniqueItems = Array.from(new Set(items))

  const synchronizeAbleItems = (
    await Promise.all(
      uniqueItems.map(async (fileId) => {
        const item = await getSynologyDriveItem({
          fileId,
          session,
        })

        return await toSynchronizeAbleItem({
          connectorId,
          item,
          session,
        })
      }),
    )
  ).filter(
    (item): item is SynchronizeAbleItem<"synology-drive"> => item !== null,
  )

  return {
    items: synchronizeAbleItems,
  }
}
