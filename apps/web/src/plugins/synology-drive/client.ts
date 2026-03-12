import {
  type SynologyDriveApiCredentials,
  browseSynologyDriveItems as browseSynologyDriveItemsShared,
  buildApiUrls,
  buildSynologyDriveGetItemParams as buildSynologyDriveGetItemParamsShared,
  buildSynologyDriveLoginParams,
  getSynologyDriveDownloadUrls as getSynologyDriveDownloadUrlsShared,
  mapSynologyDriveItemToBrowseItem,
  parseSynologyDriveGetItemPayload,
  parseSynologyDriveListPagePayload,
  parseSynologyDriveLoginPayload,
  type SynologyDriveBrowseNodeId,
  type SynologyDriveSession as SharedSynologyDriveSession,
  type SynologyDriveSessionAuth as SharedSynologyDriveSessionAuth,
} from "@oboku/synology"

type SynologyDriveStoredSessionAuth = Omit<
  SharedSynologyDriveSessionAuth,
  keyof SynologyDriveApiCredentials
>

export type SynologyDriveSession = Omit<SharedSynologyDriveSession, "auth"> & {
  auth: SynologyDriveStoredSessionAuth
  connectorId?: string
  createdAt?: string
  passwordAsSecretId?: string
}

export class SynologyDriveAuthenticationError extends Error {
  constructor(public readonly status: number) {
    super(`Synology Drive request failed with status ${status}`)
    this.name = "SynologyDriveAuthenticationError"
  }
}

export const isSynologyDriveAuthenticationError = (
  error: unknown,
): error is SynologyDriveAuthenticationError =>
  error instanceof SynologyDriveAuthenticationError

const toSharedSynologyDriveSession = (
  session: SynologyDriveSession,
): SharedSynologyDriveSession => ({
  // The shared helpers only use baseUrl + sid after login; keep password redacted.
  auth: {
    ...session.auth,
    password: "",
  },
  sid: session.sid,
})

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
  let lastError: Error | undefined

  for (const url of urls) {
    url.search = params.toString()

    try {
      const response = await fetch(url, {
        credentials: "omit",
        headers: {
          Accept: "application/json",
        },
      })

      lastResponse = response

      if (response.ok) {
        return parse(await response.json())
      }

      if (response.status === 401 || response.status === 403) {
        throw new SynologyDriveAuthenticationError(response.status)
      }

      if (response.status !== 404) {
        throw new Error(
          `Synology Drive request failed with status ${response.status}`,
        )
      }
    } catch (error) {
      if (error instanceof Error && error.name === "TypeError") {
        lastError = new Error(
          "The browser could not reach your Synology NAS directly. Check the NAS URL, HTTPS certificate trust, and CORS configuration.",
        )
        continue
      }

      throw error
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error(
    `Synology Drive request failed with status ${lastResponse?.status ?? "unknown"}`,
  )
}

export const getSynologyDriveBrowseItem = async ({
  fileId,
  session,
}: {
  fileId: string
  session: SynologyDriveSession
}) =>
  requestJson({
    baseUrl: session.auth.baseUrl,
    params: buildSynologyDriveGetItemParamsShared({
      fileId,
      session: toSharedSynologyDriveSession(session),
    }),
    parse: (payload) =>
      mapSynologyDriveItemToBrowseItem(
        parseSynologyDriveGetItemPayload(payload),
      ),
  })

export const getSynologyDriveDownloadUrls = ({
  fileId,
  session,
}: {
  fileId: string
  session: SynologyDriveSession
}) =>
  getSynologyDriveDownloadUrlsShared({
    fileId,
    session: toSharedSynologyDriveSession(session),
  })

export const signInSynologyDrive = async (
  auth: SharedSynologyDriveSessionAuth,
): Promise<SynologyDriveSession> => {
  const { sid } = await requestJson({
    baseUrl: auth.baseUrl,
    endpoint: "auth.cgi",
    params: buildSynologyDriveLoginParams(auth),
    parse: parseSynologyDriveLoginPayload,
  })

  return {
    auth: {
      baseUrl: auth.baseUrl,
      username: auth.username,
    },
    sid,
  }
}

export const browseSynologyDrive = async ({
  nodeId,
  session,
}: {
  nodeId?: SynologyDriveBrowseNodeId
  session: SynologyDriveSession
}) => ({
  items: await browseSynologyDriveItemsShared({
    nodeId,
    requestPage: (params: URLSearchParams) =>
      requestJson({
        baseUrl: session.auth.baseUrl,
        params,
        parse: parseSynologyDriveListPagePayload,
      }),
    session: toSharedSynologyDriveSession(session),
  }),
})
