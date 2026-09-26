import { useCallback } from "react"
import {
  localSettingsSignal,
  useLocalSettings,
} from "../../settings/useLocalSettings"
import { useSettings } from "../../settings/useSettings"

/**
 * The reader's font scale, a device setting. A device that has not changed it
 * yet uses the account-wide `readerGlobalFontScale`, which older versions of
 * the app save.
 *
 * TODO(ask the maintainer, added 2026-09): after a few months, once older
 * versions of the app are gone, raise dropping the fallback to
 * `readerGlobalFontScale` with the maintainer rather than removing it: a
 * device that never changed its font scale since would go back to the default.
 * The field stays in the RxDB settings schema while CouchDB documents hold it.
 */
export function useReaderFontScale() {
  const deviceFontScale = useLocalSettings("readerFontScale")
  const { data: settings } = useSettings()

  const updateFontScale = useCallback(function saveFontScaleOnDevice(
    fontScale: number,
  ) {
    localSettingsSignal.update(function withFontScale(localSettings) {
      return { ...localSettings, readerFontScale: fontScale }
    })
  }, [])

  return {
    fontScale: deviceFontScale ?? settings?.readerGlobalFontScale ?? undefined,
    updateFontScale,
  }
}
