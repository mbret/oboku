import { memo } from "react"
import { useSignalValue } from "reactjrx"
import { useConfig } from "../../config/useConfig"
import { SplashScreen } from "../SplashScreen"
import { isAppReadyStateSignal } from "./states"

/**
 * The only place the splash screen is rendered. It sits above every boot
 * boundary so the logo is mounted once for the whole boot, rather than each
 * boundary rendering — and remounting — a splash of its own.
 */
export const BootSplashScreen = memo(function BootSplashScreen() {
  const { data: config } = useConfig()
  const isAppReady = useSignalValue(isAppReadyStateSignal)

  return <SplashScreen show={!config || !isAppReady} />
})
