import { queryOptions, useQuery } from "@tanstack/react-query"
import { googleConnectionGet } from "@oboku/shared"
import { useQueryOptionsWithAuthentication } from "../../../auth"
import { type HttpApiClientWeb, useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { googleConnectionQueryKey } from "./queryKeys"

const createGoogleConnectionQueryOptions = ({
  httpClientApi,
  profileId,
}: {
  httpClientApi: HttpApiClientWeb
  profileId: string | undefined
}) =>
  queryOptions({
    queryKey: googleConnectionQueryKey(profileId),
    queryFn: async function fetchGoogleConnection({ signal }) {
      const { data } = await googleConnectionGet({
        client: httpClientApi.sdkClient,
        signal,
      })

      return data
    },
    gcTime: 5 * 60 * 1000,
  })

export const useGoogleConnection = () => {
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()

  return useQuery(
    useQueryOptionsWithAuthentication(
      createGoogleConnectionQueryOptions({
        httpClientApi,
        profileId: activeProfileId,
      }),
    ),
  )
}
