import type { MutationStatus } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { ROUTES } from "../navigation/routes"
import { useActiveProfile } from "../profiles"
import { SignOutBeforeContinuePage } from "./SignOutBeforeContinuePage"

/**
 * Wraps a screen whose completion mutation signs the user in (sign-up and
 * magic-link completion). A session that exists while the completion is still
 * `idle` belongs to someone already signed in, who must sign out first; a
 * session that appears once the completion has started is this screen's own
 * sign-in and goes home.
 *
 * `status` never reads `success` on this screen. The completion commits the
 * session before it settles, and the new active profile hands `App` a new
 * profile storage adapter, which resets `usePersistSignals` hydration and
 * unmounts the router until the profile is hydrated. Navigating as soon as the
 * session appears moves the location home before that remount; the remounted
 * screen would otherwise sit on an idle mutation with a session.
 */
export function CompleteAuthenticationGate({
  completionStatus,
  children,
}: {
  completionStatus: MutationStatus
  children: ReactNode
}) {
  const hasSession = !!useActiveProfile().data
  const hasSignedInFromThisScreen = hasSession && completionStatus !== "idle"

  if (hasSignedInFromThisScreen) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  if (hasSession) {
    return <SignOutBeforeContinuePage />
  }

  return <>{children}</>
}
