import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"
import { ROUTES } from "./routes"

/**
 * react-router stores the history entry position under `idx` and rebuilds the
 * whole history state object on every push/replace, so custom keys cannot be
 * stamped alongside it. `idx > 0` means this app pushed an entry we can pop.
 */
const hasPoppableHistoryEntry = () => {
  const entryIndex: unknown = window.history.state?.idx

  return typeof entryIndex === "number" && entryIndex > 0
}

export const useSafeGoBack = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const goBack = useCallback(
    (defaultTo?: string) => {
      if (!hasPoppableHistoryEntry() && pathname !== ROUTES.HOME) {
        navigate(defaultTo ?? ROUTES.HOME, { replace: true })
      } else {
        navigate(-1)
      }
    },
    [navigate, pathname],
  )

  return useMemo(() => ({ goBack }), [goBack])
}
