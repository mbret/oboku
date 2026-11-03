import type { DataSourceDocType, DataSourceType } from "@oboku/shared"
import type { MutationMeta } from "@tanstack/react-query"
import { type ComponentType, useEffect } from "react"
import { scheduleDelayedEffect } from "../../../common/useDelayEffect"
import type {
  ObokuPlugin,
  ProviderCredentialsResult,
  UseRefreshMetadataVariables,
} from "../types"
import { useCreateRequestPopupDialog } from "../useCreateRequestPopupDialog"

type RequestSettlers<T extends DataSourceType> = {
  onResolve: (result: ProviderCredentialsResult<T>) => void
  onReject: (error: unknown) => void
}

export type SynchronizeRequestProps<T extends DataSourceType> =
  RequestSettlers<T> & {
    dataSource: Extract<DataSourceDocType, { type: T }>
  }

export type RefreshMetadataRequestProps<T extends DataSourceType> =
  RequestSettlers<T> & {
    variables: UseRefreshMetadataVariables<T>
    meta: MutationMeta | undefined
  }

export type RegisteredPlugin<T extends DataSourceType = DataSourceType> =
  ObokuPlugin<T> & {
    SynchronizeRequest: ComponentType<SynchronizeRequestProps<T>>
    RefreshMetadataRequest: ComponentType<RefreshMetadataRequestProps<T>>
  }

/**
 * Adds the components that run the plugin's sync and metadata refresh hooks
 * for one request each, so generic code never calls a hook chosen by type.
 */
export function registerPlugin<T extends DataSourceType>(
  plugin: ObokuPlugin<T>,
): RegisteredPlugin<T> {
  function SynchronizeRequest({
    dataSource,
    onResolve,
    onReject,
  }: SynchronizeRequestProps<T>) {
    const createRequestPopupDialog = useCreateRequestPopupDialog()
    const { mutateAsync: synchronize } = plugin.useSynchronize({
      requestPopup: createRequestPopupDialog({ name: plugin.name }),
    })

    useEffect(
      function synchronizeOnceMounted() {
        return scheduleDelayedEffect(function startSynchronize() {
          synchronize(dataSource).then(onResolve, onReject)
        }, 1)
      },
      [dataSource, onReject, onResolve, synchronize],
    )

    return null
  }

  function RefreshMetadataRequest({
    variables,
    meta,
    onResolve,
    onReject,
  }: RefreshMetadataRequestProps<T>) {
    const createRequestPopupDialog = useCreateRequestPopupDialog()
    const { mutateAsync: refreshMetadata } = plugin.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: plugin.name }),
      meta,
    })

    useEffect(
      function refreshMetadataOnceMounted() {
        return scheduleDelayedEffect(function startRefreshMetadata() {
          refreshMetadata(variables).then(onResolve, onReject)
        }, 1)
      },
      [variables, onReject, onResolve, refreshMetadata],
    )

    return null
  }

  return Object.assign({}, plugin, {
    SynchronizeRequest,
    RefreshMetadataRequest,
  })
}
