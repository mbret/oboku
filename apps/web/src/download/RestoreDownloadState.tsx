import { memo, useEffect } from "react"
import { from } from "rxjs"
import { useMutation$ } from "reactjrx"
import { reconcileDownloadStateFromStorage } from "./reconcileDownloadStateFromStorage"

const useRestoreDownloadState = ({ onSuccess }: { onSuccess: () => void }) => {
  return useMutation$({
    onSuccess,
    mutationFn: function restoreDownloadStateFromStorage() {
      return from(reconcileDownloadStateFromStorage())
    },
  })
}

export const RestoreDownloadState = memo(function RestoreDownloadState({
  onReady,
}: {
  onReady: () => void
}) {
  const { mutate: restoreDownloadState } = useRestoreDownloadState({
    onSuccess: onReady,
  })

  useEffect(
    function restoreDownloadStateOnMount() {
      restoreDownloadState()
    },
    [restoreDownloadState],
  )

  return null
})
