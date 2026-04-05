import { memo, useEffect, type ReactNode } from "react"
import { useObserve } from "reactjrx"
import { SplashScreen } from "../common/SplashScreen"
import { configuration } from "./configuration"

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
  const { data: config } = useObserve(configuration.loaded$)

  useEffect(() => {
    configuration.ensureConfigLoaded()
  }, [])

  if (!config) {
    return <SplashScreen show />
  }

  return <>{children}</>
})
