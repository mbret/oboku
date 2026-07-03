import { useQuery } from "@tanstack/react-query"
import {
  getWebConfigResponseSchema,
  type GetWebConfigResponse,
} from "@oboku/shared"
import { type HttpApiClientWeb, useHttpClientApi } from "../http"
import { API_QUERY_KEY_PREFIX } from "../queries/queryClient"
import {
  API_URL,
  API_URL_2,
  API_URL_3,
  API_URL_4,
  API_COUCH_URI,
  API_COUCH_URI_2,
  API_COUCH_URI_3,
  API_COUCH_URI_4,
} from "./envs"

const API_WEBDAV_URL = `${API_URL}/webdav`

const MINIMUM_TOKEN_VALIDITY_MS = 1000 * 60 * 5

const staticConfig = {
  API_URL: API_URL,
  API_URL_2,
  API_URL_3,
  API_URL_4,
  API_WEBDAV_URL,
  API_COUCH_URI,
  API_COUCH_URI_2,
  API_COUCH_URI_3,
  API_COUCH_URI_4,
  SEARCH_MAX_PREVIEW_ITEMS: 8,
  COLLECTION_EMPTY_ID: `oboku_dangling_books`,
  CLEANUP_DANGLING_LINKS_INTERVAL: 1000 * 60 * 10,
  MINIMUM_TOKEN_VALIDITY_MS,
}

type DerivedConfig = {
  GOOGLE_APP_ID: string | undefined
  FEATURE_GOOGLE_SIGN_ENABLED: boolean
  FEATURE_GOOGLE_DRIVE_ENABLED: boolean
  FEATURE_DROPBOX_ENABLED: boolean
  FEATURE_ONE_DRIVE_ENABLED: boolean
}

export type Config = typeof staticConfig & GetWebConfigResponse & DerivedConfig

/**
 * Consolidates the server response, the static build/env values and the flags
 * derived from them into a single config object. This is the single read
 * surface consumed through `useConfig` in React and the query cache.
 */
export const buildConfig = (server: GetWebConfigResponse): Config => {
  const googleAppId = server.GOOGLE_CLIENT_ID?.split("-")[0]

  return {
    ...staticConfig,
    ...server,
    GOOGLE_APP_ID: googleAppId,
    FEATURE_GOOGLE_SIGN_ENABLED: !!server.GOOGLE_CLIENT_ID,
    FEATURE_GOOGLE_DRIVE_ENABLED:
      !!server.GOOGLE_API_KEY && !!googleAppId && !!server.GOOGLE_CLIENT_ID,
    FEATURE_DROPBOX_ENABLED: !!server.DROPBOX_CLIENT_ID,
    FEATURE_ONE_DRIVE_ENABLED: !!server.MICROSOFT_APPLICATION_CLIENT_ID,
  }
}

export const webConfigQueryKey = [
  API_QUERY_KEY_PREFIX,
  "web",
  "config",
] as const

export const fetchConfig = async (
  httpClientApi: HttpApiClientWeb,
): Promise<Config> => {
  const { data } = await httpClientApi.fetchOrThrow<GetWebConfigResponse>(
    `${API_URL}/web/config`,
  )

  return buildConfig(getWebConfigResponseSchema.parse(data))
}

/**
 * Reads the web config from the persisted query cache. The `api` key prefix
 * opts it into that cache (see queries/QueryClientProvider), giving the same
 * cache-first behavior the previous localStorage cache provided. `gcTime` must
 * stay non-zero (the provider default is 0) so the result is retained and
 * persisted.
 *
 * Config is deployment-level data that never changes within a session, so reads
 * are static: consumers never refetch on mount, focus or reconnect. The
 * once-per-boot background refresh is confined to the boot boundary
 * (`LoadConfiguration`) via `refetchOnMount: "always"`. When the cache is empty
 * (fresh install) react-query still performs the initial fetch regardless of
 * `refetchOnMount`.
 */
export const useConfig = ({
  refetchOnMount = false,
}: {
  refetchOnMount?: boolean | "always"
} = {}) => {
  const httpClientApi = useHttpClientApi()

  return useQuery({
    queryKey: webConfigQueryKey,
    queryFn: () => fetchConfig(httpClientApi),
    networkMode: "always",
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    meta: { persistAcrossSessions: true, alwaysPersist: true },
  })
}
