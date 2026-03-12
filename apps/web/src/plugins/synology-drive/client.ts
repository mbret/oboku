import {
  browseSynologyDriveItems,
  buildApiUrls,
  buildSynologyDriveGetItemParams,
  buildSynologyDriveLoginParams,
  mapSynologyDriveItemToBrowseItem,
  parseSynologyDriveGetItemPayload,
  parseSynologyDriveListPagePayload,
  parseSynologyDriveLoginPayload,
  type SynologyDriveBrowseNodeId,
  type SynologyDriveSession as SharedSynologyDriveSession,
  type SynologyDriveSessionAuth,
} from "@oboku/synology"

export type SynologyDriveSession = SharedSynologyDriveSession & {
  connectorId?: string
  createdAt?: string
}

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
    params: buildSynologyDriveGetItemParams({
      fileId,
      session,
    }),
    parse: (payload) =>
      mapSynologyDriveItemToBrowseItem(
        parseSynologyDriveGetItemPayload(payload),
      ),
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

export const browseSynologyDrive = async ({
  nodeId,
  session,
}: {
  nodeId?: SynologyDriveBrowseNodeId
  session: SynologyDriveSession
}) => ({
  items: await browseSynologyDriveItems({
    nodeId,
    requestPage: (params: URLSearchParams) =>
      requestJson({
        baseUrl: session.auth.baseUrl,
        params,
        parse: parseSynologyDriveListPagePayload,
      }),
    session,
  }),
})
