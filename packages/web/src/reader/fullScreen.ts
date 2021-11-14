import { useEffect } from "react"
import { useRecoilValue } from "recoil"
import { localSettingsState } from "../settings/states"
import screenfull from 'screenfull'
import { IS_MOBILE_DEVICE } from "../constants"
import { Report } from "../debug/report"

export const useFullScreenSwitch = () => {
  const localSettings = useRecoilValue(localSettingsState)

  useEffect(() => {
    if (
      (
        localSettings.readingFullScreenSwitchMode === 'always'
        || (localSettings.readingFullScreenSwitchMode === 'automatic' && IS_MOBILE_DEVICE)
      )
      && screenfull.isEnabled && !screenfull.isFullscreen) {
        screenfull.request(undefined, { navigationUI: 'hide' }).catch(Report.error)
    }

    return () => {
      if (screenfull.isEnabled && screenfull.isFullscreen) {
        screenfull.exit().catch(Report.error)
      }
    }
  }, [localSettings])
}