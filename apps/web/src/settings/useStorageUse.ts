import { type DependencyList, useEffect, useState } from "react"
import { useCoversCacheInformation } from "../covers/useCoversCacheInformation"

interface ChromeStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB: number
  }
}

export const useStorageUse = (deps: DependencyList | undefined) => {
  const [storageQuota, setStorageQuota] = useState<number | undefined>(
    undefined,
  )
  const [indexedDBUsage, setIndexedDBUsage] = useState<number | undefined>(
    undefined,
  )

  const { data: coversSize } = useCoversCacheInformation()

  useEffect(() => {
    // not available in all browsers
    navigator.storage?.estimate().then((estimate) => {
      const estimateIndexedDBUsage = (estimate as ChromeStorageEstimate)
        ?.usageDetails?.indexedDB
      estimate.quota && setStorageQuota(estimate.quota)
      estimateIndexedDBUsage && setIndexedDBUsage(estimateIndexedDBUsage)
    })
  }, deps)

  const coversWightInMb = ((coversSize?.weight ?? 0) / 1e6).toFixed(2)
  const quotaUsed = (indexedDBUsage || 0) / (storageQuota || 1)
  const usedInMb = ((indexedDBUsage || 1) / 1e6).toFixed(2)
  const quotaInGb = ((storageQuota || 1) / 1e9).toFixed(2)

  return {
    quotaUsed,
    usedInMb,
    quotaInGb,
    coversWightInMb,
    covers: coversSize?.size,
  }
}
