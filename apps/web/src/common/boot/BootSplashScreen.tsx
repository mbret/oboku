import { memo } from "react"
import { useConfig } from "../../config/useConfig"
import { SplashScreen } from "../SplashScreen"

/**
 * The only place the splash screen is rendered. It sits above every boot
 * boundary so the logo is mounted once for the whole boot, rather than each
 * boundary rendering — and remounting — a splash of its own.
 */
export const BootSplashScreen = memo(function BootSplashScreen({
  isAppReady,
}: {
  isAppReady: boolean
}) {
  const { data: config } = useConfig()

  return <SplashScreen show={!config || !isAppReady} />
})
