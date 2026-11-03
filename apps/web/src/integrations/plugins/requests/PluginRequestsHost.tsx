import type { DataSourceType } from "@oboku/shared"
import { useSignalValue } from "reactjrx"
import { getPluginByType } from "../configure"
import { type PluginRequest, pluginRequestsSignal } from "./pluginRequests"
import type {
  RefreshMetadataRequestProps,
  SynchronizeRequestProps,
} from "./registerPlugin"

function PluginSynchronizeRequest<T extends DataSourceType>(
  props: SynchronizeRequestProps<T>,
) {
  const { SynchronizeRequest } = getPluginByType(props.dataSource.type)

  return <SynchronizeRequest {...props} />
}

function PluginRefreshMetadataRequest<T extends DataSourceType>(
  props: RefreshMetadataRequestProps<T>,
) {
  const { RefreshMetadataRequest } = getPluginByType(props.variables.linkType)

  return <RefreshMetadataRequest {...props} />
}

function PluginRequestItem({ request }: { request: PluginRequest }) {
  if (request.kind === "synchronize") {
    return (
      <PluginSynchronizeRequest
        dataSource={request.dataSource}
        onResolve={request.resolve}
        onReject={request.reject}
      />
    )
  }

  return (
    <PluginRefreshMetadataRequest
      variables={request.variables}
      meta={request.meta}
      onResolve={request.resolve}
      onReject={request.reject}
    />
  )
}

export function PluginRequestsHost() {
  const requests = useSignalValue(pluginRequestsSignal)

  return requests.map((request) => (
    <PluginRequestItem key={request.id} request={request} />
  ))
}
