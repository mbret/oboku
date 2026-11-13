import { useQuery } from "@tanstack/react-query"
import { useQueryOptionsWithAuthentication } from "../../../auth"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { createGoogleConnectionQueryOptions } from "./googleConnectionQueryOptions"

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
