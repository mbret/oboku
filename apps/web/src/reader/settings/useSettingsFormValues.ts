import { useSettingsIncrementalPatch } from "../../settings/useSettingsIncrementalPatch"
import { useSettings } from "../../settings/useSettings"
import { useCallback, useEffect, useState } from "react"
import { useDebounced } from "reactjrx"

/**
 * @important
 * RxDB is not synchronous so we cannot use and set values on the Reader directly
 * through it. It would creates UX lag otherwise.
 * Additionally this lets us debounce db update.
 */
export const useSettingsFormValues = () => {
  const { data: settings, isSuccess } = useSettings()
  const { mutate: patchSettings } = useSettingsIncrementalPatch()
  const [isInitialized, setIsInitialized] = useState(false)
  const [globalFontScale, setGlobalFontScale] = useState(
    settings?.readerGlobalFontScale,
  )
  const debouncedPatchSettings = useDebounced(patchSettings, 250)

  const updateGlobalFontScale = useCallback(
    (fontScale: number) => {
      setGlobalFontScale(fontScale)
      debouncedPatchSettings({
        readerGlobalFontScale: fontScale,
      })
    },
    [debouncedPatchSettings],
  )

  useEffect(() => {
    if (isInitialized || !isSuccess || !settings) return

    setIsInitialized(true)
    setGlobalFontScale(settings.readerGlobalFontScale)
  }, [isSuccess, settings, isInitialized])

  return {
    isInitialized,
    globalFontScale,
    updateGlobalFontScale,
  }
}
