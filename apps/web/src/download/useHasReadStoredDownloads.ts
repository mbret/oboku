import { useEffect, useEffectEvent } from "react"
import { notifyError } from "../notifications/toasts"
import { useStoredDownloads } from "./useStoredDownloads"

function hasReadStoredDownloads() {
  return true
}

/**
 * Whether the stored downloads have been read once. Mounted for the app's
 * lifetime, it keeps their live query open. A read that fails is notified
 * once, and the downloads stay unread.
 */
export const useHasReadStoredDownloads = () => {
  const {
    data: hasRead = false,
    error,
    isError: isReadFailing,
  } = useStoredDownloads(hasReadStoredDownloads)

  const notifyReadFailure = useEffectEvent(function notifyReadFailure() {
    notifyError(error)
  })

  useEffect(
    function notifyWhenReadStartsFailing() {
      if (isReadFailing) notifyReadFailure()
    },
    [isReadFailing],
  )

  return hasRead
}
