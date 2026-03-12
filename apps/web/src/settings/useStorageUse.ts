import { useCoversCacheInformation } from "../covers/useCoversCacheInformation"
import { useStorageEstimate } from "../common/useStorageEstimate"

export const useStorageUse = (
  params: Parameters<typeof useStorageEstimate>[0] = {},
) => {
  const { quota, usage, refreshStorageEstimate } = useStorageEstimate(params)
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
