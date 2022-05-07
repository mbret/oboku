import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ROUTES } from "../constants"

export const useSafeGoBack = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const goBack = useCallback(() => {
    if (!window.history.state.__obokuCanGoBack && pathname !== ROUTES.HOME) {
      navigate(ROUTES.HOME, { replace: true })
    } else {
      navigate(-1)
    }
  }, [navigate, pathname])

  return useMemo(() => ({ goBack }), [goBack])
}
