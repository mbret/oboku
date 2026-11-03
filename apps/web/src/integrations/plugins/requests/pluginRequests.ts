import type { DataSourceDocType } from "@oboku/shared"
import type { MutationMeta, UseMutationOptions } from "@tanstack/react-query"
import { signal } from "reactjrx"
import { isPluginType } from "../configure"
import type {
  ProviderCredentialsResult,
  UseRefreshMetadataRequest,
} from "../types"

type RequestSettlers = {
  id: string
  resolve: (result: ProviderCredentialsResult) => void
  reject: (error: unknown) => void
}

export type PluginRequest = RequestSettlers &
  (
    | { kind: "synchronize"; dataSource: DataSourceDocType }
    | {
        kind: "refreshMetadata"
        variables: UseRefreshMetadataRequest
        meta: MutationMeta | undefined
      }
  )

export const pluginRequestsSignal = signal<readonly PluginRequest[]>({
  default: [],
})

function requestCredentials(
  createRequest: (settlers: RequestSettlers) => PluginRequest,
) {
  const { promise, resolve, reject } =
    Promise.withResolvers<ProviderCredentialsResult>()
  const request = createRequest({ id: crypto.randomUUID(), resolve, reject })

  pluginRequestsSignal.update(function appendRequest(requests) {
    return [...requests, request]
  })

  return promise.finally(function dropSettledRequest() {
    pluginRequestsSignal.update(function withoutSettledRequest(requests) {
      return requests.filter((item) => item !== request)
    })
  })
}

/** Gets the provider credentials that syncing this data source needs, from its plugin. */
export async function synchronizeWithPlugin(dataSource: DataSourceDocType) {
  if (!isPluginType(dataSource.type)) {
    throw new Error(`Unsupported data source type: ${dataSource.type}`)
  }

  return requestCredentials(function createSynchronizeRequest(settlers) {
    return { ...settlers, kind: "synchronize", dataSource }
  })
}

/** Gets the provider credentials that refreshing this link's metadata needs, from its plugin. */
export async function refreshMetadataWithPlugin(
  variables: UseRefreshMetadataRequest,
  options?: Pick<UseMutationOptions, "meta">,
) {
  if (!isPluginType(variables.linkType)) {
    throw new Error(`Unsupported link type: ${variables.linkType}`)
  }

  return requestCredentials(function createRefreshMetadataRequest(settlers) {
    return {
      ...settlers,
      kind: "refreshMetadata",
      variables,
      meta: options?.meta,
    }
  })
}
