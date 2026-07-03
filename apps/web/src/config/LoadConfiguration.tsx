import { memo, type ReactNode, useEffect } from "react"
import { useIsRestoring, useQueryClient } from "@tanstack/react-query"
import { SplashScreen } from "../common/SplashScreen"
import { seedWebConfigFromCache, useConfig } from "./useConfig"

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
  const queryClient = useQueryClient()
  const isRestoring = useIsRestoring()
  const { data: config } = useConfig({ refetchOnMount: "always" })

  useEffect(
    function seedWebConfigFromCacheOnBoot() {
      if (isRestoring) return

      void seedWebConfigFromCache(queryClient)
    },
    [isRestoring, queryClient],
  )

  if (!config) {
    return <SplashScreen show />
  }

  return <>{children}</>
})
