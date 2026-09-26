import { useCallback } from "react"
import {
  type LocalSettings,
  localSettingsSignal,
  useLocalSettings,
} from "../../settings/useLocalSettings"
import { useSettings } from "../../settings/useSettings"

type ReaderSettingsOnDevice = Pick<LocalSettings, "readerFontScale">

/**
 * The reader settings the user changes from react-reader's menus, kept on the
 * device, each resolved to what the reader should use. A device that has not
 * changed its font scale yet uses the account-wide `readerGlobalFontScale`,
 * which older versions of the app save.
 *
 * TODO(ask the maintainer, added 2026-09): after a few months, once older
 * versions of the app are gone, raise dropping the fallback to
 * `readerGlobalFontScale` with the maintainer rather than removing it: a
 * device that never changed its font scale since would go back to the default.
 * The field stays in the RxDB settings schema while CouchDB documents hold it.
 */
export function useReaderSettings() {
  const { readerFontScale } = useLocalSettings(["readerFontScale"])
  const { data: accountSettings } = useSettings()

  const updateReaderSettings = useCallback(function saveReaderSettingsOnDevice(
    readerSettings: Partial<ReaderSettingsOnDevice>,
  ) {
    localSettingsSignal.update(function withReaderSettings(localSettings) {
      return { ...localSettings, ...readerSettings }
    })
  }, [])

  return {
    readerFontScale:
      readerFontScale ?? accountSettings?.readerGlobalFontScale ?? undefined,
    updateReaderSettings,
  }
}
