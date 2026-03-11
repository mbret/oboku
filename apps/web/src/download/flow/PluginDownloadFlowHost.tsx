import { memo } from "react"
import { useSignalValue } from "reactjrx"
import { DownloadFlowRequestItem } from "./DownloadFlowRequestItem"
import { downloadFlowRequestsSignal } from "./states"

const removeDownloadFlowRequest = (id: string) => {
  downloadFlowRequestsSignal.update((requests) =>
    requests.filter((request) => request.id !== id),
  )
}

export const cancelPluginDownloadFlow = (bookId: string) => {
  const requests = downloadFlowRequestsSignal.getValue()
  const matchingRequest = requests.find((request) => request.bookId === bookId)

  matchingRequest?.abortController.abort()
}

export const PluginDownloadFlowHost = memo(() => {
  const requests = useSignalValue(downloadFlowRequestsSignal)

  return (
    <>
      {requests.map((request) => (
        <DownloadFlowRequestItem
          key={request.id}
          onSettled={() => removeDownloadFlowRequest(request.id)}
          request={request}
        />
      ))}
    </>
  )
})
