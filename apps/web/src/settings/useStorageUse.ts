import { useCallback, useEffect, useState } from "react"
import { useCoversCacheInformation } from "../covers/useCoversCacheInformation"

interface ChromeStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB: number
  }
}

const STORAGE_ESTIMATE_INTERVAL_MS = 2000

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
  const coversWightInMb = ((coversSize?.weight ?? 0) / 1e6).toFixed(2)
  const quotaUsed = usage / (quota || 1)
  const usedInMb = (usage / 1e6).toFixed(2)
  const quotaInGb = (quota / 1e9).toFixed(2)

  return {
    quotaUsed,
    usedInMb,
    quotaInGb,
    coversWightInMb,
    covers: coversSize?.size,
    refreshStorageEstimate,
  }
}
