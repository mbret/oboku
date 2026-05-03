import { z } from "zod"

export type SynologyDriveApiCredentials = {
  otpCode?: string
  password: string
}

export type SynologyDriveSessionAuth = SynologyDriveApiCredentials & {
  baseUrl: string
  username: string
}

export type SynologyDriveBrowseNodeId =
  | `root:${"my-drive" | "team-folders"}`
  | `folder:${string}`
  | `file:${string}`

export type SynologyDriveBrowseItem = {
  fileId?: string
  hasChildren: boolean
  id: SynologyDriveBrowseNodeId
  name: string
  path?: string
  type: "file" | "folder"
}

export type SynologyDriveListPage = {
  items: SynologyDriveItem[]
  total?: number
}

type SynologyDriveListPageRequest = (
  params: URLSearchParams,
) => Promise<SynologyDriveListPage>

export const normalizeSynologyDriveBaseUrl = (baseUrl: string) => {
  const url = new URL(baseUrl)

  url.pathname = url.pathname.replace(/\/+$/, "")
  url.search = ""
  url.hash = ""

  return url.toString().replace(/\/+$/, "")
}

export type SynologyDriveSession = {
  auth: SynologyDriveSessionAuth
  sid: string
}

export const SYNOLOGY_DRIVE_AUTH_VERSION = "6"
export const SYNOLOGY_DRIVE_FILES_LIST_VERSION = "2"
export const SYNOLOGY_DRIVE_FILES_GET_VERSION = "3"
export const SYNOLOGY_DRIVE_FILES_DOWNLOAD_VERSION = "2"
export const SYNOLOGY_DRIVE_TEAM_FOLDERS_VERSION = "1"
export const SYNOLOGY_DRIVE_LIST_PAGE_LIMIT = 1000

const synologyDriveNumberLikeSchema = z.union([z.number(), z.string()])

export const synologyDriveItemSchema = z
  .object({
    display_path: z.string().optional(),
    file_id: synologyDriveNumberLikeSchema.optional(),
    id: synologyDriveNumberLikeSchema.optional(),
    is_dir: z.boolean().optional(),
    mime_type: z.string().optional(),
    modified_at: synologyDriveNumberLikeSchema.optional(),
    mtime: synologyDriveNumberLikeSchema.optional(),
    name: z.string().optional(),
    node_type: z.string().optional(),
    path: z.string().optional(),
    permanent_id: synologyDriveNumberLikeSchema.optional(),
    size: z.number().optional(),
    type: z.string().optional(),
  })
  .passthrough()

export type SynologyDriveItem = z.infer<typeof synologyDriveItemSchema>

const synologyDriveErrorSchema = z
  .object({
    code: z.number().optional(),
    errors: z.array(z.unknown()).optional(),
  })
  .partial()

const synologyDriveDownloadErrorSchema = z
  .object({
    error: z
      .object({
        code: z.number().optional(),
      })
      .partial()
      .optional(),
    success: z.boolean().optional(),
  })
  .passthrough()

const createSynologyDriveResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.union([
    z.object({
      data: dataSchema,
      success: z.literal(true),
    }),
    z.object({
      error: synologyDriveErrorSchema.optional(),
      success: z.literal(false),
    }),
  ])

const parseSynologyDriveResponseData = <T>(
  payload: unknown,
  dataSchema: z.ZodType<T>,
) => {
  const response = createSynologyDriveResponseSchema(dataSchema).parse(payload)

  if (!response.success) {
    throw new Error(
      response.error?.code
        ? `synology_drive_request_failed:${response.error.code}`
        : "synology_drive_request_failed",
    )
  }

  return response.data
}

const synologyDriveListDataSchema = z
  .object({
    items: z.array(synologyDriveItemSchema).optional(),
    list: z.array(synologyDriveItemSchema).optional(),
    total: z.number().optional(),
  })
  .passthrough()

const synologyDriveGetDataSchema = synologyDriveItemSchema.extend({
  items: z.array(synologyDriveItemSchema).optional(),
})

const synologyDriveLoginDataSchema = z.object({
  sid: z.string(),
})

export const buildApiUrls = (
  baseUrl: string,
  endpoint: "auth.cgi" | "entry.cgi",
) => {
  const normalizedBaseUrl = normalizeSynologyDriveBaseUrl(baseUrl)
  const primaryUrl = new URL(
    `./webapi/${endpoint}`,
    normalizedBaseUrl.endsWith("/")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/`,
  )
  const rootUrl = new URL(normalizedBaseUrl)
  const fallbackUrl = new URL(`/webapi/${endpoint}`, rootUrl.origin)

  if (primaryUrl.toString() === fallbackUrl.toString()) {
    return [primaryUrl]
  }

  return [primaryUrl, fallbackUrl]
}

export const buildSynologyDriveLoginParams = (
  auth: SynologyDriveSessionAuth,
) => {
  /**
   * Synology Drive login currently sends credentials as query parameters.
   *
   * Why this is intentional:
   * - The browser flow talks directly to the NAS, not to our API.
   * - For `SYNO.API.Auth`, we only rely on the URL-parameter form that we have
   *   observed working against target NAS instances.
   * - We do not currently have a verified contract showing that the same
   *   endpoint accepts credentials in a POST body for the Synology Drive flow.
   *
   * Why we keep it centralized here:
   * - This makes the transport choice explicit and easy to revisit.
   * - If we later validate a safer body-based contract on real NAS targets, we
   *   should change this helper in one place instead of having multiple ad hoc
   *   request shapes across the app.
   *
   * Security note:
   * - Query parameters are less desirable because they can appear in browser
   *   tooling, proxy logs, or NAS logs.
   * - Until we have a verified alternative, compatibility with the NAS login
   *   endpoint takes priority here.
   */
  const params = new URLSearchParams({
    account: auth.username,
    api: "SYNO.API.Auth",
    format: "sid",
    method: "login",
    passwd: auth.password,
    session: "SynologyDrive",
    version: SYNOLOGY_DRIVE_AUTH_VERSION,
  })

  if (auth.otpCode) {
    params.set("otp_code", auth.otpCode)
  }

  return params
}

const withSessionParams = (
  session: SynologyDriveSession,
  params: Record<string, string>,
) =>
  /**
   * Synology Drive follow-up requests currently keep `_sid` in query params for
   * the same reason as login: this is the contract shape we have validated for
   * the direct-to-NAS browser flow.
   *
   * Do not silently move `_sid` into headers or request bodies unless that
   * behavior has been confirmed against real Synology Drive endpoints.
   * If a safer transport is validated later, update this helper so all request
   * builders move together.
   */
  new URLSearchParams({
    ...params,
    _sid: session.sid,
  })

export const buildSynologyDriveListFolderParams = ({
  limit = SYNOLOGY_DRIVE_LIST_PAGE_LIMIT,
  offset = 0,
  path,
  session,
}: {
  limit?: number
  offset?: number
  path: string
  session: SynologyDriveSession
}) =>
  withSessionParams(session, {
    api: "SYNO.SynologyDrive.Files",
    limit: `${limit}`,
    method: "list",
    offset: `${offset}`,
    path,
    sort_by: "name",
    sort_direction: "ASC",
    version: SYNOLOGY_DRIVE_FILES_LIST_VERSION,
  })

export const buildSynologyDriveListTeamFoldersParams = ({
  limit = SYNOLOGY_DRIVE_LIST_PAGE_LIMIT,
  offset = 0,
  session,
}: {
  limit?: number
  offset?: number
  session: SynologyDriveSession
}) =>
  withSessionParams(session, {
    api: "SYNO.SynologyDrive.TeamFolders",
    limit: `${limit}`,
    method: "list",
    offset: `${offset}`,
    sort_by: "name",
    sort_direction: "ASC",
    version: SYNOLOGY_DRIVE_TEAM_FOLDERS_VERSION,
  })

export const normalizeSynologyDriveFileId = (fileId: string) => {
  const value = fileId.replace(/^id:/, "")

  if (!value.includes(":")) {
    return value
  }

  return value.split(":").at(-1) ?? value
}

export const buildSynologyDriveGetItemParams = ({
  fileId,
  session,
}: {
  fileId: string
  session: SynologyDriveSession
}) =>
  withSessionParams(session, {
    api: "SYNO.SynologyDrive.Files",
    method: "get",
    path: `id:${normalizeSynologyDriveFileId(fileId)}`,
    version: SYNOLOGY_DRIVE_FILES_GET_VERSION,
  })

export const getSynologyDriveDownloadUrls = ({
  fileId,
  session,
}: {
  fileId: string
  session: SynologyDriveSession
}) => {
  const normalizedFileId = normalizeSynologyDriveFileId(fileId)

  return buildApiUrls(session.auth.baseUrl, "entry.cgi").map((url) => {
    const downloadUrl = new URL(url)

    downloadUrl.search = withSessionParams(session, {
      api: "SYNO.SynologyDrive.Files",
      files: JSON.stringify([`id:${normalizedFileId}`]),
      force_download: "true",
      method: "download",
      version: SYNOLOGY_DRIVE_FILES_DOWNLOAD_VERSION,
    }).toString()

    return downloadUrl.toString()
  })
}

export const parseSynologyDriveLoginPayload = (payload: unknown) =>
  parseSynologyDriveResponseData(payload, synologyDriveLoginDataSchema)

export const parseSynologyDriveListPagePayload = (
  payload: unknown,
): SynologyDriveListPage => {
  const data = parseSynologyDriveResponseData(
    payload,
    synologyDriveListDataSchema,
  )

  return {
    items: data.items ?? data.list ?? [],
    ...(data.total !== undefined ? { total: data.total } : {}),
  }
}

export const parseSynologyDriveListItemsPayload = (payload: unknown) =>
  parseSynologyDriveListPagePayload(payload).items

export const listAllSynologyDriveItems = async ({
  buildParams,
  requestPage,
  session,
}: {
  buildParams: (pagination: {
    limit: number
    offset: number
    session: SynologyDriveSession
  }) => URLSearchParams
  requestPage: SynologyDriveListPageRequest
  session: SynologyDriveSession
}) => {
  const items: SynologyDriveItem[] = []
  let offset = 0

  while (true) {
    const page = await requestPage(
      buildParams({
        limit: SYNOLOGY_DRIVE_LIST_PAGE_LIMIT,
        offset,
        session,
      }),
    )

    items.push(...page.items)

    if (page.items.length < SYNOLOGY_DRIVE_LIST_PAGE_LIMIT) {
      return items
    }

    if (page.total !== undefined && offset + page.items.length >= page.total) {
      return items
    }

    offset += page.items.length
  }
}

export const listAllSynologyDriveFolderItems = async ({
  path,
  requestPage,
  session,
}: {
  path: string
  requestPage: SynologyDriveListPageRequest
  session: SynologyDriveSession
}) =>
  listAllSynologyDriveItems({
    buildParams: ({ limit, offset, session }) =>
      buildSynologyDriveListFolderParams({
        limit,
        offset,
        path,
        session,
      }),
    requestPage,
    session,
  })

export const listAllSynologyDriveTeamFolderItems = async ({
  requestPage,
  session,
}: {
  requestPage: SynologyDriveListPageRequest
  session: SynologyDriveSession
}) =>
  listAllSynologyDriveItems({
    buildParams: ({ limit, offset, session }) =>
      buildSynologyDriveListTeamFoldersParams({
        limit,
        offset,
        session,
      }),
    requestPage,
    session,
  })

export const browseSynologyDriveItems = async ({
  nodeId,
  requestPage,
  session,
}: {
  nodeId?: SynologyDriveBrowseNodeId
  requestPage: SynologyDriveListPageRequest
  session: SynologyDriveSession
}): Promise<SynologyDriveBrowseItem[]> => {
  if (!nodeId) {
    const teamFolders = await listAllSynologyDriveTeamFolderItems({
      requestPage,
      session,
    }).catch(() => [])

    return buildSynologyDriveRootBrowseItems({
      hasTeamFolders: teamFolders.length > 0,
    })
  }

  if (nodeId === "root:my-drive") {
    return (
      await listAllSynologyDriveFolderItems({
        path: "/mydrive/",
        requestPage,
        session,
      })
    ).map(mapSynologyDriveItemToBrowseItem)
  }

  if (nodeId === "root:team-folders") {
    return (
      await listAllSynologyDriveTeamFolderItems({
        requestPage,
        session,
      })
    ).map(mapSynologyDriveItemToBrowseItem)
  }

  if (nodeId.startsWith("folder:")) {
    return (
      await listAllSynologyDriveFolderItems({
        path: `id:${nodeId.replace("folder:", "")}`,
        requestPage,
        session,
      })
    ).map(mapSynologyDriveItemToBrowseItem)
  }

  return []
}

export const parseSynologyDriveGetItemPayload = (payload: unknown) => {
  const data = parseSynologyDriveResponseData(
    payload,
    synologyDriveGetDataSchema,
  )

  return data.items?.[0] ?? data
}

export const parseSynologyDriveDownloadErrorPayload = (payload: unknown) =>
  synologyDriveDownloadErrorSchema.parse(payload)

/**
 * Predicate used by Synology Drive download flows to detect when the NAS has
 * returned a JSON error envelope instead of the requested binary blob/stream.
 *
 * Lives here so the web (`fetch`/blob) and api (`axios`/stream) clients agree
 * on the content-type heuristic.
 */
export const isSynologyDriveJsonContentType = (
  contentType: string | null | undefined,
) => !!contentType && contentType.toLowerCase().includes("json")

export const buildSynologyDriveRootBrowseItems = ({
  hasTeamFolders,
}: {
  hasTeamFolders: boolean
}): SynologyDriveBrowseItem[] => [
  {
    hasChildren: true,
    id: "root:my-drive",
    name: "My Drive",
    type: "folder",
  },
  ...(hasTeamFolders
    ? [
        {
          hasChildren: true,
          id: "root:team-folders",
          name: "Team Folders",
          type: "folder",
        } satisfies SynologyDriveBrowseItem,
      ]
    : []),
]

export const getSynologyDriveItemType = (
  item: SynologyDriveItem,
): SynologyDriveBrowseItem["type"] =>
  item.is_dir || item.type === "dir" || item.node_type === "dir"
    ? "folder"
    : "file"

export const getSynologyDriveItemFileId = (item: SynologyDriveItem) =>
  normalizeSynologyDriveFileId(
    `${item.file_id ?? item.permanent_id ?? item.id ?? ""}`,
  )

export const getSynologyDriveItemPath = (item: SynologyDriveItem) =>
  item.display_path ?? item.path

export const getSynologyDriveItemName = (item: SynologyDriveItem) => {
  if (item.name) return item.name

  const path = getSynologyDriveItemPath(item)

  if (!path) return "unknown"

  return path.split("/").filter(Boolean).at(-1) ?? "unknown"
}

export const mapSynologyDriveItemToBrowseItem = (
  item: SynologyDriveItem,
): SynologyDriveBrowseItem => {
  const type = getSynologyDriveItemType(item)
  const fileId = getSynologyDriveItemFileId(item)
  const path = getSynologyDriveItemPath(item)

  return {
    fileId,
    hasChildren: type === "folder",
    id: `${type === "folder" ? "folder" : "file"}:${fileId}`,
    name: getSynologyDriveItemName(item),
    type,
    ...(path !== undefined ? { path } : {}),
  }
}

export const toSynologyDriveModifiedAt = (
  value: number | string | undefined,
) => {
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString()
  }

  if (typeof value === "string") {
    const numericValue = Number(value)

    if (!Number.isNaN(numericValue)) {
      return new Date(numericValue * 1000).toISOString()
    }

    const dateValue = new Date(value)

    if (!Number.isNaN(dateValue.getTime())) {
      return dateValue.toISOString()
    }
  }

  return undefined
}

export const mapSynologyDriveItemToMetadata = (item: SynologyDriveItem) => ({
  canDownload: getSynologyDriveItemType(item) === "file",
  contentType: item.mime_type,
  modifiedAt: toSynologyDriveModifiedAt(item.modified_at ?? item.mtime),
  name: getSynologyDriveItemName(item),
  size: item.size,
  type: getSynologyDriveItemType(item),
})
