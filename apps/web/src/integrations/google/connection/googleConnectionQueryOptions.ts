import { queryOptions } from "@tanstack/react-query"
import { googleConnectionGet } from "@oboku/shared"
import type { HttpApiClientWeb } from "../../../http"
import { API_QUERY_KEY_PREFIX } from "../../../queries/queryClient"

export const createGoogleConnectionQueryOptions = ({
  httpClientApi,
  profileId,
}: {
  httpClientApi: HttpApiClientWeb
  profileId: string | undefined
}) =>
  queryOptions({
    queryKey: [API_QUERY_KEY_PREFIX, "google-connection", profileId],
    queryFn: async function fetchGoogleConnection({ signal }) {
      const { data } = await googleConnectionGet({
        client: httpClientApi.sdkClient,
        signal,
      })

      return data
    },
    gcTime: 5 * 60 * 1000,
  })
