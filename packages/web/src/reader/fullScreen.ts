import { useEffect } from "react"
import { useRecoilValue } from "recoil"
import { localSettingsState } from "../settings/states"
import screenfull, { Screenfull } from 'screenfull'
import { IS_MOBILE_DEVICE } from "../constants"
import { Report } from "../debug/report"

const screenfullApi = screenfull as Screenfull

export const useFullScreenSwitch = () => {
  const localSettings = useRecoilValue(localSettingsState)

  useEffect(() => {
    if (
      (
        localSettings.readingFullScreenSwitchMode === 'always'
        || (localSettings.readingFullScreenSwitchMode === 'automatic' && IS_MOBILE_DEVICE)
      )
      && screenfullApi.isEnabled && !screenfullApi.isFullscreen) {
      screenfullApi.request(undefined, { navigationUI: 'hide' }).catch(Report.error)
    }

    return () => {
      if (screenfullApi.isEnabled && screenfullApi.isFullscreen) {
        screenfullApi.exit().catch(Report.error)
      }
    }
  }, [localSettings])
}