import { memo, type ReactNode, useEffect, useState } from "react"
import { migrateLegacyAuth } from "./migrateLegacyAuth"

/**
 * Boot boundary that runs the one-time legacy-auth import before any profile or
 * auth state is read, so a logged-in user from a pre-migration build is not
 * signed out on deploy. Temporary shim — remove once the legacy localStorage
 * auth format is no longer in the wild.
 */
export const LegacyAuthMigration = memo(function LegacyAuthMigration({
  children,
}: {
  children: ReactNode
}) {
  const [isMigrated, setIsMigrated] = useState(false)

  useEffect(function runLegacyAuthMigrationOnce() {
    let isMounted = true

    migrateLegacyAuth().then(function markMigrated() {
      if (isMounted) setIsMigrated(true)
    })

    return function cancelMigrationStateUpdate() {
      isMounted = false
    }
  }, [])

  if (!isMigrated) {
    return null // no need for splash, its very fast.
  }

  return <>{children}</>
})
