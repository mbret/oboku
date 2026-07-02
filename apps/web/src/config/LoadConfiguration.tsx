import { memo, type ReactNode } from "react"
import { SplashScreen } from "../common/SplashScreen"
import { useConfig } from "./useConfig"

/**
 * Explicit boot boundary for remote configuration.
 *
 * Children rendered inside this component can assume configuration has been
 * loaded at least once for the current app boot.
 */
export const LoadConfiguration = memo(function LoadConfiguration({
  children,
}: {
  children: ReactNode
}) {
  const { data: config } = useConfig({ refetchOnMount: "always" })

  if (!config) {
    return <SplashScreen show />
  }

  return <>{children}</>
})
