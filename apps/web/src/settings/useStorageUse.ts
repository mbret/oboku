import { useCallback, useEffect, useState } from "react"
import { useCoversCacheInformation } from "../covers/useCoversCacheInformation"

interface ChromeStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB: number
  }
}

const STORAGE_ESTIMATE_INTERVAL_MS = 2000

/**
 * Returns raw byte counts and a usage ratio. Callers are expected to
 * format with the shared {@link formatBytes} helper so the unit choice
 * (KB vs MB vs GB) lives in one place.
 */
export const useStorageUse = ({
  intervalMs = STORAGE_ESTIMATE_INTERVAL_MS,
}: {
  intervalMs?: number
} = {}) => {
  const [quota, setQuota] = useState<number>(0)
  const [usage, setUsage] = useState<number>(0)

  const refreshStorageEstimate = useCallback(() => {
    // not available in all browsers
    navigator.storage?.estimate().then((estimate) => {
      const estimateIndexedDBUsage = (estimate as ChromeStorageEstimate)
        ?.usageDetails?.indexedDB
      const nextUsage = estimateIndexedDBUsage ?? estimate.usage ?? 0

      if (typeof estimate.quota === "number") {
        setQuota(estimate.quota)
      }

      if (typeof nextUsage === "number") {
        setUsage(nextUsage)
      }
    })
  }, [])

  useEffect(() => {
    refreshStorageEstimate()
  }, [refreshStorageEstimate])

  useEffect(() => {
    if (intervalMs <= 0) return

    const intervalId = window.setInterval(refreshStorageEstimate, intervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [intervalMs, refreshStorageEstimate])

  const { data: coversSize } = useCoversCacheInformation()
  const quotaUsed = usage / (quota || 1)

  return {
    quota,
    usage,
    quotaUsed,
    coversWeightBytes: coversSize?.weight ?? 0,
    covers: coversSize?.size,
    refreshStorageEstimate,
  }
}
