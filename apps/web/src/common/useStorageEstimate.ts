import { useCallback, useEffect, useState } from "react"

interface ChromeStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB: number
  }
}

const STORAGE_ESTIMATE_INTERVAL_MS = 2000

export const useStorageEstimate = ({
  intervalMs = STORAGE_ESTIMATE_INTERVAL_MS,
}: {
  intervalMs?: number
} = {}) => {
  const [quota, setQuota] = useState<number>(0)
  const [usage, setUsage] = useState<number>(0)

  const runStorageEstimate = useCallback(() => {
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
    runStorageEstimate()
  }, [runStorageEstimate])

  useEffect(() => {
    if (intervalMs <= 0) return

    const intervalId = window.setInterval(runStorageEstimate, intervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [intervalMs, runStorageEstimate])

  return {
    quota,
    usage,
    refreshStorageEstimate: runStorageEstimate,
  }
}
