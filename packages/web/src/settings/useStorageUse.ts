import { DependencyList, useEffect, useMemo, useState } from 'react';

interface ChromeStorageEstimate extends StorageEstimate {
  usageDetails?: {
    indexedDB: number
  }
}

export const useStorageUse = (deps: DependencyList | undefined) => {
  const [storageQuota, setStorageQuota] = useState<number | undefined>(undefined)
  const [indexedDBUsage, setIndexedDBUsage] = useState<number | undefined>(undefined)

  useEffect(() => {
    // not available in all browsers
    navigator.storage && navigator.storage.estimate().then((estimate) => {
      const estimateIndexedDBUsage = (estimate as ChromeStorageEstimate)?.usageDetails?.indexedDB
      estimate.quota && setStorageQuota(estimate.quota)
      estimateIndexedDBUsage && setIndexedDBUsage(estimateIndexedDBUsage)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const quotaUsed = (indexedDBUsage || 0) / (storageQuota || 1)
  const usedInMb = ((indexedDBUsage || 1) / 1e+6).toFixed(2)
  const quotaInGb = ((storageQuota || 1) / 1e+9).toFixed(2)

  return useMemo(() => ({
    quotaUsed,
    usedInMb,
    quotaInGb,
  }), [quotaUsed, usedInMb, quotaInGb])
}
