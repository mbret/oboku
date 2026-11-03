import type { DataSourceDocType, DataSourceType } from "@oboku/shared"
import type { MutationMeta } from "@tanstack/react-query"
import { type ComponentType, useEffect } from "react"
import { scheduleDelayedEffect } from "../../../common/useDelayEffect"
import type {
  ObokuPlugin,
  ProviderCredentialsResult,
  UseRefreshMetadataVariables,
} from "../types"
import { useRequestPopupDialog } from "../useRequestPopupDialog"

type RequestCallbacks<T extends DataSourceType> = {
  onResolve: (result: ProviderCredentialsResult<T>) => void
  onReject: (error: unknown) => void
}

export type SynchronizeRequestProps<T extends DataSourceType> =
  RequestCallbacks<T> & {
    dataSource: Extract<DataSourceDocType, { type: T }>
  }

export type RefreshMetadataRequestProps<T extends DataSourceType> =
  RequestCallbacks<T> & {
    variables: UseRefreshMetadataVariables<T>
    meta: MutationMeta | undefined
  }

export type RegisteredPlugin<T extends DataSourceType> = ObokuPlugin<T> & {
  SynchronizeRequest: ComponentType<SynchronizeRequestProps<T>>
  RefreshMetadataRequest: ComponentType<RefreshMetadataRequestProps<T>>
}

/**
 * Starts `request` once the component is mounted and hands its outcome to the
 * callbacks. The start waits a tick, so StrictMode's first mount, which is
 * unmounted at once, never starts it.
 */
function useStartOnceMounted<Variables, Result>(
  request: (variables: Variables) => Promise<Result>,
  variables: Variables,
  {
    onResolve,
    onReject,
  }: RequestCallbacks<DataSourceType> & {
    onResolve: (result: Result) => void
  },
) {
  useEffect(
    function startOnceMounted() {
      return scheduleDelayedEffect(function startRequest() {
        request(variables).then(onResolve, onReject)
      }, 1)
    },
    [request, variables, onResolve, onReject],
  )
}

/**
 * Adds the components that run the plugin's sync and metadata refresh hooks
 * for one request each.
 */
export function registerPlugin<T extends DataSourceType>(
  plugin: ObokuPlugin<T>,
): RegisteredPlugin<T> {
  function SynchronizeRequest({
    dataSource,
    ...callbacks
  }: SynchronizeRequestProps<T>) {
    const requestPopup = useRequestPopupDialog(plugin.name)
    const { mutateAsync: synchronize } = plugin.useSynchronize({
      requestPopup,
    })

    useStartOnceMounted(synchronize, dataSource, callbacks)

    return null
  }

  function RefreshMetadataRequest({
    variables,
    meta,
    ...callbacks
  }: RefreshMetadataRequestProps<T>) {
    const requestPopup = useRequestPopupDialog(plugin.name)
    const { mutateAsync: refreshMetadata } = plugin.useRefreshMetadata({
      requestPopup,
      meta,
    })

    useStartOnceMounted(refreshMetadata, variables, callbacks)

    return null
  }

  return Object.assign({}, plugin, {
    SynchronizeRequest,
    RefreshMetadataRequest,
  })
}
