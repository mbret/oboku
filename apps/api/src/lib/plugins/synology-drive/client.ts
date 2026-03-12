import { generateSynologyDriveResourceId, isFileSupported } from "@oboku/shared"
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
import axios, { AxiosResponse } from "axios"
import type { Readable } from "node:stream"
import { text as readText } from "node:stream/consumers"
import type { SynchronizeAbleItem } from "src/lib/plugins/types"
import { getHttpsAgent } from "../../http/httpsAgent"

type SynologyDriveRequestSession = SynologyDriveSession & {
  allowSelfSigned?: boolean
}

const SYNOLOGY_DRIVE_SYNC_CONCURRENCY = 2

const isAxiosNetworkError = (error: unknown) =>
  axios.isAxiosError(error) && !error.response

const mapWithConcurrency = async <TInput, TOutput>(
  items: readonly TInput[],
  mapper: (item: TInput) => Promise<TOutput>,
  concurrency: number,
) => {
  const results: TOutput[] = []
  let index = 0

  const worker = async () => {
    while (index < items.length) {
      const currentIndex = index
      index += 1
      results[currentIndex] = await mapper(items[currentIndex] as TInput)
    }
  }

  const workerCount = Math.min(concurrency, items.length)

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker()
    }),
  )

  return results
}

const isSupportedSynologyDriveItem = (item: SynologyDriveItem) => {
  const metadata = mapSynologyDriveItemToMetadata(item)

  return isFileSupported({
    mimeType: metadata.contentType,
    name: metadata.name,
  })
}

const requestJson = async <T>({
  allowSelfSigned,
  baseUrl,
  endpoint = "entry.cgi",
  params,
  parse,
}: {
  allowSelfSigned?: boolean
  baseUrl: string
  endpoint?: "auth.cgi" | "entry.cgi"
  params: URLSearchParams
  parse: (payload: unknown) => T
}) => {
  const urls = buildApiUrls(baseUrl, endpoint)
  let lastStatus: number | undefined
  let lastError: Error | undefined

  for (const url of urls) {
    url.search = params.toString()

    let response: AxiosResponse<unknown>

    try {
      response = await axios.get(url.toString(), {
        headers: {
          Accept: "application/json",
        },
        httpsAgent: getHttpsAgent(allowSelfSigned),
        validateStatus: () => true,
      })
    } catch (error) {
      if (isAxiosNetworkError(error)) {
        lastError = new Error(
          `Synology Drive request failed for ${url.origin}: ${axios.isAxiosError(error) ? error.message : "network error"}`,
        )
        continue
      }

      throw error
    }

    lastStatus = response.status

    if (response.status >= 200 && response.status < 300) {
      return parse(response.data)
    }

    if (response.status !== 404) {
      throw new Error(
        `Synology Drive request failed with status ${response.status}`,
      )
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error(
    `Synology Drive request failed with status ${lastStatus ?? "unknown"}`,
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
  options?: { allowSelfSigned?: boolean },
): Promise<SynologyDriveRequestSession> => {
  const { sid } = await requestJson({
    allowSelfSigned: options?.allowSelfSigned,
    baseUrl: auth.baseUrl,
    endpoint: "auth.cgi",
    params: buildSynologyDriveLoginParams(auth),
    parse: parseSynologyDriveLoginPayload,
  })

  return {
    allowSelfSigned: options?.allowSelfSigned,
    auth,
    sid,
  }
}

export const getSynologyDriveSession = async ({
  connector,
  providerCredentials,
}: {
  connector: { allowSelfSigned?: boolean; url: string; username: string }
  providerCredentials: SynologyDriveApiCredentials
}) =>
  signInSynologyDrive(toSessionAuth(providerCredentials, connector), {
    allowSelfSigned: connector.allowSelfSigned,
  })

const listFolderItems = async ({
  path,
  session,
}: {
  path: string
  session: SynologyDriveRequestSession
}) =>
  requestJson({
    allowSelfSigned: session.allowSelfSigned,
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
  session: SynologyDriveRequestSession
}) =>
  requestJson({
    allowSelfSigned: session.allowSelfSigned,
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
  session: SynologyDriveRequestSession
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
  session: SynologyDriveRequestSession
}) =>
  requestJson({
    allowSelfSigned: session.allowSelfSigned,
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
  session: SynologyDriveRequestSession
}) =>
  mapSynologyDriveItemToMetadata(
    await getSynologyDriveItem({
      fileId,
      session,
    }),
  )

const isJsonContentType = (contentType: string | null | undefined) =>
  !!contentType && contentType.toLowerCase().includes("json")

const throwDownloadError = (payload: unknown) => {
  const parsedPayload = parseSynologyDriveDownloadErrorPayload(payload)

  if (parsedPayload.success === false) {
    throw new Error(
      parsedPayload.error?.code
        ? `synology_drive_download_failed:${parsedPayload.error.code}`
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
  session: SynologyDriveRequestSession
}) => {
  const urls = getSynologyDriveDownloadUrls({
    fileId,
    session,
  })

  let lastStatus: number | undefined
  let lastError: Error | undefined

  for (const url of urls) {
    let response: AxiosResponse<Readable>

    try {
      response = await axios.get<Readable>(url.toString(), {
        headers: {
          Accept: "application/octet-stream",
        },
        httpsAgent: getHttpsAgent(session.allowSelfSigned),
        responseType: "stream",
        validateStatus: () => true,
      })
    } catch (error) {
      if (isAxiosNetworkError(error)) {
        lastError = new Error(
          `Synology Drive download failed for ${new URL(url).origin}: ${axios.isAxiosError(error) ? error.message : "network error"}`,
        )
        continue
      }

      throw error
    }

    lastStatus = response.status

    if (response.status < 200 || response.status >= 300) {
      if (response.status === 404) {
        continue
      }

      throw new Error(
        `Synology Drive download failed with status ${response.status}`,
      )
    }

    const contentTypeHeader = response.headers["content-type"]
    const contentType = Array.isArray(contentTypeHeader)
      ? contentTypeHeader[0]
      : contentTypeHeader

    if (isJsonContentType(contentType)) {
      throwDownloadError(JSON.parse(await readText(response.data)))
    }

    return {
      stream: response.data,
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error(
    `Synology Drive download failed with status ${lastStatus ?? "unknown"}`,
  )
}

const toSynchronizeAbleItem = async ({
  connectorId,
  item,
  session,
}: {
  connectorId: string
  item: SynologyDriveItem
  session: SynologyDriveRequestSession
}): Promise<SynchronizeAbleItem<"synology-drive"> | null> => {
  const fileId = getSynologyDriveItemFileId(item)

  if (!fileId) {
    return null
  }

  const metadata = mapSynologyDriveItemToMetadata(item)
  const modifiedAt = metadata.modifiedAt ?? new Date().toISOString()

  if (getSynologyDriveItemType(item) === "file") {
    if (!isSupportedSynologyDriveItem(item)) {
      return null
    }

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
    await mapWithConcurrency(
      children,
      async (child) =>
        toSynchronizeAbleItem({
          connectorId,
          item: child,
          session,
        }),
      SYNOLOGY_DRIVE_SYNC_CONCURRENCY,
    )
  ).filter(
    (child): child is SynchronizeAbleItem<"synology-drive"> => child !== null,
  )

  if (childItems.length === 0) {
    return null
  }

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
  session: SynologyDriveRequestSession
}) => {
  const uniqueItems = Array.from(new Set(items))

  const synchronizeAbleItems = (
    await mapWithConcurrency(
      uniqueItems,
      async (fileId) => {
        const item = await getSynologyDriveItem({
          fileId,
          session,
        })

        return await toSynchronizeAbleItem({
          connectorId,
          item,
          session,
        })
      },
      SYNOLOGY_DRIVE_SYNC_CONCURRENCY,
    )
  ).filter(
    (item): item is SynchronizeAbleItem<"synology-drive"> => item !== null,
  )

  return {
    items: synchronizeAbleItems,
  }
}
