import { useEffect } from "react"
import { useReader } from "../states"
import { useReaderSettings } from "./useReaderSettings"

/**
 * Saves the spread mode chosen in the reader's layout menu as a device
 * setting, which the next reader is created with.
 */
export function usePersistSpreadMode() {
  const reader = useReader()
  const { updateReaderSettings } = useReaderSettings()

  useEffect(
    function saveSpreadModeWhenReaderChangesIt() {
      if (!reader) return

      const subscription = reader.settings
        .watch(["spreadMode"])
        .subscribe(function saveSpreadMode({ spreadMode }) {
          updateReaderSettings({ readerSpreadMode: spreadMode })
        })

      return function stopSavingSpreadMode() {
        subscription.unsubscribe()
      }
    },
    [reader, updateReaderSettings],
  )
}
