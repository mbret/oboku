import { memo, type ReactNode, useEffect, useState } from "react"
import { useIsRestoring, useQueryClient } from "@tanstack/react-query"
import { SplashScreen } from "../common/SplashScreen"
import { CriticalError } from "../errors/errors.shared"
import { seedWebConfigFromCache, useConfig } from "./useConfig"

/**
 * Explicit boot boundary for remote configuration.
 *
 * Children rendered inside this component can assume configuration has been
 * loaded at least once for the current app boot.
 *
 * A schema-valid offline cache keeps `config` defined even when the endpoint is
 * unreachable, so an outage with a usable cache renders the app normally. Only
 * when the cache seed has been attempted and left no config *and* the fetch
 * errored is the failure unrecoverable — it escalates to the app-level error
 * boundary via `CriticalError` instead of hanging on the splash screen forever.
 */
export const LoadConfiguration = memo(function LoadConfiguration({
  children,
}: {
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const isRestoring = useIsRestoring()
  const {
    data: config,
    isError,
    error,
  } = useConfig({ refetchOnMount: "always" })
  const [hasAttemptedCacheSeed, setHasAttemptedCacheSeed] = useState(false)

  useEffect(
    function seedWebConfigFromCacheOnBoot() {
      if (isRestoring) return

      let active = true

      void seedWebConfigFromCache(queryClient).finally(() => {
        if (active) setHasAttemptedCacheSeed(true)
      })

      return function cancelSeedOnUnmount() {
        active = false
      }
    },
    [isRestoring, queryClient],
  )

  if (config) {
    return <>{children}</>
  }

  const cannotRecoverConfig = isError && hasAttemptedCacheSeed

  if (cannotRecoverConfig) {
    throw new CriticalError("Unable to load application configuration", {
      cause: error,
    })
  }

  return <SplashScreen show />
})
